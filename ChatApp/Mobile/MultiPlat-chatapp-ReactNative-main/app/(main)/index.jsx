/**
 * @fileoverview Écran principal du chat avec liste des canaux et zone de messages
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    Animated, KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageBubble } from '../../components/MessageBubble';
import { UsersModal } from '../../components/UsersModal';
import { XPButton } from '../../components/XPButton';
import E2EEToggle from '../../components/E2EEToggle';
import AttachmentMenu from '../../components/AttachmentMenu';
import '../../constants/language/js/i18n';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useChat } from '../../hooks/useChat';
import { createStyles } from './ChatScreen.styles';
import { MESSAGE_MAX_LENGTH } from '../../app/constants';

/**
 * Écran principal du chat de l'application
 * Affiche la liste des canaux/DMs à gauche et les messages à droite
 * Gère l'envoi de messages texte, vocaux et fichiers
 * Supporte le chiffrement E2EE pour les messages privés
 * @returns {JSX.Element} Interface complète du chat
 */
export default function ChatScreen() {
    const {t, i18n} = useTranslation();
    const { theme, isDarkMode } = useTheme();
    const { isAuthenticated } = useAuth();
    const {
        user,
        logout,
        channels,
        dms,
        selectedChannel,
        loadChannels,
        selectChannel,
        joinChannel,
        leaveChannel,
        messages,
        loadMessages,
        sendMessage,
        sendVoiceMessage,
        sendFileAttachment,
        startTyping,
        stopTyping,
        typingUsers,
        isWebSocketConnected,
        channelsLoading,
        messagesLoading,
        getMessageMaxLength,
    } = useChat();

    const [message, setMessage] = useState('');
    const [sidebarExpanded, setSidebarExpanded] = useState(true);
    const [channelsExpanded, setChannelsExpanded] = useState(true);
    const [dmsExpanded, setDmsExpanded] = useState(true);
    const [usersModalVisible, setUsersModalVisible] = useState(false);
    const scrollViewRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const [sidebarWidth] = useState(new Animated.Value(sidebarExpanded ? 200 : 0));
    const [rotateAnim] = useState(new Animated.Value(sidebarExpanded ? 1 : 0));
    const isAdmin = user?.role === 'admin';

    const selectedChannelId = selectedChannel?.id;

    useEffect(() => {
        loadChannels();
    }, [loadChannels]);

    useEffect(() => {
        if (selectedChannelId) {
            loadMessages(selectedChannelId);
        }
    }, [loadMessages, selectedChannelId]);

    useEffect(() => {
        if (scrollViewRef.current && messages.length > 0) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({animated: true});
            }, 100);
        }
    }, [messages]);

    useEffect(() => {
        if (!user) return;
        try {
            const rawLang = user.lang || user.language || user.locale;
            if (rawLang && typeof rawLang === 'string') {
                const norm = rawLang.toLowerCase().startsWith('fr') ? 'fr' : 'en';
                const current = (i18n.language || '').slice(0, 2);
                if (current !== norm) {
                    i18n.changeLanguage(norm);
                }
            }
        } catch (_) {}
    }, [i18n, user]);

    const handleLogout = async () => {
        if (Platform.OS === 'web') {
            try {
                await logout();
            } catch (_e) {}
            return;
        }

        Alert.alert(
            t('logout'),
            t('confirmLogout'),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('logout'),
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                    }
                }
            ]
        );
    };

    const handleSendMessage = async () => {
        if (!message.trim() || !selectedChannel) return;

        const messageText = message.trim();
        setMessage('');

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            stopTyping(selectedChannel.id);
        }

        const result = await sendMessage(selectedChannel.id, messageText);

        if (!result.success) {
            Alert.alert(t('errorTitle'), t('sendMessageFailed'));
            setMessage(messageText);
        }
    };

    const handleVoiceSend = async (audioFile, duration) => {
        if (!selectedChannel) return;

        const result = await sendVoiceMessage(selectedChannel.id, audioFile, duration);

        if (!result.success) {
            Alert.alert(t('errorTitle'), t('sendVoiceMessageFailed') || 'Failed to send voice message');
        }
    };

    const handleFileSend = async (file) => {
        if (!selectedChannel) return;

        const result = await sendFileAttachment(selectedChannel.id, file);

        if (!result.success) {
            Alert.alert(t('errorTitle'), t('sendFileFailed') || 'Failed to send file');
        }
    };

    const handleJoinLeave = async (channel) => {
        if (!user) return;

        const isMember = channel.members?.some(m => m.id === user.id);

        if (isMember) {
            const result = await leaveChannel(channel.id);
            if (result.success) {
                Alert.alert(t('notifTitleSuccess'), t('leftChannel', { channel: channel.name }));
            }
        } else {
            const result = await joinChannel(channel.id, user.id);
            if (result.success) {
                Alert.alert(t('notifTitleSuccess'), t('joinedChannel', { channel: channel.name }));
                selectChannel(channel);
            }
        }
    };

    const handleTextChange = (text) => {
        setMessage(text);

        if (!selectedChannel) return;

        if (text.length > 0) {
            startTyping(selectedChannel.id);

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
                stopTyping(selectedChannel.id);
            }, 3000);
        } else {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            stopTyping(selectedChannel.id);
        }
    };

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (selectedChannelId) {
                stopTyping(selectedChannelId);
            }
        };
    }, [selectedChannelId, stopTyping]);

    const selectedFromList = channels.find(c => c.id === selectedChannel?.id) || selectedChannel;
    const isUserMember = selectedFromList?.members?.some(m => m.id === user?.id) || false;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(sidebarWidth, {
                toValue: sidebarExpanded ? 200 : 0,
                duration: 300,
                useNativeDriver: false
            }),
            Animated.timing(rotateAnim, {
                toValue: sidebarExpanded ? 1 : 0,
                duration: 300,
                useNativeDriver: true
            })
        ]).start();
    }, [rotateAnim, sidebarExpanded, sidebarWidth]);

    const handleLeaveCurrentChannel = async () => {
        if (!selectedChannel) return;
        Alert.alert(
            t('leave'),
            t('confirmLeave'),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('leave'),
                    style: 'destructive',
                    onPress: async () => {
                        await leaveChannel(selectedChannel.id);
                    }
                }
            ]
        );
    };

    const handleChannelPress = (channel) => {
        try {
            if (selectedChannel?.id) {
                stopTyping(selectedChannel.id);
            }
        } catch (_) {}
        selectChannel(channel);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
    };

    const styles = createStyles(theme);

    const isChannelPrivate = (ch) => {
        return !!(ch && ch.type === 'private');
    };

    useEffect(() => {
        if (!user || !isAuthenticated) {
            router.replace('/(auth)/login');
        }
    }, [user, isAuthenticated]);

    const getCounterColor = () => {
        if (message.length > MESSAGE_MAX_LENGTH * 0.9) {
            return theme.xpRed;
        } else if (message.length > MESSAGE_MAX_LENGTH * 0.75) {
            return theme.xpOrange;
        } else {
            return theme.xpTextLight;
        }
    };

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: theme.xpGray}}>
            <View style={styles.container}>
                <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.xpBlue}/>

                {/* Title Bar */}
                <View style={styles.titleBar}>
                    <View style={styles.windowIcon}/>
                    <Text style={{ color: '#fff' }}>{t('chatTitle')}</Text>
                </View>

                {/* Toolbar - SCROLLABLE HORIZONTALEMENT */}
                <View style={styles.toolbarContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.toolbar}
                        contentContainerStyle={styles.toolbarContent}
                    >
                        <TouchableOpacity
                            style={styles.toolbarButton}
                            onPress={() => setSidebarExpanded(!sidebarExpanded)}
                        >
                            <Animated.View style={[styles.hamburgerMenu, {transform: [{rotate: rotateAnim.interpolate({inputRange:[0,1],outputRange:['0deg','90deg']})}]}]}>
                                <View style={styles.hamburgerLine}/>
                                <View style={styles.hamburgerLine}/>
                                <View style={styles.hamburgerLine}/>
                            </Animated.View>
                            <Text style={styles.toolbarButtonText}>
                                {sidebarExpanded ? t('hide') : t('show')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.toolbarButton}
                            onPress={() => router.push('/(main)/new-channel')}
                        >
                            <View style={[styles.toolbarIcon, { backgroundColor: theme.xpGreen }]} />
                            <Text style={styles.toolbarButtonText}>{t('newChannel')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.toolbarButton}
                            onPress={() => router.push('/(main)/settings')}
                        >
                            <View style={[styles.toolbarIcon, { backgroundColor: theme.xpBlue }]} />
                            <Text style={styles.toolbarButtonText}>{t('settings')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.toolbarButton}
                            onPress={() => router.push('/(main)/stats')}
                        >
                            <View style={[styles.toolbarIcon, { backgroundColor: theme.xpBlueDark }]} />
                            <Text style={styles.toolbarButtonText}>Stats</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.toolbarButton}
                            onPress={() => router.push('/(main)/tickets')}
                        >
                            <View style={[styles.toolbarIcon, { backgroundColor: theme.xpPurple }]} />
                            <Text style={styles.toolbarButtonText}>{t('tickets')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.toolbarButton} onPress={handleLogout}>
                            <View style={[styles.toolbarIcon, {backgroundColor: theme.xpRed}]}/>
                            <Text style={styles.toolbarButtonText}>{t('logout')}</Text>
                        </TouchableOpacity>

                        {user?.role === 'admin' && (
                            <TouchableOpacity style={styles.toolbarButton} onPress={() => router.push('/(main)/admin')}>
                                <View style={[styles.toolbarIcon, { backgroundColor: theme.xpOrange }]} />
                                <Text style={styles.toolbarButtonText}>{t('admin')}</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </View>

                <KeyboardAvoidingView
                    style={styles.mainContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    {/* Sidebar */}
                    <Animated.View style={[
                        styles.sidebar,
                        {
                            width: sidebarWidth,
                            overflow: 'visible'
                        }
                    ]}>
                        {/* Channels section container */}
                        <View style={{maxHeight: '50%', minHeight: 0}}>
                            <TouchableOpacity
                                style={styles.sectionHeader}
                                onPress={() => setChannelsExpanded(!channelsExpanded)}
                            >
                                <View style={[styles.sectionIcon, {backgroundColor: theme.xpBlue}]}/>
                                <Text style={styles.sectionHeaderText}>{t('channels')} ({channels.length})</Text>
                                <Text style={styles.expandButton}>{channelsExpanded ? '▼' : '►'}</Text>
                            </TouchableOpacity>

                            {channelsExpanded && (
                                <ScrollView style={styles.channelsList} contentContainerStyle={styles.channelsListContent}>
                                    {channelsLoading ? (
                                        <Text style={styles.loadingText}>{t('loading')}</Text>
                                    ) : channels.length === 0 ? (
                                        <Text style={styles.emptyText}>{t('noChannels')}</Text>
                                    ) : (
                                        channels.map((channel) => {
                                            const isMember = channel.members?.some(m => m.id === user?.id);
                                            const isActive = selectedChannel?.id === channel.id;

                                            return (
                                                <TouchableOpacity
                                                    key={channel.id}
                                                    style={[
                                                        styles.channelItem,
                                                        isActive && styles.channelItemActive
                                                    ]}
                                                    onPress={() => handleChannelPress(channel)}
                                                    onLongPress={() => {
                                                        // Permettre join/leave si public OU admin
                                                        const canInteract = !isChannelPrivate(channel) || isAdmin;
                                                        if (canInteract) {
                                                            handleJoinLeave(channel);
                                                        }
                                                    }}
                                                >
                                                    <View style={[
                                                        styles.channelIcon,
                                                        isChannelPrivate(channel) ? { backgroundColor: theme.xpOrange } : {}
                                                    ]}/>
                                                    <Text style={[
                                                        styles.channelText,
                                                        isActive && styles.channelTextActive
                                                    ]}>
                                                        # {channel.name}
                                                    </Text>
                                                    {!isMember && (
                                                        <Text style={styles.lockIcon}>🔒</Text>
                                                    )}
                                                </TouchableOpacity>
                                            );
                                        })
                                    )}
                                </ScrollView>
                            )}
                        </View>

                        {/* DMs section container */}
                        <View style={{maxHeight: '50%', minHeight: 0}}>
                            <TouchableOpacity
                                style={styles.sectionHeader}
                                onPress={() => setDmsExpanded(!dmsExpanded)}
                            >
                                <View style={[styles.sectionIcon, {backgroundColor: theme.xpGreen}]}/>
                                <Text style={styles.sectionHeaderText}>{t('privateMessages')} ({dms.length})</Text>
                                <Text style={styles.expandButton}>{dmsExpanded ? '▼' : '►'}</Text>
                            </TouchableOpacity>

                            {dmsExpanded && (
                                <ScrollView style={styles.channelsList} contentContainerStyle={styles.channelsListContent}>
                                    {dms.length === 0 ? (
                                        <Text style={styles.emptyText}>{t('noDMs')}</Text>
                                    ) : (
                                        dms.map((dm) => {
                                            const isActive = selectedChannel?.id === dm.id;
                                            const otherUser = dm.members?.find(m => m.id !== user?.id);

                                            return (
                                                <TouchableOpacity
                                                    key={dm.id}
                                                    style={[
                                                        styles.channelItem,
                                                        isActive && styles.channelItemActive
                                                    ]}
                                                    onPress={() => handleChannelPress(dm)}
                                                >
                                                    <View style={[styles.channelIcon, {
                                                        backgroundColor: theme.xpGreen,
                                                        borderRadius: 8
                                                    }]}/>
                                                    <Text style={[
                                                        styles.channelText,
                                                        isActive && styles.channelTextActive
                                                    ]}>
                                                        @ {otherUser?.name || t('dm')}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })
                                    )}
                                </ScrollView>
                            )}
                        </View>
                    </Animated.View>

                    {/* Chat Area */}
                    <TouchableOpacity
                        activeOpacity={1}
                        style={styles.chatArea}
                        onPress={() => {
                            if (sidebarExpanded) {
                                setSidebarExpanded(false);
                            }
                        }}
                    >
                        {selectedChannel ? (
                            <>
                                {/* Channel Header */}
                                <View style={styles.channelHeader}>
                                    <View style={styles.channelIcon}/>
                                    <TouchableOpacity
                                        style={{flex: 1}}
                                        onPress={() => {
                                            if (selectedChannel.type === 'dm' || isUserMember) {
                                                setUsersModalVisible(true);
                                            }
                                        }}
                                        activeOpacity={selectedChannel.type === 'dm' || isUserMember ? 0.7 : 1}
                                        disabled={selectedChannel.type !== 'dm' && !isUserMember}
                                    >
                                        <Text style={styles.channelName}>
                                            {selectedChannel.type === 'dm'
                                                ? `@ ${selectedChannel.members?.find(m => m.id !== user?.id)?.name || t('dm')}`
                                                : `# ${selectedChannel.name}`
                                            }
                                        </Text>
                                    </TouchableOpacity>

                                    {selectedChannel.type === 'dm' && user?.id && (
                                        <E2EEToggle
                                            dmId={selectedChannel.id}
                                            currentUserId={user.id}
                                            theme={theme}
                                        />
                                    )}

                                    {(selectedChannel.type === 'dm' || isUserMember) && (
                                        <XPButton
                                            title={t('leave')}
                                            onPress={handleLeaveCurrentChannel}
                                        />
                                    )}
                                </View>

                                {/* Messages */}
                                <ScrollView
                                    ref={scrollViewRef}
                                    style={styles.messagesContainer}
                                    contentContainerStyle={styles.messagesContent}
                                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({animated: true})}
                                >
                                    {messagesLoading ? (
                                        <Text style={styles.loadingText}>{t('loadingMessages')}</Text>
                                    ) : !isUserMember && selectedChannel.type !== 'dm' ? (
                                        <View style={styles.lockedContainer}>
                                            <Text style={styles.lockedText}>🔒 {t('mustJoinChannel')}</Text>
                                            {isChannelPrivate(selectedChannel) && !isAdmin ? (
                                                <Text style={[styles.emptyText, {marginTop: 10, textAlign: 'center'}]}>
                                                    {t('inviteRequired') || 'You need an invitation to join this channel.'}
                                                </Text>
                                            ) : (
                                                <XPButton
                                                    title={t('join')}
                                                    onPress={() => handleJoinLeave(selectedChannel)}
                                                    style={{marginTop: 10}}
                                                />
                                            )}
                                        </View>
                                    ) : messages.length === 0 ? (
                                        <Text style={styles.emptyText}>{t('noMessages')}</Text>
                                    ) : (
                                        messages.map((msg) => (
                                            <MessageBubble
                                                key={`${msg.id}-${msg.isPending ? 'pending' : 'sent'}`}
                                                message={{
                                                    ...msg,
                                                    author: msg.user?.name || msg.user?.username || msg.sender_name || t('user'),
                                                    text: msg.content,
                                                    timestamp: new Date(msg.created_at).toLocaleTimeString((i18n.language || 'en').startsWith('fr') ? 'fr-FR' : 'en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    }),
                                                    isCurrentUser: msg.user_id === user?.id
                                                }}
                                                isCurrentUser={msg.user_id === user?.id}
                                                theme={theme}
                                            />
                                        ))
                                    )}
                                </ScrollView>

                                {/* Input Area */}
                                <View style={styles.inputArea}>
                                    {typingUsers.length > 0 && (
                                        <View style={styles.typingContainer}>
                                            <Text style={styles.typingText}>
                                                {typingUsers.length === 1
                                                    ? t('typingOne', { names: typingUsers.map(u => u.username).join(', ') })
                                                    : t('typingMany', { names: typingUsers.map(u => u.username).join(', ') })}
                                            </Text>
                                        </View>
                                    )}

                                    <View style={styles.inputRow}>
                                        <AttachmentMenu
                                            onVoiceSend={handleVoiceSend}
                                            onFileSend={handleFileSend}
                                            theme={theme}
                                            disabled={!isUserMember && selectedChannel.type !== 'dm'}
                                        />
                                        <View style={styles.inputWrapper}>
                                            <TextInput
                                                style={styles.messageInput}
                                                placeholder={isUserMember || selectedChannel.type === 'dm' ? t('typeMessage') : t('joinChannelToWrite')}
                                                placeholderTextColor={theme.xpTextLight}
                                                value={message}
                                                onChangeText={handleTextChange}
                                                onSubmitEditing={handleSendMessage}
                                                editable={isUserMember || selectedChannel.type === 'dm'}
                                                maxLength={MESSAGE_MAX_LENGTH}
                                            />
                                            {(isUserMember || selectedChannel.type === 'dm') && (
                                                <Text style={[
                                                    styles.characterCounter,
                                                    { color: getCounterColor() }
                                                ]}>
                                                    {message.length} / {MESSAGE_MAX_LENGTH}
                                                </Text>
                                            )}
                                        </View>
                                        <XPButton
                                            title={t('send')}
                                            onPress={handleSendMessage}
                                            primary
                                            disabled={!message.trim() || (!isUserMember && selectedChannel.type !== 'dm')}
                                            style={{
                                                opacity: (!message.trim() || (!isUserMember && selectedChannel.type !== 'dm')) ? 0.5 : 1
                                            }}
                                        />
                                    </View>
                                </View>
                            </>
                        ) : (
                            <View style={styles.noChannelContainer}>
                                <Text style={styles.noChannelText}>{t('selectChannelToStart')}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </KeyboardAvoidingView>

                {/* Status Bar */}
                <View style={styles.statusBar}>
                    <View style={styles.statusSection}>
                        <View style={[
                            styles.statusDot,
                            {backgroundColor: isWebSocketConnected ? theme.xpGreen : theme.xpRed}
                        ]}/>
                        <Text style={styles.statusText}>
                            {isWebSocketConnected ? t('connected') : t('disconnected')}
                        </Text>
                    </View>

                    <View style={styles.userSection}>
                        <Text style={styles.statusText}>
                            👤 {user?.name || t('user')}
                        </Text>
                    </View>
                </View>

                {/* Users Modal */}
                <UsersModal
                    visible={usersModalVisible}
                    onClose={() => setUsersModalVisible(false)}
                    channel={selectedChannel}
                    theme={theme}
                />
            </View>
        </SafeAreaView>
    );
}