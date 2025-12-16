export const fr = {
  app: {
    name: 'ChatApp XP',
    version: 'Version 1.0.0'
  },
  days: {
    Monday: "Lundi",
    Tuesday: "Mardi",
    Wednesday: "Mercredi",
    Thursday: "Jeudi",
    Friday: "Vendredi",
    Saturday: "Samedi",
    Sunday: "Dimanche"
  },
  auth: {
    welcome: 'Bienvenue {name}',
    logoutGoodbye: 'Au revoir {name} !',
    loginSuccess: 'Connexion réussie ! Bienvenue {name}'
  },
  notifications: {
    titles: {
      success: 'Succès',
      error: 'Erreur',
      warning: 'Attention',
      info: 'Information'
    },
    themeChanged: 'Thème {mode} activé',
    themeMode: { dark: 'sombre', light: 'clair' },
    themeChangeError: 'Erreur lors du changement de thème',
    themeLoadError: 'Erreur lors du chargement du thème',
    langChanged: 'Langue changée : {lang}',
    langChangeError: 'Erreur lors du changement de langue',
    channelJoin: 'Vous avez rejoint le canal : #{name}',
    channelLeave: 'Vous avez quitté le canal : #{name}',
    settingsTitle: 'Paramètres de notification',
    settingsPlaceholder: 'Les paramètres de notification apparaîtront ici.',
    dmCreated: 'Nouvelle conversation avec {name}',
    invitationAccepted: '{user} a accepté votre invitation à #{channel}',
    invitationRejected: '{user} a refusé votre invitation à #{channel}',
    newInvitation: '{inviter} vous a invité à rejoindre #{channel}',
    newMessageInChannel: 'Nouveau message dans #{channel}',
    checkConversation: 'Veuillez consulter la discussion...'
  },
  common: {
    close: 'Fermer',
    delete: 'Supprimer',
    genericError: 'Une erreur est survenue',
    loginerror: 'Erreur lors de la connexion',
    registerError: "Erreur lors de l'inscription",
    cancel: 'Annuler',
    confirm: 'Confirmer'
  },
  buttons: {
    themeDark: 'Mode sombre',
    themeLight: 'Mode clair',
    invitations: 'Voir Invitations',
    preferences: 'Préférences - Fonctionnalité à venir',
    documentation: 'Documentation - Fonctionnalité à venir',
    shortcuts: 'Raccourcis : Ctrl+N (Nouveau), Ctrl+R (Rafraîchir)',
    switchLanguage: 'Changer de langue',
    join: 'Rejoindre',
    leave: 'Quitter'
  },
  status: {
    connected: 'Connecté',
    reconnecting: 'En connexion',
    disconnected: 'Déconnecté',
    online: 'En ligne',
    updated: 'État mis à jour : {status}',
    updateError: "Erreur lors du changement d'état",
    updateFailed: "Erreur lors de la mise à jour de l'état"
  },
  menuTop: {
    file: 'Fichier',
    edit: 'Édition',
    settings: 'Paramètres',
    view: 'Affichage',
    tools: 'Outils',
    other: 'Autres'
  },
  toolbar: {
    disconnect: 'Se Déconnecter',
    newChannel: 'Nouveau Salon',
    newDm: 'Nouveau DM'
  },
  menu: {
    file: {
      newChannel: 'Nouveau Salon',
      viewInvitations: 'Voir Invitations',
      disconnect: 'Se Déconnecter',
      quit: 'Quitter'
    },
    edit: {
      copy: 'Copier',
      paste: 'Coller',
      preferences: 'Préférences...'
    },
    settings: {
      preferences: 'Préférences...',
      theme: 'Thème',
      language: 'Langue',
      notifications: 'Notifications',
      languageEn: 'Anglais',
      languageFr: 'Français'
    },
    others: {
      newChannel: 'Nouveau Salon',
      viewInvitations: 'Voir Invitations',
      newDm: 'Nouveau DM'
    },
    view: {
      darkMode: 'Mode Sombre',
      lightMode: 'Mode Clair',
      zoomIn: 'Zoom +',
      zoomOut: 'Zoom -',
      resetZoom: 'Réinitialiser le Zoom'
    },
    tools: {
      changeStatus: "Changer l'état",
      devTools: 'Console de développement',
      refresh: 'Rafraîchir',
      devToolsNotAvailable: "La console de développement n'est pas disponible"
    },
    help: {
      docs: 'Documentation',
      shortcuts: 'Raccourcis clavier',
      about: 'À propos'
    }
  },
  invitations: {
    errorCount: "Erreur lors de la récupération du nombre d'invitations :",
    errorOpen: "Erreur lors de l'ouverture du modal d'invitations :",
    errorOpenAlert: "Erreur lors de l'ouverture des invitations",
    inviteUser: {
      title: 'Inviter un utilisateur à {channel}',
      close: 'Fermer',
      noneAvailable: 'Aucun utilisateur disponible à inviter',
      selectUserLabel: 'Sélectionnez un utilisateur :',
      choosePlaceholder: 'Choisissez un utilisateur',
      messageLabel: 'Message (optionnel) :',
      messagePlaceholder: 'Écrire un message (optionnel)',
      charsCount: '{count}/500 caractères',
      cancel: 'Annuler',
      send: "Envoyer l'invitation",
      sending: 'Envoi...',
      sentSuccess: 'Invitation envoyée',
      sendError: "Erreur lors de l'envoi de l'invitation",
      validateSelectUser: 'Veuillez sélectionner un utilisateur',
      errorGeneric: "Une erreur est survenue lors de l'envoi de l'invitation"
    },
    modal: {
      title: 'Invitations',
      loading: 'Chargement des invitations...',
      loadError: 'Erreur lors du chargement des invitations',
      empty: 'Aucune invitation',
      invitedBy: 'Invité par {name}',
      accept: 'Accepter',
      acceptedBy: '{user} a accepté votre invitation à #{channel}',
      reject: 'Refuser',
      rejectedBy: '{user} a refusé votre invitation à #{channel}',
      accepted: 'Invitation acceptée pour {channel}',
      acceptError: "Erreur lors de l'acceptation de l'invitation",
      rejected: 'Invitation refusée',
      rejectError: "Erreur lors du refus de l'invitation"
    },
    time: {
      now: "À l'instant",
      minute: 'Il y a {count} minute',
      minutes: 'Il y a {count} minutes',
      hour: 'Il y a {count} heure',
      hours: 'Il y a {count} heures',
      day: 'Il y a {count} jour',
      days: 'Il y a {count} jours'
    }
  },
  admin: {
    ui: {
      adminButton: 'Admin',
      usersTitle: 'Utilisateurs',
      confirmDeleteUser: "Supprimer l'utilisateur {name} ?",
      channelsTitle: 'Salons',
      confirmDeleteChannel: 'Supprimer le salon {name} ?',
      messagesTitle: 'Messages',
      filterAll: 'Tous',
      filterChannels: 'Salons',
      filterDMs: 'DMs',
      confirmDeleteMessage: 'Supprimer ce message ?'
    }
  },
  dm: {
    none: 'Aucun message privé.',
    newDM: {
      title: 'Nouveau message privé',
      empty: 'Aucun utilisateur disponible pour DM',
      selectLabel: 'Sélectionnez un utilisateur :',
      choosePlaceholder: 'Choisissez un utilisateur',
      cancel: 'Annuler',
      create: 'Créer',
      validateSelectUser: 'Veuillez sélectionner un utilisateur',
      creating: 'Création en cours...',
      createdSuccess: 'Message privé créé',
      createError: 'Erreur lors de la création du DM',
      errorGeneric: 'Une erreur est survenue lors de la création du DM'
    }
  },
  chat: {
    placeholder: 'Tapez votre message...',
    send: 'Envoyer',
    unknownUser: 'Utilisateur',
    noMessagesInChannel: 'Aucun message dans ce salon.',
    pagination: {
      newer: '← Messages plus récents',
      older: 'Messages plus anciens →'
    },
    placeholderInChannel: 'Écrivez votre message dans #{name}...',
    mustBeMemberToSend: 'Vous devez être membre de ce salon pour envoyer des messages',
    notMemberMessage:
      "Vous n'êtes pas membre de <b>#{channel}</b>.<br><br>Rejoignez le salon pour voir et envoyer des messages.",
    header: {
      untitledChannel: 'Salon sans titre',
      noDescription: 'Aucune description',
      invite: '➕ Inviter',
      inviteTitle: 'Inviter un utilisateur dans ce salon'
    },
    welcome: {
      title: 'ChatApp XP',
      heading: 'Bienvenue sur ChatApp XP !',
      message: 'Commencez à discuter en sélectionnant un salon dans la barre latérale.',
      instruction: 'Sélectionnez un salon pour commencer à discuter',
      inputPlaceholder: 'Sélectionnez un salon pour envoyer des messages'
    },
    notifications: {
      newMessageFrom: 'Nouveau message de {name}',
      systemTitle: '{name} dans #{channel}',
      messageQueued:
        'Votre message dans #{channel} a été mis en file d’attente et sera envoyé lorsque le serveur sera disponible.',
      queuedTitle: 'Message en file d’attente',
      messageQueuedContent: 'Message en attente : "{content}"',
      queuedSent: 'Votre message en file d’attente dans #{channel} a été envoyé avec succès.',
      queuedSentTitle: 'Message en file d’attente envoyé',
      queuedSentContent: 'Message envoyé : "{content}"',
      sendFailed: "Échec de l'envoi du message",
      messageTooLong: 'Le message ne peut pas dépasser {max} caractères.'
    },
    typing: {
      one: "{name} est en train d'écrire...",
      two: "{name1} et {name2} sont en train d'écrire...",
      many: "{name1}, {name2} et {others} autres sont en train d'écrire..."
    },
    voice: {
      startRecording: 'Enregistrer un message vocal',
      stopRecording: "Arrêter l'enregistrement",
      voiceMessage: 'Vocal',
      microphoneError: "Impossible d'accéder au microphone",
      uploading: 'Envoi du message vocal...',
      sent: 'Message vocal envoyé !',
      sendFailed: "Erreur lors de l'envoi du message vocal",
      apiNotAvailable: 'Service non disponible',
      tooShort: "L'enregistrement doit durer au moins 1 seconde",
      emptyRecording: "L'enregistrement est vide",
      cancel: 'Annuler',
      stop: 'Arrêter',
      send: 'Envoyer',
      preview: 'Prévisualisation'
    },
    attachment: {
      addAttachment: 'Ajouter une pièce jointe ou un message vocal',
      voiceMessage: 'Message vocal',
      file: 'Pièce jointe',

      // from HEAD (kept)
      fileAttachment: 'Fichier',
      preview: 'Aperçu du fichier',
      cancel: 'Annuler',
      send: 'Envoyer',
      download: 'Télécharger',
      uploading: 'Envoi du fichier...',
      sent: 'Fichier envoyé !',
      sendFailed: "Erreur lors de l'envoi du fichier",
      fileTooLarge: 'Le fichier ne peut pas dépasser 5MB',
      forbidden: "Vous n'avez pas la permission d'envoyer des fichiers",
      apiNotAvailable: 'Service non disponible',

      // from develop (kept)
      comingSoon: 'Fonctionnalité bientôt disponible !'
    }
  },
  pages: {
    stats: {
      title: 'Statistiques utilisateur',
      messageTotal: 'Total de vos messages',
      channelTotal: 'Nombre de channel',
      top3Channel: 'Vos channels préférés',
      activityPerDay: 'Activité quotidienne'
    },
    admin: {
      title: 'Panneau Admin - ChatApp XP',
      heading: "Panneau d'administration",
      manageUsers: 'Gérer les utilisateurs',
      manageChannels: 'Gérer les salons',
      manageMessages: 'Gérer les messages',
      status: "Panneau d'administration"
    },
    createChannel: {
      title: 'Créer un salon - ChatApp XP',
      heading: 'Créer un nouveau salon',
      nameLabel: 'Nom du salon :',
      namePlaceholder: 'Entrez le nom du salon',
      descLabel: 'Description (optionnelle) :',
      descPlaceholder: 'Entrez une description (optionnel)',
      typeLabel: 'Type de salon :',
      type: { public: 'Public', private: 'Privé' },
      publicDesc: 'Tout le monde peut voir et rejoindre ce salon',
      privateDesc: 'Seules les personnes invitées peuvent rejoindre',
      cancel: 'Annuler',
      create: 'Créer',
      success: 'Salon créé avec succès',
      errors: {
        nameRequired: 'Le nom du salon est requis',
        nameTooShort: 'Le nom du salon est trop court (minimum 3 caractères)',
        nameTooLong: 'Le nom du salon est trop long (maximum 50 caractères)',
        descTooLong: 'La description est trop longue (maximum 255 caractères)',
        creationFailed: 'Erreur lors de la création du salon'
      }
    },
    login: {
      title: 'Se connecter - ChatApp XP',
      windowTitle: 'Se connecter - ChatApp XP',
      heading: 'Se connecter',
      emailLabel: 'Email :',
      emailPlaceholder: 'Entrez votre email',
      passwordLabel: 'Mot de passe :',
      passwordPlaceholder: 'Mot de passe',
      submit: 'Se connecter',
      noAccountLink: 'Pas de compte ? Créez-en un',
      status: 'Connexion',
      errors: {
        enterEmail: 'Veuillez entrer votre email.',
        enterValidEmail: 'Veuillez entrer une adresse email valide.',
        enterPassword: 'Veuillez entrer votre mot de passe.',
        passwordMin: 'Le mot de passe doit contenir au moins {min} caractères.',
        passwordMax: 'Le mot de passe ne doit pas dépasser {max} caractères.',
        loginFailed: 'Échec de la connexion. Veuillez vérifier vos identifiants.'
      },
      successRedirecting: 'Connexion réussie, redirection...'
    },
    register: {
      title: 'Créer un compte - ChatApp XP',
      windowTitle: 'Créer un compte - ChatApp XP',
      heading: 'Créer un compte',
      nameLabel: 'Pseudo :',
      namePlaceholder: 'Entrez votre nom',
      emailLabel: 'Email :',
      emailPlaceholder: 'Entrez votre email',
      passwordLabel: 'Mot de passe :',
      passwordPlaceholder: 'Mot de passe',
      passwordConfirmLabel: 'Confirmer le mot de passe :',
      passwordConfirmPlaceholder: 'Confirmez le mot de passe',
      submit: "S'inscrire",
      hasAccountLink: 'Déjà un compte ? Connectez-vous',
      status: 'Création de compte',
      errors: {
        uniqueName: 'Ce nom est déjà pris. Veuillez en choisir un autre.',
        uniqueEmail: 'Cet email est déjà utilisé. Veuillez en choisir un autre.',
        enterName: 'Veuillez entrer votre nom.',
        enterEmail: 'Veuillez entrer votre email.',
        enterValidEmail: 'Veuillez entrer une adresse email valide.',
        enterPassword: 'Veuillez entrer votre mot de passe.',
        passwordMin: 'Le mot de passe doit contenir au moins {{min}} caractères.',
        passwordMax: 'Le mot de passe doit contenir au maximum {{max}} caractères.',
        passwordLetter: 'Le mot de passe doit contenir au moins une lettre.',
        passwordMixedCase: 'Le mot de passe doit contenir des majuscules et des minuscules.',
        passwordNumber: 'Le mot de passe doit contenir au moins un chiffre.',
        passwordSymbol: 'Le mot de passe doit contenir au moins un symbole.',
        passwordUncompromised:
          'Ce mot de passe a été compromis dans une fuite de données. Veuillez en choisir un autre.',
        default: "Erreur lors de l'inscription. Veuillez réessayer."
      },
      success: 'Inscription réussie ! Redirection...'
    }
  },
  sidebar: {
    channels: 'Salons',
    privateMessages: 'Messages Privés',
    onlineUsers: 'Utilisateurs en ligne — ',
    selectChannel: 'Sélectionnez un salon pour voir ses membres.',
    membersOfChannel: 'Membres du salon',
    mustBeMember: 'Vous devez être membre de ce salon pour voir la liste des membres.',
    categories: {
      admins: 'Administrateurs',
      online: 'En ligne',
      offline: 'Hors ligne'
    }
  },
  ticket: {
    createButton: 'Créer un ticket',
    viewTickets: 'Mes Tickets',
    modal: {
      title: 'Créer un ticket de support',
      subjectLabel: 'Sujet',
      subjectPlaceholder: 'Décrivez brièvement le problème',
      descriptionLabel: 'Description',
      descriptionPlaceholder: 'Décrivez votre problème en détail...',
      priorityLabel: 'Priorité',
      priority: {
        low: 'Basse',
        medium: 'Moyenne',
        high: 'Haute',
        urgent: 'Urgente'
      },
      priorityDesc: {
        low: 'Question générale ou amélioration',
        medium: 'Problème non bloquant',
        high: 'Problème important',
        urgent: 'Problème critique bloquant'
      },
      cancel: 'Annuler',
      create: 'Créer le ticket',
      creating: 'Création...'
    },
    errors: {
      subjectRequired: 'Le sujet est requis',
      subjectTooShort: 'Le sujet doit contenir au moins 5 caractères',
      subjectTooLong: 'Le sujet ne peut pas dépasser 100 caractères',
      descriptionRequired: 'La description est requise',
      descriptionTooShort: 'La description doit contenir au moins 10 caractères',
      descriptionTooLong: 'La description ne peut pas dépasser 1000 caractères',
      createError: 'Erreur lors de la création du ticket',
      loadError: 'Erreur lors du chargement des tickets'
    },
    success: 'Ticket créé avec succès ! Notre équipe vous répondra bientôt.',
    list: {
      title: 'Mes tickets',
      empty: 'Aucun ticket',
      status: {
        open: 'Ouvert',
        in_progress: 'En cours',
        resolved: 'Résolu',
        closed: 'Fermé'
      }
    },
    detail: {
      title: 'Détail du Ticket',
      backButton: 'Retour',
      loading: 'Chargement...',
      noId: 'Aucun ID de ticket fourni',
      description: 'Description',
      noDescription: 'Pas de description',
      createdBy: 'Créé par',
      unknown: 'Inconnu',
      on: 'le',
      at: 'à',
      assignedTo: 'Assigné à',
      system: 'Système',
      comments: 'Commentaires',
      noComments: 'Aucun commentaire pour le moment',
      addComment: 'Ajouter un commentaire...',
      send: 'Envoyer',
      sending: 'Envoi...',
      commentEmpty: 'Le commentaire ne peut pas être vide',
      commentAdded: 'Commentaire ajouté avec succès',
      commentError: "Erreur lors de l'ajout du commentaire",
      ticketClosed: 'Ce ticket est fermé, vous ne pouvez plus ajouter de commentaires',
      status: {
        label: 'Statut',
        open: 'Ouvert',
        in_progress: 'En cours',
        closed: 'Fermé',
        resolved: 'Résolu'
      },
      priority: {
        label: 'Priorité',
        low: 'Basse',
        medium: 'Moyenne',
        high: 'Haute'
      },
      admin: {
        assign: 'Assigner à un admin',
        changeStatus: 'Modifier le statut',
        changePriority: 'Modifier la priorité',
        delete: 'Supprimer le ticket',
        deleteTooltip: 'Le ticket doit être fermé ou résolu pour être supprimé'
      }
    }
  }
}
