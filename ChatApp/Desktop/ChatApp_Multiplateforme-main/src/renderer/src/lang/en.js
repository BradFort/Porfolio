export const en = {
  app: {
    name: 'ChatApp XP',
    version: 'Version 1.0.0'
  },
  days: {
    Monday: "Monday",
    Tuesday: "Tuesday",
    Wednesday: "Wednesday",
    Thursday: "Thursday",
    Friday: "Friday",
    Saturday: "Saturday",
    Sunday: "Sunday"
  },

  auth: {
    welcome: 'Welcome {name}',
    logoutGoodbye: 'Goodbye {name}!',
    loginSuccess: 'Signed in! Welcome {name}'
  },
  notifications: {
    titles: {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Information'
    },
    themeChanged: 'Theme {mode} enabled',
    themeMode: { dark: 'dark', light: 'light' },
    themeChangeError: 'Error while changing theme',
    themeLoadError: 'Error loading theme',
    langChanged: 'Language changed: {lang}',
    langChangeError: 'Error while changing language',
    channelJoin: 'You joined channel: #{name}',
    channelLeave: 'You left channel: #{name}',
    settingsTitle: 'Notification Settings',
    settingsPlaceholder: 'Notification settings will appear here.',
    dmCreated: 'New conversation with {name}',
    invitationAccepted: '{user} accepted your invitation to #{channel}',
    invitationRejected: '{user} rejected your invitation to #{channel}',
    newInvitation: '{inviter} invited you to join #{channel}',
    newMessageInChannel: 'New message in #{channel}',
    checkConversation: 'Please check the conversation...'
  },
  common: {
    close: 'Close',
    delete: 'Delete',
    genericError: 'An error occurred',
    loginerror: 'Connection error',
    registerError: 'Register error',
    cancel: 'Cancel',
    confirm: 'Confirm'
  },
  buttons: {
    themeDark: 'Dark mode',
    themeLight: 'Light mode',
    invitations: 'View Invitations',
    preferences: 'Preferences - Coming soon',
    documentation: 'Documentation - Coming soon',
    shortcuts: 'Shortcuts: Ctrl+N (New), Ctrl+R (Refresh)',
    switchLanguage: 'Switch language',
    join: 'Join',
    leave: 'Leave'
  },
  status: {
    connected: 'Connected',
    reconnecting: 'Reconnecting',
    disconnected: 'Disconnected',
    online: 'Online',
    updated: 'Status updated: {status}',
    updateError: 'Error while changing status',
    updateFailed: 'Error while updating status'
  },
  menuTop: {
    file: 'File',
    edit: 'Edit',
    settings: 'Settings',
    view: 'View',
    tools: 'Tools',
    other: 'Others'
  },
  toolbar: {
    disconnect: 'Sign out',
    newChannel: 'New Channel',
    newDm: 'New DM'
  },
  menu: {
    file: {
      newChannel: 'New Channel',
      viewInvitations: 'View Invitations',
      disconnect: 'Sign out',
      quit: 'Quit'
    },
    edit: {
      copy: 'Copy',
      paste: 'Paste',
      preferences: 'Preferences...'
    },
    settings: {
      preferences: 'Preferences...',
      theme: 'Theme',
      language: 'Language',
      notifications: 'Notifications',
      languageEn: 'English',
      languageFr: 'French'
    },
    others: {
      newChannel: 'New Channel',
      viewInvitations: 'View Invitations',
      newDm: 'New DM'
    },
    view: {
      darkMode: 'Dark Mode',
      lightMode: 'Light Mode',
      zoomIn: 'Zoom In',
      zoomOut: 'Zoom Out',
      resetZoom: 'Reset Zoom'
    },
    tools: {
      changeStatus: 'Change status',
      devTools: 'Developer Tools',
      refresh: 'Refresh',
      devToolsNotAvailable: 'Developer Tools toggle not available'
    },
    help: {
      docs: 'Documentation',
      shortcuts: 'Keyboard Shortcuts',
      about: 'About'
    }
  },
  invitations: {
    errorCount: 'Error while fetching invitations count:',
    errorOpen: 'Error while opening invitations modal:',
    errorOpenAlert: 'Error opening invitations',
    inviteUser: {
      title: 'Invite a user to {channel}',
      close: 'Close',
      noneAvailable: 'No available users to invite',
      selectUserLabel: 'Select a user:',
      choosePlaceholder: 'Choose a user',
      messageLabel: 'Message (optional):',
      messagePlaceholder: 'Write a message (optional)',
      charsCount: '{count}/500 characters',
      cancel: 'Cancel',
      send: 'Send invitation',
      sending: 'Sending...',
      sentSuccess: 'Invitation sent',
      sendError: 'Error while sending the invitation',
      validateSelectUser: 'Please select a user',
      errorGeneric: 'An error occurred while sending the invitation'
    },
    modal: {
      title: 'Invitations',
      loading: 'Loading invitations...',
      loadError: 'Error while loading invitations',
      empty: 'No invitations',
      invitedBy: 'Invited by {name}',
      accept: 'Accept',
      acceptedBy: '{user} accepted your invitation to #{channel}',
      reject: 'Reject',
      rejectedBy: '{user} rejected your invitation to #{channel}',
      accepted: 'Invitation accepted for {channel}',
      acceptError: 'Error while accepting the invitation',
      rejected: 'Invitation rejected',
      rejectError: 'Error while rejecting the invitation'
    },
    time: {
      now: 'Just now',
      minute: '{count} minute ago',
      minutes: '{count} minutes ago',
      hour: '{count} hour ago',
      hours: '{count} hours ago',
      day: '{count} day ago',
      days: '{count} days ago'
    }
  },
  admin: {
    ui: {
      adminButton: 'Admin',
      usersTitle: 'Users',
      confirmDeleteUser: 'Delete user {name}?',
      channelsTitle: 'Channels',
      confirmDeleteChannel: 'Delete channel {name}?',
      messagesTitle: 'Messages',
      filterAll: 'All',
      filterChannels: 'Channels',
      filterDMs: 'DMs',
      confirmDeleteMessage: 'Delete this message?'
    }
  },
  dm: {
    none: 'No direct messages.',
    newDM: {
      title: 'New Direct Message',
      empty: 'No users available for DM',
      selectLabel: 'Select a user:',
      choosePlaceholder: 'Choose a user',
      cancel: 'Cancel',
      create: 'Create',
      validateSelectUser: 'Please select a user',
      creating: 'Creating...',
      createdSuccess: 'Direct message created',
      createError: 'Error while creating the DM',
      errorGeneric: 'An error occurred while creating the DM'
    }
  },
  chat: {
    placeholder: 'Type your message...',
    send: 'Send',
    unknownUser: 'User',
    noMessagesInChannel: 'No messages in this channel.',
    pagination: {
      newer: '← Newer messages',
      older: 'Older messages →'
    },
    placeholderInChannel: 'Type your message in #{name}...',
    mustBeMemberToSend: 'You must be a member of this channel to send messages',
    notMemberMessage:
      "You're not a member of <b>#{channel}</b>.<br><br>Join the channel to view and send messages.",
    header: {
      untitledChannel: 'Untitled channel',
      noDescription: 'No description',
      invite: '➕ Invite',
      inviteTitle: 'Invite a user to this channel'
    },
    welcome: {
      title: 'ChatApp XP',
      heading: 'Welcome to ChatApp XP!',
      message: 'Start chatting by selecting a channel from the sidebar.',
      instruction: 'Select a channel to start chatting',
      inputPlaceholder: 'Select a channel to send messages'
    },
    notifications: {
      newMessageFrom: 'New message from {name}',
      systemTitle: '{name} in #{channel}',
      messageQueued:
        'Your message in #{channel} has been queued and will be sent when the server is available.',
      queuedTitle: 'Message queued',
      messageQueuedContent: 'Queued message: "{content}"',
      queuedSent: 'Your queued message in #{channel} was sent successfully.',
      queuedSentTitle: 'Queued message sent',
      queuedSentContent: 'Sent message: "{content}"',
      sendFailed: 'Failed to send message',
      messageTooLong: 'Message cannot exceed {max} characters.'
    },
    typing: {
      one: '{name} is typing...',
      two: '{name1} and {name2} are typing...',
      many: '{name1}, {name2} and {others} others are typing...'
    },
    voice: {
      startRecording: 'Record a voice message',
      stopRecording: 'Stop recording',
      voiceMessage: 'Voice',
      microphoneError: 'Unable to access microphone',
      uploading: 'Sending voice message...',
      sent: 'Voice message sent!',
      sendFailed: 'Error sending voice message',
      apiNotAvailable: 'Service unavailable',
      tooShort: 'Recording must be at least 1 second long',
      emptyRecording: 'Recording is empty',
      cancel: 'Cancel',
      stop: 'Stop',
      send: 'Send',
      preview: 'Preview'
    },
    attachment: {
      addAttachment: 'Add an attachment or voice message',
      voiceMessage: 'Voice message',

      // merged full set from HEAD
      file: 'File attachment',
      fileAttachment: 'File',
      preview: 'File preview',
      cancel: 'Cancel',
      send: 'Send',
      download: 'Download',
      uploading: 'Uploading file...',
      sent: 'File sent!',
      sendFailed: 'Error sending file',
      fileTooLarge: 'File cannot exceed 5MB',
      forbidden: 'You do not have permission to send files',
      apiNotAvailable: 'Service unavailable',

      comingSoon: 'Feature coming soon!'
    }
  },
  pages: {
    stats: {
      title: 'User Stats',
      messageTotal: 'Message total',
      channelTotal: 'Channel total',
      top3Channel: 'Your favorite channels',
      activityPerDay: 'Activity per day '
    },
    admin: {
      title: 'Admin Panel - ChatApp XP',
      heading: 'Administration Panel',
      manageUsers: 'Manage users',
      manageChannels: 'Manage channels',
      manageMessages: 'Manage messages',
      status: 'Administration Panel'
    },
    createChannel: {
      title: 'Create a channel - ChatApp XP',
      heading: 'Create a new channel',
      nameLabel: 'Channel name:',
      namePlaceholder: 'Enter the channel name',
      descLabel: 'Description (optional):',
      descPlaceholder: 'Enter a description (optional)',
      typeLabel: 'Channel type:',
      type: { public: 'Public', private: 'Private' },
      publicDesc: 'Everyone can see and join this channel',
      privateDesc: 'Only invited users can join',
      cancel: 'Cancel',
      create: 'Create',
      success: 'Channel created successfully!',
      errors: {
        nameRequired: 'Please enter a channel name.',
        nameTooShort: 'Channel name must be at least 3 characters.',
        nameTooLong: 'Channel name cannot exceed 50 characters.',
        descTooLong: 'Description cannot exceed 255 characters.',
        creationFailed: 'Error creating channel.'
      }
    },
    login: {
      title: 'Sign in - ChatApp XP',
      windowTitle: 'Sign in - ChatApp XP',
      heading: 'Sign in',
      emailLabel: 'Email:',
      emailPlaceholder: 'Enter your email',
      passwordLabel: 'Password:',
      passwordPlaceholder: 'Password',
      submit: 'Sign in',
      noAccountLink: "Don't have an account? Create one",
      status: 'Sign in',
      errors: {
        enterEmail: 'Please enter your email.',
        enterValidEmail: 'Please enter a valid email address.',
        enterPassword: 'Please enter your password.',
        passwordMin: 'Password must be at least {min} characters.',
        passwordMax: 'Password must not exceed {max} characters.',
        loginFailed: 'Sign in failed. Please check your credentials.'
      },
      successRedirecting: 'Login successful, redirecting...'
    },
    register: {
      title: 'Create an account - ChatApp XP',
      windowTitle: 'Create an account - ChatApp XP',
      heading: 'Create an account',
      nameLabel: 'Username:',
      namePlaceholder: 'Enter your name',
      emailLabel: 'Email:',
      emailPlaceholder: 'Enter your email',
      passwordLabel: 'Password:',
      passwordPlaceholder: 'Password',
      passwordConfirmLabel: 'Confirm password:',
      passwordConfirmPlaceholder: 'Confirm the password',
      submit: 'Sign up',
      hasAccountLink: 'Already have an account? Sign in',
      status: 'Account creation',
      errors: {
        enterName: 'Please enter your name.',
        enterEmail: 'Please enter your email.',
        enterValidEmail: 'Please enter a valid email address.',
        enterPassword: 'Please enter your password.',
        passwordMin: 'Password must be at least {{min}} characters.',
        passwordMax: 'Password must be at most {{max}} characters.',
        passwordLetter: 'Password must contain at least one letter.',
        passwordMixedCase: 'Password must contain both uppercase and lowercase letters.',
        passwordNumber: 'Password must contain at least one number.',
        passwordSymbol: 'Password must contain at least one symbol.',
        passwordUncompromised:
          'This password has been compromised in a data breach. Please choose another.',
        uniqueName: 'This username is already taken.',
        uniqueEmail: 'This email is already in use.',
        default: 'Registration error. Please try again.'
      },
      success: 'Registration successful! Redirecting...'
    }
  },
  sidebar: {
    channels: 'Channels',
    privateMessages: 'Direct Messages',
    onlineUsers: 'Online users — ',
    selectChannel: 'Select a channel to view its members.',
    membersOfChannel: 'Channel members',
    mustBeMember: 'You must be a member of this channel to view the member list.',
    categories: {
      admins: 'Administrators',
      online: 'Online',
      offline: 'Offline'
    }
  },
  ticket: {
    createButton: 'Create a ticket',
    viewTickets: 'My Tickets',
    modal: {
      title: 'Create a support ticket',
      subjectLabel: 'Subject',
      subjectPlaceholder: 'Briefly describe the problem',
      descriptionLabel: 'Description',
      descriptionPlaceholder: 'Describe your problem in detail...',
      priorityLabel: 'Priority',
      priority: {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        urgent: 'Urgent'
      },
      priorityDesc: {
        low: 'General question or improvement',
        medium: 'Non-blocking issue',
        high: 'Important issue',
        urgent: 'Critical blocking issue'
      },
      cancel: 'Cancel',
      create: 'Create ticket',
      creating: 'Creating...'
    },
    errors: {
      subjectRequired: 'Subject is required',
      subjectTooShort: 'Subject must be at least 5 characters',
      subjectTooLong: 'Subject cannot exceed 100 characters',
      descriptionRequired: 'Description is required',
      descriptionTooShort: 'Description must be at least 10 characters',
      descriptionTooLong: 'Description cannot exceed 1000 characters',
      createError: 'Error creating ticket',
      loadError: 'Error loading tickets'
    },
    success: 'Ticket created successfully! Our team will respond soon.',
    list: {
      title: 'My tickets',
      empty: 'No tickets',
      status: {
        open: 'Open',
        in_progress: 'In progress',
        resolved: 'Resolved',
        closed: 'Closed'
      }
    },
    detail: {
      title: 'Ticket Detail',
      backButton: 'Back',
      loading: 'Loading...',
      noId: 'No ticket ID provided',
      description: 'Description',
      noDescription: 'No description',
      createdBy: 'Created by',
      unknown: 'Unknown',
      on: 'on',
      at: 'at',
      assignedTo: 'Assigned to',
      system: 'System',
      comments: 'Comments',
      noComments: 'No comments yet',
      addComment: 'Add a comment...',
      send: 'Send',
      sending: 'Sending...',
      commentEmpty: 'Comment cannot be empty',
      commentAdded: 'Comment added successfully',
      commentError: 'Error adding comment',
      ticketClosed: 'This ticket is closed, you can no longer add comments',
      status: {
        label: 'Status',
        open: 'Open',
        in_progress: 'In progress',
        closed: 'Closed',
        resolved: 'Resolved'
      },
      priority: {
        label: 'Priority',
        low: 'Low',
        medium: 'Medium',
        high: 'High'
      },
      admin: {
        assign: 'Assign to admin',
        changeStatus: 'Change status',
        changePriority: 'Change priority',
        delete: 'Delete ticket',
        deleteTooltip: 'Ticket must be closed or resolved to be deleted'
      }
    }
  }
};
