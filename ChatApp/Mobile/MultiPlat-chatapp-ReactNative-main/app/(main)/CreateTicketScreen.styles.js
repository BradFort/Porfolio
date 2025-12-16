/* @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier */
import { StyleSheet } from 'react-native';

export const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.xpGray,
    },
    titleBar: {
        height: 30,
        backgroundColor: theme.xpBlue,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    titleBarText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    windowIcon: {
        width: 16,
        height: 16,
        backgroundColor: theme.xpBlueDark,
        borderWidth: 1,
        borderColor: '#fff',
    },
    toolbar: {
        backgroundColor: theme.xpGrayLight,
        borderBottomWidth: 2,
        borderBottomColor: theme.xpBorderDark,
        flexDirection: 'row',
        paddingVertical: 5,
        paddingHorizontal: 5,
    },
    toolbarButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginRight: 5,
        backgroundColor: theme.xpGrayLight,
        borderWidth: 1,
        borderTopColor: theme.xpBorderLight,
        borderLeftColor: theme.xpBorderLight,
        borderBottomColor: theme.xpBorderDark,
        borderRightColor: theme.xpBorderDark,
    },
    toolbarIcon: {
        width: 16,
        height: 16,
        marginRight: 5,
        borderWidth: 1,
        borderColor: theme.xpBorderDark,
    },
    toolbarButtonText: {
        color: theme.xpText,
        fontSize: 11,
    },
    content: {
        flex: 1,
    },
    formContainer: {
        flex: 1,
    },
    formContent: {
        padding: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        color: theme.xpText,
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    input: {
        backgroundColor: theme.xpWindow,
        borderWidth: 2,
        borderTopColor: theme.xpBorderDark,
        borderLeftColor: theme.xpBorderDark,
        borderBottomColor: theme.xpBorderLight,
        borderRightColor: theme.xpBorderLight,
        padding: 10,
        color: theme.xpText,
        fontSize: 12,
        fontFamily: 'monospace',
    },
    textArea: {
        minHeight: 120,
        maxHeight: 200,
    },
    charCount: {
        color: theme.xpTextLight,
        fontSize: 10,
        textAlign: 'right',
        marginTop: 4,
    },
    priorityContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    priorityButton: {
        flex: 1,
        minWidth: '45%',
        paddingVertical: 12,
        paddingHorizontal: 15,
        backgroundColor: theme.xpGrayLight,
        borderWidth: 1,
        borderTopColor: theme.xpBorderLight,
        borderLeftColor: theme.xpBorderLight,
        borderBottomColor: theme.xpBorderDark,
        borderRightColor: theme.xpBorderDark,
        alignItems: 'center',
    },
    priorityButtonActive: {
        borderTopColor: theme.xpBorderDark,
        borderLeftColor: theme.xpBorderDark,
        borderBottomColor: theme.xpBorderLight,
        borderRightColor: theme.xpBorderLight,
    },
    priorityButtonText: {
        color: theme.xpText,
        fontSize: 12,
        fontWeight: 'bold',
    },
    priorityButtonTextActive: {
        color: '#fff',
    },
    buttonContainer: {
        flexDirection: 'row',
        marginTop: 20,
    },
    statusBar: {
        height: 24,
        backgroundColor: theme.xpGrayLight,
        borderTopWidth: 1,
        borderTopColor: theme.xpBorderLight,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusText: {
        color: theme.xpText,
        fontSize: 11,
    },
});

// Export par défaut vide pour éviter le warning Expo Router
export default function CreateTicketScreenStyles() {
    return null;
}
