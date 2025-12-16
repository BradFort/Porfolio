/* @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier */
import { StyleSheet } from 'react-native';
import {styles} from "../(auth)/LoginScreen.styles";

// Fonction qui reçoit le thème en paramètre et retourne les styles
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
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    panelContainer: {
        backgroundColor: theme.xpGrayLight,
        borderWidth: 2,
        borderColor: theme.xpGrayDark,
        padding: 25,
        width: '100%',
        maxWidth: 500,
    },
    title: {
        textAlign: 'center',
        marginBottom: 20,
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.xpText,
    },
    buttonContainer: {
        gap: 20,
    },
    adminButton: {
        height: 32,
    },
    modal: {
        marginTop: 20,
        backgroundColor: theme.xpGrayLight,
        borderWidth: 2,
        borderColor: theme.xpGrayDark,
        padding: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.xpText,
    },
    closeButton: {
        fontSize: 18,
        color: theme.xpText,
        fontWeight: 'bold',
    },
    listContainer: {
        maxHeight: 300,
        borderWidth: 1,
        borderColor: theme.xpGrayDark,
        backgroundColor: theme.xpGrayLight,
        padding: 8,
    },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.xpBorder,
    },
    itemName: {
        fontWeight: 'bold',
        color: theme.xpBlueDark,
        flex: 1,
    },
    deleteButton: {
        backgroundColor: theme.xpRed,
        paddingHorizontal: 12,
        paddingVertical: 4,
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
    errorText: {
        color: theme.xpRed,
        textAlign: 'center',
        padding: 16,
        fontSize: 14,
    },
    filterContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    filterButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: theme.xpGrayLight,
        borderWidth: 1,
        borderColor: theme.xpGrayDark,
        borderRadius: 4,
    },
    activeFilter: {
        backgroundColor: theme.xpBlue,
    },
    filterText: {
        fontSize: 12,
        color: theme.xpText,
        fontWeight: 'bold',
    },
    messageInfo: {
        flex: 1,
        marginRight: 8,
    },
    messageChannel: {
        fontSize: 10,
        color: theme.xpGrayDark,
        fontStyle: 'italic',
        marginTop: 2,
    },
});

export default styles;