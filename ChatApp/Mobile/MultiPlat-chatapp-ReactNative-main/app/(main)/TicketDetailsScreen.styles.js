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
        flexWrap: 'wrap',
    },
    toolbarButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginRight: 5,
        marginBottom: 5,
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 10,
    },
    card: {
        backgroundColor: theme.xpWindow,
        borderWidth: 2,
        borderTopColor: theme.xpBorderLight,
        borderLeftColor: theme.xpBorderLight,
        borderBottomColor: theme.xpBorderDark,
        borderRightColor: theme.xpBorderDark,
        marginBottom: 10,
    },
    cardHeader: {
        backgroundColor: theme.xpBlue,
        padding: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        flex: 1,
    },
    badges: {
        flexDirection: 'row',
        gap: 5,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 3,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    cardBody: {
        padding: 15,
    },
    sectionTitle: {
        color: theme.xpText,
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    description: {
        color: theme.xpText,
        fontSize: 12,
        lineHeight: 18,
        marginBottom: 15,
    },
    metaContainer: {
        borderTopWidth: 1,
        borderTopColor: theme.xpBorderDark,
        paddingTop: 10,
    },
    metaRow: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    metaLabel: {
        color: theme.xpTextLight,
        fontSize: 11,
        fontWeight: 'bold',
        width: 120,
    },
    metaValue: {
        color: theme.xpText,
        fontSize: 11,
        flex: 1,
    },
    noCommentsText: {
        color: theme.xpTextLight,
        fontSize: 12,
        textAlign: 'center',
        padding: 20,
    },
    comment: {
        backgroundColor: theme.xpGrayLight,
        borderWidth: 1,
        borderColor: theme.xpBorderDark,
        padding: 10,
        marginBottom: 10,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    commentAuthor: {
        color: theme.xpText,
        fontSize: 12,
        fontWeight: 'bold',
    },
    commentDate: {
        color: theme.xpTextLight,
        fontSize: 10,
    },
    commentText: {
        color: theme.xpText,
        fontSize: 12,
        lineHeight: 18,
    },
    addCommentContainer: {
        backgroundColor: theme.xpWindow,
        borderTopWidth: 2,
        borderTopColor: theme.xpBorderDark,
        padding: 10,
    },
    commentInput: {
        backgroundColor: theme.xpWindow,
        borderWidth: 2,
        borderTopColor: theme.xpBorderDark,
        borderLeftColor: theme.xpBorderDark,
        borderBottomColor: theme.xpBorderLight,
        borderRightColor: theme.xpBorderLight,
        padding: 10,
        color: theme.xpText,
        fontSize: 12,
        minHeight: 60,
        maxHeight: 120,
        textAlignVertical: 'top',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: theme.xpText,
        fontSize: 14,
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
export default function TicketDetailsScreenStyles() {
    return null;
}
