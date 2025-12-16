/**
 * @fileoverview Contexte de gestion des messages (envoi, réception, chiffrement E2EE)
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppState } from 'react-native';
import apiService from '../services/apiService';
import chatService from '../services/chatService';
import * as notificationService from '../services/notificationService';
import i18n from '../constants/language/js/i18n';
import { useChannels } from './ChannelsContext';
import { useAuth } from './AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MESSAGE_MAX_LENGTH } from '../app/constants';
import E2EEDMService from '../services/crypto/E2EEDMService';
import E2EEManager from '../services/crypto/E2EEManager';
import E2EEMessageService from '../services/crypto/E2EEMessageService';

/**
 * Contexte de gestion des messages
 */
const MessagesContext = createContext({});

/**
 * Map pour dédupliquer les notifications récentes
 * Évite d'afficher plusieurs fois la même notification
 */
const recentNotifications = new Map();
const NOTIF_DEDUPE_MS = 2000;

/**
 * Vérifie si une notification doit être affichée (déduplication)
 * @param {string} key - Clé unique de la notification
 * @returns {boolean} True si la notification doit être affichée
 */
const shouldNotifyKey = (key) => {
    if (!key) return true;
    const now = Date.now();
    const last = recentNotifications.get(key) || 0;
    if (now - last < NOTIF_DEDUPE_MS) return false;
    recentNotifications.set(key, now);
    setTimeout(() => { try { recentNotifications.delete(key); } catch (_) {} }, NOTIF_DEDUPE_MS + 50);
    return true;
};

const dmTypeCache = new Map();
const resolveIsDM = async (channelId) => {
    if (!channelId) return false;
    const key = String(channelId);
    if (dmTypeCache.has(key)) return dmTypeCache.get(key);
    try {
        const res = await apiService.getChannel(channelId);
        if (res && res.success && res.data) {
            const payload = res.data.data || res.data;
            const isDM = (payload.type === 'dm' || payload.kind === 'dm');
            dmTypeCache.set(key, !!isDM);
            return !!isDM;
        }
    } catch (_) {}
    dmTypeCache.set(key, false);
    return false;
};

const toStr = (v) => {
    try { return String(v ?? '').trim(); } catch (_) { return ''; }
};
const firstNonEmpty = (...vals) => vals.find(v => toStr(v).length > 0) ?? '';

const pickUserName = (u) => {
    if (!u) return '';
    try {
        const base = (u.user || u.profile || u);
        return firstNonEmpty(base.username, base.name, base.displayName, base.login, base.email, base.handle);
    } catch (_) { return ''; }
};

const getOtherFromParticipants = (participants, currentUserId) => {
    if (!Array.isArray(participants)) return '';
    const meId = currentUserId ? String(currentUserId) : null;
    for (const p of participants) {
        try {
            const pid = firstNonEmpty(p.id, p.user_id, p.uid);
            if (!pid || (meId && String(pid) === meId)) continue;
            const nm = pickUserName(p);
            if (nm) return nm;
        } catch (_) {}
    }
    for (const p of participants) {
        const nm = pickUserName(p);
        if (nm) return nm;
    }
    return '';
};

const extractNameFromPayloads = (envelope, parsed) => {
    const fields = [
        envelope?.channelName, envelope?.channel, envelope?.name, envelope?.title,
        parsed?.channelName, parsed?.channel, parsed?.name, parsed?.title,
    ];
    return firstNonEmpty(...fields);
};

export let _externalResetConversation = null;
export const registerMessagesResetHandler = (fn) => { _externalResetConversation = fn; };
export const unregisterMessagesResetHandler = () => { _externalResetConversation = null; };
export const triggerExternalResetConversation = async () => { try { if (_externalResetConversation) await _externalResetConversation(); } catch (_) {} };

export const MessagesProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentChannelId, setCurrentChannelId] = useState(null);
    const [typingUsers, setTypingUsers] = useState([]);
    const pendingMessagesQueue = useRef([]);
    const isProcessingQueue = useRef(false);
    const messageIdCounter = useRef(0);

    const { channels, dms } = useChannels();
    const { user: authUser } = useAuth();

    const appState = useRef(AppState.currentState);
    const lastReloadTime = useRef(Date.now());

    useEffect(() => {
        const handleAppStateChange = async (nextAppState) => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                const now = Date.now();
                if (now - lastReloadTime.current > 5000 && currentChannelId) {
                    lastReloadTime.current = now;

                    try {
                        const result = await apiService.getMessages(currentChannelId);
                        if (result.success && result.data?.data) {
                            const serverMessages = Array.isArray(result.data.data) ? result.data.data : [];

                            setMessages(prev => {
                                const pendingMessages = prev.filter(msg => msg.isPending);
                                const mergedMessages = [...serverMessages];

                                pendingMessages.forEach(pendingMsg => {
                                    const exists = serverMessages.some(serverMsg =>
                                        serverMsg.content === pendingMsg.content &&
                                        serverMsg.userId === pendingMsg.userId &&
                                        Math.abs(new Date(serverMsg.createdAt) - new Date(pendingMsg.createdAt)) < 5000
                                    );

                                    if (!exists) {
                                        mergedMessages.push(pendingMsg);
                                    }
                                });

                                return mergedMessages.sort((a, b) =>
                                    new Date(a.createdAt) - new Date(b.createdAt)
                                );
                            });
                        }
                    } catch {}
                }
            }

            appState.current = nextAppState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription?.remove();
        };
    }, [currentChannelId]);

    const generateTempId = useCallback(() => {
        messageIdCounter.current += 1;
        return `temp_${Date.now()}_${messageIdCounter.current}`;
    }, []);

    const processMessageQueue = useCallback(async () => {
        if (isProcessingQueue.current || pendingMessagesQueue.current.length === 0) {
            return;
        }

        isProcessingQueue.current = true;

        while (pendingMessagesQueue.current.length > 0) {
            const pendingMessage = pendingMessagesQueue.current[0];

            try {
                const result = await apiService.sendMessage(pendingMessage.channelId, {
                    content: pendingMessage.content
                });

                if (result.success) {
                    setMessages(prev => {
                        const filtered = prev.filter(msg => msg.id !== pendingMessage.tempId);
                        const serverMessage = result.data?.data || result.data;

                        const exists = filtered.some(msg => msg.id === serverMessage.id);
                        if (exists) return filtered;

                        return [...filtered, serverMessage];
                    });

                    pendingMessagesQueue.current.shift();

                    if (pendingMessage.retryCount > 0) {
                        notificationService.success(i18n.t('messageSent'), 2000);
                    }
                } else {
                    pendingMessage.retryCount = (pendingMessage.retryCount || 0) + 1;
                    break;
                }
            } catch {
                pendingMessage.retryCount = (pendingMessage.retryCount || 0) + 1;
                break;
            }
        }

        isProcessingQueue.current = false;

        if (pendingMessagesQueue.current.length > 0) {
            setTimeout(() => processMessageQueue(), 5000);
        }
    }, []);

    useEffect(() => {
        const handleWebSocketConnected = async () => {
            if (currentChannelId) {
                try {
                    const result = await apiService.getMessages(currentChannelId);
                    if (result.success && result.data?.data) {
                        const serverMessages = Array.isArray(result.data.data) ? result.data.data : [];

                        setMessages(prev => {
                            const pendingMessages = prev.filter(msg => msg.isPending);
                            const mergedMessages = [...serverMessages];

                            pendingMessages.forEach(pendingMsg => {
                                const exists = serverMessages.some(serverMsg =>
                                    serverMsg.content === pendingMsg.content &&
                                    serverMsg.userId === pendingMsg.userId &&
                                    Math.abs(new Date(serverMsg.createdAt) - new Date(pendingMsg.createdAt)) < 5000
                                );

                                if (!exists) {
                                    mergedMessages.push(pendingMsg);
                                }
                            });

                            return mergedMessages.sort((a, b) =>
                                new Date(a.createdAt) - new Date(b.createdAt)
                            );
                        });

                        setTimeout(() => {
                            processMessageQueue();
                        }, 500);
                    } else {
                        processMessageQueue();
                    }
                } catch {
                    processMessageQueue();
                }
            } else {
                processMessageQueue();
            }
        };

        chatService.on('websocket_connected', handleWebSocketConnected);

        return () => {
            chatService.off('websocket_connected', handleWebSocketConnected);
        };
    }, [processMessageQueue, currentChannelId]);

    const loadMessages = useCallback(async (channelId) => {
        if (!channelId) return;

        setLoading(true);
        setCurrentChannelId(channelId);

        try {
            const [normalResp, membersResp] = await Promise.all([
                apiService.getMessages(channelId).catch(() => ({ success: false, data: { data: [] } })),
                apiService.getChannelMembers(channelId).catch(() => ({ success: false, data: null }))
            ]);

            let normalMessages = Array.isArray(normalResp.data?.data) ? normalResp.data.data : [];
            let encryptedMessages = [];

            const membersMap = new Map();
            if (membersResp.success && membersResp.data) {
                const members = membersResp.data.data || membersResp.data;
                members.forEach((member) => {
                    const memberId = member.user_id || (member.user && member.user.id) || member.id;
                    const memberName = member.user_name || (member.user && member.user.name) || member.name;
                    if (memberId && memberName) {
                        membersMap.set(memberId, memberName);
                    }
                });
            }

            // Récupérer les messages chiffrés si E2EE est initialisé
            if (E2EEManager.isInitialized()) {
                try {
                    const encryptedResp = await apiService.getEncryptedMessages(channelId);
                    encryptedMessages = Array.isArray(encryptedResp.data?.data?.messages)
                        ? encryptedResp.data.data.messages
                        : Array.isArray(encryptedResp.data?.data)
                        ? encryptedResp.data.data
                        : [];
                } catch (error) {
                    console.warn('[MessagesContext] Impossible de récupérer les messages chiffrés:', error);
                    encryptedMessages = [];
                }
            }

            // Déchiffrer les messages chiffrés
            if (encryptedMessages.length > 0) {
                let sessionKey = E2EEManager.getSessionKey(channelId);

                if (!sessionKey) {
                    try {
                        sessionKey = await E2EEManager.fetchSessionKey(channelId);
                    } catch {
                        // Impossible de récupérer la clé de session
                    }
                }

                if (sessionKey) {
                    encryptedMessages = await Promise.all(
                        encryptedMessages.map(async (msg) => {
                            try {
                                let authorName = 'Utilisateur';
                                let userId = msg.sender_id || msg.user_id || (msg.user ? msg.user.id : null);

                                // Résoudre le nom de l'auteur
                                if (msg.user && msg.user.name) {
                                    authorName = msg.user.name;
                                } else if (msg.sender && msg.sender.name) {
                                    authorName = msg.sender.name;
                                } else if (userId && membersMap.has(userId)) {
                                    authorName = membersMap.get(userId);
                                }

                                // Déchiffrer le message
                                if (msg.encrypted_content && msg.iv && msg.auth_tag) {
                                    const decrypted = await E2EEMessageService.decryptMessage(
                                        {
                                            encryptedContent: msg.encrypted_content,
                                            iv: msg.iv,
                                            authTag: msg.auth_tag
                                        },
                                        sessionKey
                                    );

                                    return {
                                        id: msg.id,
                                        content: decrypted || '[Message - échec déchiffrement]',
                                        user: msg.user || { id: userId, name: authorName },
                                        user_id: userId,
                                        created_at: msg.created_at,
                                        isEncrypted: true,
                                        isDecrypted: !!decrypted,
                                        isE2EE: true
                                    };
                                }

                                return {
                                    id: msg.id,
                                    content: '[Message - données manquantes]',
                                    user: msg.user || { id: userId, name: authorName },
                                    user_id: userId,
                                    created_at: msg.created_at,
                                    isEncrypted: true,
                                    isDecrypted: false,
                                    isE2EE: true
                                };
                            } catch {
                                const userId = msg.sender_id || msg.user_id || (msg.user ? msg.user.id : null);
                                const authorName = userId && membersMap.has(userId) ? membersMap.get(userId) : 'Utilisateur';

                                return {
                                    id: msg.id,
                                    content: '[Message - erreur]',
                                    user: msg.user || { id: userId, name: authorName },
                                    user_id: userId,
                                    created_at: msg.created_at,
                                    isEncrypted: true,
                                    isDecrypted: false,
                                    isE2EE: true
                                };
                            }
                        })
                    );
                } else {
                    // Pas de clé de session disponible
                    encryptedMessages = encryptedMessages.map((msg) => {
                        const userId = msg.sender_id || msg.user_id || (msg.user ? msg.user.id : null);
                        const authorName = userId && membersMap.has(userId) ? membersMap.get(userId) : 'Utilisateur';

                        return {
                            id: msg.id,
                            content: '[Message - clé indisponible]',
                            user: msg.user || { id: userId, name: authorName },
                            user_id: userId,
                            created_at: msg.created_at,
                            isEncrypted: true,
                            isDecrypted: false,
                            isE2EE: true
                        };
                    });
                }
            }

            // Fusionner et trier tous les messages par date
            const allMessages = [...normalMessages, ...encryptedMessages];
            allMessages.sort((a, b) => {
                const dateA = new Date(a.created_at || 0);
                const dateB = new Date(b.created_at || 0);
                return dateA - dateB;
            });

            setMessages(allMessages);
        } catch (error) {
            console.error('[MessagesContext] Error loading messages:', error);
            setMessages([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const sendMessage = useCallback(async (channelId, content) => {
        // Validation de la longueur du message
        if (content.length > MESSAGE_MAX_LENGTH) {
            notificationService.error(
                i18n.t('messageTooLong', { max: MESSAGE_MAX_LENGTH }) ||
                `Message cannot exceed ${MESSAGE_MAX_LENGTH} characters.`
            );
            return {
                success: false,
                error: 'MESSAGE_TOO_LONG'
            };
        }

        const tempId = generateTempId();
        const timestamp = new Date().toISOString();

        const optimisticMessage = {
            id: tempId,
            content: content,
            channelId: channelId,
            userId: authUser?.id,
            user_id: authUser?.id,
            user: authUser,
            createdAt: timestamp,
            created_at: timestamp,
            isPending: true,
        };

        setMessages(prev => [...prev, optimisticMessage]);

        let notificationTimer = setTimeout(() => {
            notificationService.warning(i18n.t('messageSendTimeout'), 4000);
        }, 1500);

        try {
            let shouldUseE2EE = false;

            const isDM = await resolveIsDM(channelId);
            if (isDM) {
                await E2EEDMService.initialize();
                const dmState = E2EEDMService.dmStates?.get(channelId);
                shouldUseE2EE = dmState?.enabled === true;
            }

            let result;

            if (shouldUseE2EE && E2EEManager.isInitialized()) {
                try {
                    let sessionKey = E2EEManager.getSessionKey(channelId);

                    if (!sessionKey) {
                        sessionKey = await E2EEManager.fetchSessionKey(channelId);
                    }

                    if (!sessionKey) {
                        try {
                            const membersResponse = await apiService.getChannelMembers(channelId);

                            if (membersResponse.success) {
                                const membersData = membersResponse.data?.data || membersResponse.data;

                                if (Array.isArray(membersData) && membersData.length > 0) {
                                    const memberIds = membersData.map(member => member.id || member.user_id).filter(id => id);

                                    const distributed = await E2EEManager.createAndDistributeSessionKey(channelId, memberIds);

                                    if (distributed) {
                                        sessionKey = E2EEManager.getSessionKey(channelId);
                                    }
                                }
                            }
                        } catch {
                            // Erreur lors de la création de la clé
                        }
                    }

                    if (!sessionKey) {
                        throw new Error('Session key not available');
                    }

                    // Chiffrer le message
                    const encrypted = await E2EEMessageService.encryptMessage(content, sessionKey);

                    result = await apiService.sendEncryptedMessage(channelId, {
                        encrypted_content: encrypted.encryptedContent,
                        iv: encrypted.iv,
                        auth_tag: encrypted.authTag
                    });
                } catch {
                    if (notificationTimer) {
                        clearTimeout(notificationTimer);
                        notificationTimer = null;
                    }

                    setMessages(prev => prev.filter(msg => msg.id !== tempId));

                    notificationService.error(
                        '🔒 Erreur de chiffrement E2EE. Le message n\'a pas été envoyé pour des raisons de sécurité.',
                        5000
                    );

                    return {
                        success: false,
                        error: 'E2EE_ENCRYPTION_FAILED',
                        message: 'Impossible de chiffrer le message. Le message n\'a pas été envoyé.'
                    };
                }
            } else if (shouldUseE2EE && !E2EEManager.isInitialized()) {
                if (notificationTimer) {
                    clearTimeout(notificationTimer);
                    notificationTimer = null;
                }

                setMessages(prev => prev.filter(msg => msg.id !== tempId));

                notificationService.error(
                    '🔒 E2EE non initialisé. Veuillez vous reconnecter.',
                    5000
                );

                return {
                    success: false,
                    error: 'E2EE_NOT_INITIALIZED',
                    message: 'E2EE est requis mais non initialisé'
                };
            } else {
                result = await apiService.sendMessage(channelId, { content });
            }

            if (notificationTimer) {
                clearTimeout(notificationTimer);
                notificationTimer = null;
            }

            if (result.success) {
                const serverMessage = result.data?.data || result.data;

                // Si c'est un message E2EE, déchiffrer avant d'afficher
                if (shouldUseE2EE && serverMessage.encrypted_content) {
                    try {
                        const sessionKey = E2EEManager.getSessionKey(channelId);
                        if (sessionKey) {
                            const decrypted = await E2EEMessageService.decryptMessage(
                                {
                                    encryptedContent: serverMessage.encrypted_content,
                                    iv: serverMessage.iv || serverMessage.content_iv,
                                    authTag: serverMessage.auth_tag || serverMessage.content_auth_tag
                                },
                                sessionKey
                            );

                            // Créer une version déchiffrée du message
                            serverMessage.content = decrypted || '[Message - échec déchiffrement]';
                            serverMessage.isEncrypted = true;
                            serverMessage.isDecrypted = !!decrypted;
                            serverMessage.isE2EE = true;
                        }
                    } catch {
                        // Si le déchiffrement échoue, afficher un message d'erreur
                        serverMessage.content = '[Message - erreur de déchiffrement]';
                        serverMessage.isEncrypted = true;
                        serverMessage.isDecrypted = false;
                        serverMessage.isE2EE = true;
                    }
                }

                setMessages(prev => {
                    const filtered = prev.filter(msg => msg.id !== tempId);
                    const exists = filtered.some(msg => msg.id === serverMessage.id);
                    if (exists) return filtered;
                    return [...filtered, serverMessage];
                });

                return { success: true, data: result.data };
            } else {
                if (result.data?.error === 'MESSAGE_TOO_LONG') {
                    // Retirer le message optimiste
                    setMessages(prev => prev.filter(msg => msg.id !== tempId));

                    notificationService.error(
                        result.data.message ||
                        i18n.t('messageTooLong', { max: MESSAGE_MAX_LENGTH })
                    );
                    return { success: false, error: 'MESSAGE_TOO_LONG' };
                }

                pendingMessagesQueue.current.push({
                    tempId: tempId,
                    channelId: channelId,
                    content: content,
                    timestamp: timestamp,
                    retryCount: 0,
                });

                setTimeout(() => processMessageQueue(), 2000);

                return { success: true, queued: true };
            }
        } catch (error) {
            console.error('[MessagesContext] ❌ Erreur lors de l\'envoi:', error);

            if (notificationTimer) {
                clearTimeout(notificationTimer);
            }

            pendingMessagesQueue.current.push({
                tempId: tempId,
                channelId: channelId,
                content: content,
                timestamp: timestamp,
                retryCount: 0,
            });

            setTimeout(() => processMessageQueue(), 2000);

            return { success: true, queued: true };
        }
    }, [authUser, generateTempId, processMessageQueue]);

    const sendVoiceMessage = useCallback(async (channelId, audioFile, duration) => {
        const tempId = generateTempId();
        const timestamp = new Date().toISOString();

        const optimisticMessage = {
            id: tempId,
            type: 'voice',
            content: '[Voice Message]',
            file_url: audioFile.uri,
            duration: duration,
            channelId: channelId,
            userId: authUser?.id,
            user_id: authUser?.id,
            user: authUser,
            createdAt: timestamp,
            created_at: timestamp,
            isPending: true,
        };

        setMessages(prev => [...prev, optimisticMessage]);

        try {
            const result = await apiService.sendVoiceMessage(channelId, audioFile, duration);

            console.log('[MessagesContext] Voice message result:', result);

            if (result.success) {
                const serverMessage = result.data?.data || result.data;

                setMessages(prev => {
                    const filtered = prev.filter(msg => msg.id !== tempId);
                    const exists = filtered.some(msg => msg.id === serverMessage.id);
                    if (exists) return filtered;
                    return [...filtered, serverMessage];
                });

                notificationService.success(
                    i18n.t('voiceMessageSent') || 'Voice message sent!',
                    2000
                );

                return { success: true, data: serverMessage };
            } else {
                setMessages(prev => prev.filter(msg => msg.id !== tempId));

                let errorMsg = i18n.t('voiceMessageSendFailed') || 'Failed to send voice message';

                if (result.data?.message) {
                    errorMsg = result.data.message;
                } else if (result.data?.errors) {
                    const errors = Object.values(result.data.errors).flat();
                    errorMsg = errors.join(', ');
                } else if (result.error) {
                    errorMsg = result.error;
                }

                console.error('[MessagesContext] Voice message failed:', errorMsg);
                notificationService.error(errorMsg, 5000);

                return { success: false, error: errorMsg };
            }
        } catch (error) {
            console.error('[MessagesContext] Voice message exception:', error);
            setMessages(prev => prev.filter(msg => msg.id !== tempId));

            const errorMsg = error.message ||
                i18n.t('voiceMessageSendFailed') ||
                'Failed to send voice message';

            notificationService.error(errorMsg, 4000);

            return { success: false, error: errorMsg };
        }
    }, [authUser, generateTempId]);

    const sendFileAttachment = useCallback(async (channelId, file) => {
        console.log('[MessagesContext] sendFileAttachment called:', file);

        const tempId = generateTempId();
        const timestamp = new Date().toISOString();

        const optimisticMessage = {
            id: tempId,
            type: 'attachment',
            content: '[Pièce jointe]',
            file_url: file.uri,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type || file.mimeType,
            channel_id: channelId,
            user_id: authUser?.id,
            user: authUser,
            created_at: timestamp,
            isPending: true,
        };

        setMessages(prev => [...prev, optimisticMessage]);

        try {
            console.log('[MessagesContext] Calling apiService.sendFileAttachment...');
            const result = await apiService.sendFileAttachment(channelId, file);

            console.log('[MessagesContext] Upload result:', result);

            if (result.success) {
                const serverMessage = result.data?.data || result.data;

                setMessages(prev => {
                    const filtered = prev.filter(msg => msg.id !== tempId);
                    const exists = filtered.some(msg => msg.id === serverMessage.id);
                    if (exists) return filtered;
                    return [...filtered, serverMessage];
                });

                notificationService.success(i18n.t('fileAttachmentSent') || 'File sent!', 2000);
                return { success: true, data: serverMessage };
            }

            setMessages(prev => prev.filter(msg => msg.id !== tempId));

            let errorMsg = i18n.t('fileAttachmentSendFailed');

            if (result.data?.message) errorMsg = result.data.message;
            if (result.data?.errors) {
                const errors = Object.values(result.data.errors).flat();
                errorMsg = errors.join(', ');
            }
            if (result.error) errorMsg = result.error;

            console.error('[MessagesContext] Attachment failed:', errorMsg);
            notificationService.error(errorMsg, 5000);

            return { success: false, error: errorMsg };

        } catch (error) {
            console.error('[MessagesContext] Attachment exception:', error);

            setMessages(prev => prev.filter(msg => msg.id !== tempId));

            const errorMsg =
                error.message ||
                i18n.t('fileAttachmentSendFailed') ||
                'Failed to send file';

            notificationService.error(errorMsg, 4000);

            return { success: false, error: errorMsg };
        }
    }, [authUser, generateTempId]);

    const deleteMessage = useCallback(async (messageId) => {
        try {
            const result = await apiService.deleteMessage(messageId);
            if (result.success) {
                setMessages(prev => prev.filter(msg => msg.id !== messageId));
                return { success: true };
            }
            return { success: false, error: result.error };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }, []);

    const startTyping = useCallback((channelId) => {
        chatService.websocketService?.startTyping(channelId);
    }, []);

    const stopTyping = useCallback((channelId) => {
        chatService.websocketService?.stopTyping(channelId);
    }, []);

    const clearMessages = useCallback(() => {
        setMessages([]);
        setCurrentChannelId(null);
        setTypingUsers([]);
    }, []);

    const getMessageMaxLength = useCallback(() => {
        return MESSAGE_MAX_LENGTH;
    }, []);

    const resetConversation = useCallback(async () => {
        setMessages([]);
        setCurrentChannelId(null);
        setTypingUsers([]);
        pendingMessagesQueue.current = [];
        isProcessingQueue.current = false;
        messageIdCounter.current = 0;
        try {
            const keysToRemove = ['selectedChannel', 'selectedDm', 'messages', 'draftMessage', '@selectedChannel', '@selectedDm', 'conversationDraft'];
            await Promise.all(keysToRemove.map(k => {
                try { return AsyncStorage.removeItem(k); } catch (_) { return Promise.resolve(); }
            }));
        } catch (_) {}
    }, []);

    useEffect(() => {
        registerMessagesResetHandler(resetConversation);
        return () => { unregisterMessagesResetHandler(); };
    }, [resetConversation]);

    useEffect(() => {
        const handleNewMessage = (data) => {
            try {
                const envelopeChannelId = data?.channelId;

                let parsed = null;
                if (data && data.message) {
                    if (typeof data.message === 'object') parsed = data.message;
                    else if (typeof data.message === 'string') {
                        try { parsed = JSON.parse(data.message); } catch (_) { parsed = null; }
                    }
                }

                const parsedChannelId = parsed?.channelId;
                const incomingChannelId = envelopeChannelId || parsedChannelId;

                if (incomingChannelId && currentChannelId && String(incomingChannelId) === String(currentChannelId)) {
                    try {
                        const messageData = parsed || (typeof data.message === 'string' ? JSON.parse(data.message) : data.message);
                        if (messageData) {
                            setMessages(prev => {
                                const tempMessage = prev.find(msg =>
                                    msg.isPending &&
                                    msg.content === messageData.content &&
                                    msg.userId === messageData.userId
                                );

                                if (tempMessage) {
                                    return prev.map(msg =>
                                        msg.id === tempMessage.id ? messageData : msg
                                    );
                                }

                                const exists = prev.some(msg => msg.id === messageData.id);
                                if (exists) return prev;

                                return [...prev, messageData];
                            });
                        }
                    } catch (_) {}
                }
            } catch (_) {}
        };

        chatService.on('new_message', handleNewMessage);

        return () => {
            chatService.off('new_message', handleNewMessage);
        };
    }, [currentChannelId]);

    useEffect(() => {
        const resolveDisplayName = async (channelId, isDM, envelope, parsed) => {
            const idStr = String(channelId);

            let name = extractNameFromPayloads(envelope, parsed);

            if (!name) {
                if (isDM) {
                    try {
                        const dmItem = Array.isArray(dms) ? dms.find(dm => String(dm?.id) === idStr) : null;
                        if (dmItem) {
                            const lists = [dmItem.members];
                            for (const lst of lists) {
                                const nm = getOtherFromParticipants(lst, authUser?.id);
                                if (nm) { name = nm; break; }
                            }
                            if (!name) {
                                name = firstNonEmpty(dmItem.other, dmItem.username, dmItem.title, dmItem.name);
                            }
                        }
                    } catch (_) {}
                } else {
                    try {
                        const ch = Array.isArray(channels) ? channels.find(c => String(c?.id) === idStr) : null;
                        if (ch) {
                            name = firstNonEmpty(ch.name, ch.title, ch.channel, ch.slug);
                        }
                    } catch (_) {}
                }
            }

            if (!name) {
                try {
                    const res = await apiService.getChannel(channelId);
                    if (res && res.success && res.data) {
                        const payload = res.data.data || res.data;
                        if (isDM || payload.type === 'dm' || payload.kind === 'dm') {
                            const lists = [payload.members];
                            for (const lst of lists) {
                                const nm = getOtherFromParticipants(lst, authUser?.id);
                                if (nm) { name = nm; break; }
                            }
                            if (!name) name = firstNonEmpty(payload.other, payload.username, payload.title, payload.name);
                        } else {
                            name = firstNonEmpty(payload.name, payload.title, payload.channel, payload.slug);
                        }
                    }
                } catch (_) {}
            }

            return toStr("#" + name);
        };

        const handleMessageNotification = (data) => {
            try {
                const envelopeChannelId = data?.channelId;

                let parsed = null;
                if (data && data.message) {
                    if (typeof data.message === 'object') parsed = data.message;
                    else if (typeof data.message === 'string') {
                        try { parsed = JSON.parse(data.message); } catch (_) { parsed = null; }
                    }
                }

                const parsedChannelId = parsed?.channelId;
                const incomingChannelId = envelopeChannelId || parsedChannelId;
                const parsedMessageId = parsed?.id;

                if (incomingChannelId && currentChannelId && String(incomingChannelId) === String(currentChannelId)) {
                    return;
                }

                let dedupeKey;
                if (parsedMessageId) {
                    dedupeKey = `msg:${parsedMessageId}`;
                } else if (incomingChannelId) {
                    dedupeKey = `ch:${incomingChannelId}`;
                } else {
                    dedupeKey = null;
                }
                if (!shouldNotifyKey(dedupeKey)) return;

                if (incomingChannelId) {
                    resolveIsDM(incomingChannelId).then((isDM) => {
                        if (!isDM) return;
                        (async () => {
                            try {
                                const displayName = await resolveDisplayName(incomingChannelId,
                                    true, data, parsed);
                                const text =
                                    i18n.t('newMessageInChannel', { channel: displayName });
                                notificationService.dmNotification(text);
                            } catch (_) {
                                try { notificationService.dmNotification(i18n.t('newMessageInChannel',
                                    { channel: '#' + String(incomingChannelId) })); } catch(__) {}
                            }
                        })();
                    }).catch(() => {});
                }
            } catch (_) {}
        };

        chatService.on('message_notification', handleMessageNotification);

        return () => {
            chatService.off('message_notification', handleMessageNotification);
        };
    }, [currentChannelId, channels, dms, authUser?.id]);

    useEffect(() => {
        const handleTyping = (data) => {
            try {
                const { channelId, userId, username } = data || {};
                if (!channelId || !userId) return;
                if (String(channelId) !== String(currentChannelId)) return;

                if (userId === authUser?.id) return;

                setTypingUsers(prev => {
                    const exists = prev.some(u => u.id === userId);
                    if (exists) return prev;
                    return [...prev, { id: userId, username: username }];
                });
            } catch (_) {}
        };

        const handleStopTyping = (data) => {
            try {
                const { channelId, userId } = data || {};
                if (!channelId || !userId) return;
                if (String(channelId) !== String(currentChannelId)) return;
                setTypingUsers(prev => prev.filter(u => u.id !== userId));
            } catch (_) {}
        };

        chatService.on('user_typing_start', handleTyping);
        chatService.on('user_typing_stop', handleStopTyping);

        return () => {
            chatService.off('user_typing_start', handleTyping);
            chatService.off('user_typing_stop', handleStopTyping);
        };
    }, [currentChannelId, authUser?.id]);

    const value = useMemo(() => ({
        messages,
        loading,
        currentChannelId,
        typingUsers,
        loadMessages,
        sendMessage,
        sendVoiceMessage,
        sendFileAttachment,
        deleteMessage,
        startTyping,
        stopTyping,
        clearMessages,
        setCurrentChannelId,
        resetConversation,
        getMessageMaxLength,
    }), [messages, loading, currentChannelId, typingUsers,
        loadMessages, sendMessage, sendVoiceMessage, sendFileAttachment, deleteMessage, startTyping, stopTyping, clearMessages, resetConversation, getMessageMaxLength]);

    return (
        <MessagesContext.Provider value={value}>
            {children}
        </MessagesContext.Provider>
    );
};

export const useMessages = () => {
    const context = useContext(MessagesContext);
    if (!context) {
        throw new Error('useMessages must be used within MessagesProvider');
    }
    return context;
};

export default MessagesContext;

