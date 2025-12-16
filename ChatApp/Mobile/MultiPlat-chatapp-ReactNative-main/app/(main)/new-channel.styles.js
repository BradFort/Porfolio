/* @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier */
import { StyleSheet } from 'react-native';

export const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.xpGray,
    },
    titleBar: {
        backgroundColor: colors.xpBlue,
        height: 30,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    windowIcon: {
        width: 16,
        height: 16,
        backgroundColor: colors.xpBlueLight,
        borderRadius: 2,
        marginRight: 4,
    },
    titleBarText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    toolbar: {
        backgroundColor: colors.xpGray,
        borderBottomWidth: 1,
        borderBottomColor: colors.xpBorder,
        flexDirection: 'row',
        paddingHorizontal: 4,
        paddingVertical: 4,
        gap: 2,
    },
    toolbarButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        borderTopColor: colors.xpBorderLight,
        borderLeftColor: colors.xpBorderLight,
        borderRightColor: colors.xpBorderDark,
        borderBottomColor: colors.xpBorderDark,
        backgroundColor: colors.xpGray,
        gap: 4,
    },
    toolbarIcon: {
        width: 16,
        height: 16,
        borderRadius: 2,
    },
    toolbarButtonText: {
        fontSize: 11,
        color: colors.xpText,
    },
    content: {
        flex: 1,
        backgroundColor: colors.xpGrayLight,
    },
    contentContainer: {
        padding: 16,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 11,
        fontWeight: 'bold',
        color: colors.xpText,
        marginBottom: 6,
    },
    inputWrapper: {
        borderWidth: 1,
        borderTopColor: colors.xpBorderDark,
        borderLeftColor: colors.xpBorderDark,
        borderRightColor: colors.xpBorderLight,
        borderBottomColor: colors.xpBorderLight,
        backgroundColor: 'white',
    },
    inputWrapperError: {
        borderTopColor: colors.xpRed,
        borderLeftColor: colors.xpRed,
        borderRightColor: colors.xpRed,
        borderBottomColor: colors.xpRed,
    },
    input: {
        padding: 8,
        fontSize: 12,
        color: colors.xpText,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    helperText: {
        fontSize: 10,
        color: colors.xpTextLight,
        marginTop: 4,
        fontStyle: 'italic',
    },
    errorText: {
        fontSize: 10,
        color: colors.xpRed,
        marginTop: 4,
    },
    radioContainer: {
        borderWidth: 1,
        borderTopColor: colors.xpBorderDark,
        borderLeftColor: colors.xpBorderDark,
        borderRightColor: colors.xpBorderLight,
        borderBottomColor: colors.xpBorderLight,
        backgroundColor: colors.xpGrayLight,
        padding: 8,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 8,
        marginBottom: 8,
        gap: 8,
    },
    radioButton: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: colors.xpText,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    radioButtonInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.xpBlue,
    },
    radioContent: {
        flex: 1,
    },
    radioTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: colors.xpText,
        marginBottom: 2,
    },
    radioDescription: {
        fontSize: 10,
        color: colors.xpTextLight,
        lineHeight: 14,
    },
    errorContainer: {
        padding: 12,
        backgroundColor: '#ffebee',
        borderWidth: 1,
        borderColor: colors.xpRed,
        borderRadius: 2,
        marginTop: 8,
    },
    errorTextLarge: {
        fontSize: 11,
        color: colors.xpRed,
        textAlign: 'center',
    },
    loadingContainer: {
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 11,
        color: colors.xpText,
    },
    // Section pour les boutons en bas
    bottomActions: {
        backgroundColor: colors.xpGrayLight,
        borderTopWidth: 1,
        borderTopColor: colors.xpBorder,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 1,
        borderTopColor: colors.xpBorderLight,
        borderLeftColor: colors.xpBorderLight,
        borderRightColor: colors.xpBorderDark,
        borderBottomColor: colors.xpBorderDark,
        backgroundColor: colors.xpGray,
        minWidth: 80,
        justifyContent: 'center',
    },
    actionButtonPrimary: {
        backgroundColor: colors.xpBlue,
        borderTopColor: colors.xpBlueLight,
        borderLeftColor: colors.xpBlueLight,
    },
    actionButtonDisabled: {
        opacity: 0.5,
        backgroundColor: colors.xpGrayDark,
    },
    actionButtonText: {
        fontSize: 11,
        color: colors.xpText,
        fontWeight: 'bold',
    },
    actionButtonTextPrimary: {
        color: 'white',
    },
    statusBar: {
        backgroundColor: colors.xpGray,
        borderTopWidth: 1,
        borderTopColor: colors.xpBorder,
        height: 24,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    statusText: {
        fontSize: 11,
        color: colors.xpText,
    },
});

// Export par défaut vide pour éviter le warning Expo Router
export default function NewChannelStyles() {
    return null;
}
