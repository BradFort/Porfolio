/* @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier */
import { StyleSheet } from 'react-native';

export const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.xpGray,
    },
    titleBar: {
        backgroundColor: theme.xpBlue,
        height: 30,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    windowIcon: {
        width: 16,
        height: 16,
        backgroundColor: theme.xpBlueLight,
        borderRadius: 2,
        marginRight: 4,
    },
    titleBarText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    toolbarContainer: {
        backgroundColor: theme.xpGray,
        borderBottomWidth: 1,
        borderBottomColor: theme.xpBorder,
    },
    toolbar: {
        flexDirection: 'row',
        paddingVertical: 4,
    },
    toolbarContent: {
        flexDirection: 'row',
        paddingHorizontal: 4,
        gap: 2,
    },
    toolbarButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: theme.xpGrayDark,
        backgroundColor: theme.xpGray,
        gap: 4,
    },
    toolbarIcon: {
        width: 16,
        height: 16,
        borderRadius: 2,
    },
    toolbarButtonText: {
        fontSize: 11,
        color: theme.xpText,
    },
    mainContainer: {
        flex: 1,
        flexDirection: 'row',
    },
    sidebar: {
        height: '100%',
        flexDirection: 'column',
        backgroundColor: theme.xpGrayLight,
        borderRightWidth: 1,
        borderRightColor: theme.xpBorder,
        justifyContent: 'flex-start',

    },
    sectionHeader: {
        backgroundColor: theme.xpGrayDark,
        borderWidth: 1,
        borderColor: theme.xpGrayDark,
        padding: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    sectionIcon: {
        width: 16,
        height: 16,
        borderRadius: 2,
    },
    sectionHeaderText: {
        fontWeight: 'bold',
        fontSize: 11,
        color: theme.xpText,
        flex: 1,
    },
    expandButton: {
        fontSize: 10,
        color: theme.xpText,
        fontWeight: 'bold',
    },
    channelsList: {
        maxHeight: '100%',
        minHeight: 0,
        backgroundColor: theme.xpGrayLight,
        overflow: 'hidden',
    },

    channelsListContent: {
        paddingBottom: 8,
    },
    channelItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        gap: 6,
        borderBottomWidth: 1,
        borderBottomColor: theme.xpBorder,
    },
    channelItemActive: {
        backgroundColor: theme.xpBlue,
    },
    channelIcon: {
        width: 16,
        height: 16,
        backgroundColor: theme.xpBlue,
        borderRadius: 2,
    },
    channelText: {
        fontSize: 11,
        color: theme.xpText,
        flex: 1,
    },
    channelTextActive: {
        color: 'white',
    },
    lockIcon: {
        fontSize: 10,
    },
    loadingText: {
        fontSize: 11,
        color: theme.xpTextLight,
        padding: 8,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 11,
        color: theme.xpTextLight,
        padding: 8,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    chatArea: {
        flex: 1,
        backgroundColor: theme.xpGrayLight,
    },
    channelHeader: {
        backgroundColor: theme.xpGray,
        borderBottomWidth: 1,
        borderBottomColor: theme.xpBorder,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    channelName: {
        fontWeight: 'bold',
        fontSize: 14,
        color: theme.xpText,
    },
    messagesContainer: {
        flex: 1,
        padding: 12,
    },
    messagesContent: {
        paddingBottom: 20,
    },
    lockedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    lockedText: {
        fontSize: 14,
        color: theme.xpText,
        textAlign: 'center',
    },
    noChannelContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noChannelText: {
        fontSize: 14,
        color: theme.xpTextLight,
        fontStyle: 'italic',
    },
    typingContainer: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: theme.xpGray,
    },
    typingText: {
        fontSize: 10,
        color: theme.xpTextLight,
        fontStyle: 'italic',
    },
    inputArea: {
        backgroundColor: theme.xpGray,
        borderTopWidth: 1,
        borderTopColor: theme.xpBorder,
    },
    inputRow: {
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
        padding: 8,
    },
    attachmentButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.xpBlue,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.xpBorder,
    },
    attachmentButtonText: {
        fontSize: 20,
        color: 'white',
        fontWeight: 'bold',
    },
    inputWrapper: {
        flex: 1,
        borderWidth: 1,
        borderColor: theme.xpGrayDark,
        backgroundColor: theme.xpGrayLight,
        position: 'relative',
    },
    messageInput: {
        padding: 8,
        paddingBottom: 24,
        fontSize: 12,
        color: theme.xpText,
    },
    characterCounter: {
        position: 'absolute',
        bottom: 4,
        right: 8,
        fontSize: 9,
        fontWeight: '500',
    },
    statusBar: {
        backgroundColor: theme.xpGray,
        borderTopWidth: 1,
        borderTopColor: theme.xpBorder,
        height: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
    },
    statusSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    userSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 11,
        color: theme.xpText,
    },
    hamburgerMenu: {
        width: 16,
        height: 14,
        justifyContent: 'space-between',
    },
    hamburgerLine: {
        width: '100%',
        height: 2,
        backgroundColor: theme.xpText,
        borderRadius: 1,
    },
    userListSection: {
        paddingVertical: 4,
    },
    userSectionTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        color: theme.xpText,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: theme.xpGrayDark,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        gap: 6,
        borderBottomWidth: 1,
        borderBottomColor: theme.xpBorder,
    },
    userStatusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    userName: {
        fontSize: 10,
        color: theme.xpText,
    },
    userNameOffline: {
        color: theme.xpTextLight,
    },
});

// Export par défaut vide pour éviter le warning Expo Router
export default function ChatScreenStyles() {
    return null;
}
