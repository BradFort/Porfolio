/**
 * @fileoverview Modal de configuration E2EE (activation, récupération, reset, etc.)
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import { useEffect, useState } from 'react'
import {
    Alert,
    Clipboard,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'

import E2EEManager from '../crypto/E2EEManager'

const E2EESettingsModal = ({ visible, onClose }) => {

  const [isInitialized, setIsInitialized] = useState(false)
  const [recoveryCodeShown, setRecoveryCodeShown] = useState(false)
  const [recoveryCode, setRecoveryCode] = useState('')
  const [inputRecoveryCode, setInputRecoveryCode] = useState('')
  const [loadingRecover, setLoadingRecover] = useState(false)

  useEffect(() => {
    if (visible) {
      refreshStatus()
    }
  }, [visible])

  /**
   * Met à jour l'état du modal en fonction de la visibilité.
   * Si le modal est visible, récupère le statut d'initialisation et le code de récupération.
   */
  async function refreshStatus() {
    const ready = E2EEManager.isInitialized()
    setIsInitialized(ready)
    if (ready) {
      const code = E2EEManager.getRecoveryCode()
      setRecoveryCode(code || '')
    }
  }

  /**
   * Gère l'affichage du code de récupération.
   * Affiche une alerte si aucun code n'est disponible, sinon, demande la confirmation pour afficher le code.
   */
  function handleShowRecovery() {
    if (!recoveryCode) {
      Alert.alert("Aucun code", "Aucun code de récupération disponible")
      return
    }

    Alert.alert(
      "Attention",
      "Assurez-vous que personne ne regarde votre écran.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Afficher",
          onPress: () => setRecoveryCodeShown(true)
        }
      ]
    )
  }

  /**
   * Gère la copie du code de récupération dans le presse-papiers.
   * Affiche une alerte pour confirmer la copie.
   */
  function handleCopyRecovery() {
    if (!recoveryCodeShown) {
      Alert.alert("Erreur", "Affichez d'abord votre code")
      return
    }
    Clipboard.setString(recoveryCode)
    Alert.alert("Copié", "Le code a été copié dans le presse-papiers.")
  }

  /**
   * Gère la récupération des clés sur un nouvel appareil.
   * Demande confirmation à l'utilisateur et utilise le code de récupération fourni pour récupérer les clés.
   */
  async function handleRecoverKeys() {
    if (!inputRecoveryCode.trim()) {
      Alert.alert("Erreur", "Veuillez entrer un code de récupération.")
      return
    }

    Alert.alert(
      "Confirmation",
      "Voulez-vous récupérer vos clés sur cet appareil ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Récupérer",
          onPress: async () => {
            setLoadingRecover(true)
            try {
              const ok = await E2EEManager.recoverKeys(inputRecoveryCode.trim())
              if (ok) {
                Alert.alert("Succès", "Clés récupérées avec succès !")
                setInputRecoveryCode('')
                refreshStatus()
              } else {
                Alert.alert("Échec", "Code invalide ou erreur de récupération.")
              }
            } catch {
              Alert.alert("Erreur", "Une erreur est survenue.")
            }
            setLoadingRecover(false)
          }
        }
      ]
    )
  }

  /**
   * Gère la réinitialisation des clés E2EE.
   * Affiche une alerte de confirmation et, en cas d'acceptation, réinitialise les clés.
   */
  async function handleReset() {
    Alert.alert(
      "Réinitialiser E2EE",
      "Cela supprimera toutes vos clés E2EE. Action irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            await E2EEManager.resetKeys()
            Alert.alert("E2EE réinitialisé", "Nouvelles clées générées.")
            onClose()
          }
        }
      ]
    )
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.modalContainer}>
          <ScrollView>

            {/* HEADER */}
            <Text style={styles.title}>🔒 Chiffrement de bout en bout (E2EE)</Text>

            {/* STATUS */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Statut</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, isInitialized ? styles.dotActive : styles.dotInactive]} />
                <Text style={isInitialized ? styles.statusActive : styles.statusInactive}>
                  {isInitialized ? "E2EE activé" : "E2EE non initialisé"}
                </Text>
              </View>
            </View>

            {/* RECOVERY CODE */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Code de récupération</Text>
              <Text style={styles.warningText}>
                ⚠ Important : Ne partagez jamais ce code.
              </Text>

              <View style={styles.recoveryBox}>
                <Text style={styles.codeText}>
                  {recoveryCodeShown ? recoveryCode : "••••••••-••••••••-••••••••"}
                </Text>
              </View>

              <View style={styles.rowButtons}>
                <TouchableOpacity style={styles.btnSecondary} onPress={handleShowRecovery}>
                  <Text style={styles.btnSecondaryText}>👁️ Afficher</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnSecondary, !recoveryCodeShown && styles.btnDisabled]}
                  disabled={!recoveryCodeShown}
                  onPress={handleCopyRecovery}
                >
                  <Text style={styles.btnSecondaryText}>📋 Copier</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* RECOVER ON NEW DEVICE */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Récupérer sur un nouvel appareil</Text>

              <TextInput
                style={styles.input}
                placeholder="alpha-bravo-charlie-delta-echo..."
                placeholderTextColor="#aaa"
                value={inputRecoveryCode}
                onChangeText={setInputRecoveryCode}
              />

              <TouchableOpacity
                style={[styles.btnPrimary, loadingRecover && styles.btnDisabled]}
                onPress={handleRecoverKeys}
                disabled={loadingRecover}
              >
                <Text style={styles.btnPrimaryText}>
                  {loadingRecover ? "⏳ Récupération..." : "🔓 Récupérer mes clés"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ACTIONS */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Actions</Text>

              <TouchableOpacity style={styles.btnDanger} onPress={handleReset}>
                <Text style={styles.btnDangerText}>⚠️ Réinitialiser E2EE</Text>
              </TouchableOpacity>

              <Text style={styles.dangerSmallText}>
                Cette action supprimera toutes vos clés. Vous perdrez l&#39;accès aux messages chiffrés.
              </Text>
            </View>

            {/* CLOSE */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>Fermer</Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

export default E2EESettingsModal

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20
  },
  modalContainer: {
    backgroundColor: '#1f1f24',
    borderRadius: 12,
    padding: 20,
    maxHeight: '90%',
  },
  title: {
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
  },
  section: {
    marginBottom: 28
  },
  sectionTitle: {
    color: '#d2d2d2',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8
  },
  warningText: {
    color: '#f2a65a',
    marginBottom: 8
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  statusActive: {
    color: '#43b581',
    marginLeft: 8,
  },
  statusInactive: {
    color: '#f04747',
    marginLeft: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6
  },
  dotActive: { backgroundColor: '#43b581' },
  dotInactive: { backgroundColor: '#f04747' },
  recoveryBox: {
    backgroundColor: '#2b2b31',
    padding: 16,
    borderRadius: 8,
    borderColor: '#43b581',
    borderWidth: 1,
    marginTop: 10
  },
  codeText: {
    color: '#43b581',
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'monospace'
  },
  rowButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12
  },
  btnPrimary: {
    backgroundColor: '#5865f2',
    padding: 12,
    borderRadius: 6,
    marginTop: 12
  },
  btnPrimaryText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600'
  },
  btnSecondary: {
    backgroundColor: '#3a3a40',
    padding: 12,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4
  },
  btnSecondaryText: {
    color: 'white',
    textAlign: 'center'
  },
  btnDanger: {
    backgroundColor: '#f04747',
    padding: 12,
    borderRadius: 6
  },
  btnDangerText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '700'
  },
  dangerSmallText: {
    color: '#f04747',
    marginTop: 6,
    fontSize: 12
  },
  btnDisabled: {
    opacity: 0.5
  },
  input: {
    backgroundColor: '#2a2a2e',
    color: 'white',
    padding: 12,
    borderRadius: 6,
    marginTop: 8
  },
  closeButton: {
    marginTop: 10,
    padding: 12,
  },
  closeText: {
    color: '#aaa',
    textAlign: 'center',
    fontSize: 16
  }
})
