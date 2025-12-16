/* @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier */
import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
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
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    formContainer: {
        backgroundColor: colors.xpGrayLight,
        borderWidth: 2,
        borderColor: colors.xpGrayDark,
        padding: 25,
        width: '100%',
        maxWidth: 400,
    },
    formTitle: {
        textAlign: 'center',
        marginBottom: 20,
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.xpText,
    },
    formGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 5,
        color: colors.xpText,
    },
    authLinkContainer: {
        marginTop: 20,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: colors.xpBorder,
        alignItems: 'center',
    },
    link: {
        color: colors.xpBlue,
        fontSize: 11,
        textDecorationLine: 'underline',
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
    statusSection: {
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
        color: colors.xpText,
    },
});

export default styles;