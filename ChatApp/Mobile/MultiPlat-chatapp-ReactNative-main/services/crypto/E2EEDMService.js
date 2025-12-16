/**
 * Service de gestion du chiffrement E2EE pour les DM
 * Gère qui peut activer/désactiver l'E2EE et synchronise l'état
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const E2EE_DM_STATE_KEY = 'e2ee_dm_states';

class E2EEDMService {
    constructor() {
        // Format: { dmId: { enabled: boolean, enabledBy: userId, timestamp: number } }
        this.dmStates = new Map();
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            const stored = await AsyncStorage.getItem(E2EE_DM_STATE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                this.dmStates = new Map(Object.entries(parsed));
            }
            this.initialized = true;
        } catch (error) {
            console.error('[E2EE-DM] Failed to initialize:', error);
        }
    }

    async _persistState() {
        try {
            const obj = Object.fromEntries(this.dmStates);
            await AsyncStorage.setItem(E2EE_DM_STATE_KEY, JSON.stringify(obj));
        } catch (error) {
            console.error('[E2EE-DM] Failed to persist state:', error);
        }
    }

    /**
     * Active l'E2EE pour un DM
     * @param {string} dmId - ID du DM
     * @param {string} userId - ID de l'utilisateur qui active
     * @returns {boolean} - Succès de l'opération
     */
    async enableE2EE(dmId, userId) {
        const state = this.dmStates.get(dmId);

        if (state?.enabled) {
            return false;
        }

        const newState = {
            enabled: true,
            enabledBy: userId,
            timestamp: Date.now()
        };

        this.dmStates.set(dmId, newState);
        await this._persistState();

        return true;
    }

    /**
     * Désactive l'E2EE pour un DM
     * @param {string} dmId - ID du DM
     * @param {string} userId - ID de l'utilisateur qui tente de désactiver
     * @returns {object} - { success: boolean, error?: string }
     */
    async disableE2EE(dmId, userId) {
        const state = this.dmStates.get(dmId);

        if (!state?.enabled) {
            return { success: true }; // Déjà désactivé
        }

        // Vérifier si l'utilisateur a le droit de désactiver
        if (state.enabledBy !== userId) {
            return {
                success: false,
                error: 'Seul l\'utilisateur qui a activé l\'E2EE peut le désactiver'
            };
        }

        const newState = {
            enabled: false,
            enabledBy: null,
            timestamp: Date.now()
        };

        this.dmStates.set(dmId, newState);
        await this._persistState();

        return { success: true };
    }

    /**
     * Vérifie si un utilisateur peut toggle l'E2EE
     * @param {string} dmId - ID du DM
     * @param {string} userId - ID de l'utilisateur
     * @returns {object} - { canEnable: boolean, canDisable: boolean, reason?: string }
     */
    canToggleE2EE(dmId, userId) {
        const state = this.dmStates.get(dmId);

        if (!state?.enabled) {
            return { canEnable: true, canDisable: false };
        }

        // E2EE activé
        const canDisable = state.enabledBy === userId;

        return {
            canEnable: false,
            canDisable: canDisable,
            reason: canDisable ? null : 'Seul l\'utilisateur qui a activé l\'E2EE peut le désactiver'
        };
    }

    /**
     * Synchronise l'état E2EE depuis le serveur ou un autre utilisateur
     */
    async syncE2EEState(dmId, enabled, enabledBy, timestamp) {
        const currentState = this.dmStates.get(dmId);

        // Utiliser le timestamp pour résoudre les conflits
        if (currentState && currentState.timestamp && timestamp < currentState.timestamp) {
            return;
        }

        const newState = {
            enabled: enabled,
            enabledBy: enabledBy,
            timestamp: timestamp || Date.now()
        };

        this.dmStates.set(dmId, newState);
        await this._persistState();
    }
}

export default new E2EEDMService();
