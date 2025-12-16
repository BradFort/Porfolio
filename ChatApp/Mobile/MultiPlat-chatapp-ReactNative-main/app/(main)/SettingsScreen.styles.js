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
    backButton: {
        marginRight: 8,
    },
    backButtonBox: {
        paddingHorizontal: 8,
    },
    backButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
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
    content: {
        flex: 1,
    },
    settingsContainer: {
        backgroundColor: theme.xpGrayLight,
        borderWidth: 2,
        borderColor: theme.xpGrayDark,
        margin: 20,
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.xpText,
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 11,
        color: theme.xpTextLight,
        marginBottom: 12,
        lineHeight: 16,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.xpGray,
        borderWidth: 1,
        borderColor: theme.xpBorder,
        padding: 12,
        marginBottom: 8,
    },
    settingInfo: {
        flex: 1,
        marginRight: 12,
    },
    settingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    settingIcon: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    settingTextContainer: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        flex: 1,
    },
    settingLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: theme.xpText,
    },
    settingDescription: {
        fontSize: 10,
        color: theme.xpTextLight,
        lineHeight: 14,
        marginTop: 2,
    },
    switchButton: {
        backgroundColor: theme.xpBlue,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 3,
        minWidth: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    switchButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    loader: {
        padding: 40,
    },
    notificationsList: {
        gap: 0,
    },
    emptyText: {
        fontSize: 11,
        color: theme.xpTextLight,
        padding: 20,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: theme.xpBlueLight,
        borderWidth: 1,
        borderColor: theme.xpBorder,
        padding: 12,
        marginTop: 12,
        gap: 8,
    },
    infoIcon: {
        fontSize: 16,
    },
    infoText: {
        flex: 1,
        fontSize: 10,
        color: theme.xpText,
        lineHeight: 14,
    },
    statusBar: {
        backgroundColor: theme.xpGray,
        borderTopWidth: 1,
        borderTopColor: theme.xpBorder,
        height: 24,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    statusSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statusText: {
        fontSize: 11,
        color: theme.xpText,
    },
    confirmButtonBox: {
        backgroundColor: theme.xpGreen,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 3,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.xpBorder,
    },
    confirmButtonTextBox: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default createStyles;
