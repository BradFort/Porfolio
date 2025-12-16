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
    filtersContainer: {
        backgroundColor: theme.xpGrayLight,
        padding: 10,
        borderBottomWidth: 2,
        borderBottomColor: theme.xpBorderDark,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    filterLabel: {
        color: theme.xpText,
        fontSize: 12,
        fontWeight: 'bold',
        marginRight: 10,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        backgroundColor: theme.xpGrayLight,
        borderWidth: 1,
        borderTopColor: theme.xpBorderLight,
        borderLeftColor: theme.xpBorderLight,
        borderBottomColor: theme.xpBorderDark,
        borderRightColor: theme.xpBorderDark,
    },
    filterChipActive: {
        backgroundColor: theme.xpBlue,
        borderTopColor: theme.xpBorderDark,
        borderLeftColor: theme.xpBorderDark,
        borderBottomColor: theme.xpBorderLight,
        borderRightColor: theme.xpBorderLight,
    },
    filterChipText: {
        color: theme.xpText,
        fontSize: 11,
    },
    filterChipTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    ticketsList: {
        flex: 1,
    },
    ticketsListContent: {
        padding: 10,
    },
    ticketCard: {
        backgroundColor: theme.xpWindow,
        borderWidth: 2,
        borderTopColor: theme.xpBorderLight,
        borderLeftColor: theme.xpBorderLight,
        borderBottomColor: theme.xpBorderDark,
        borderRightColor: theme.xpBorderDark,
        marginBottom: 10,
        padding: 10,
    },
    ticketContent: {
        marginBottom: 10,
    },
    ticketHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    ticketTitle: {
        flex: 1,
        color: theme.xpText,
        fontSize: 14,
        fontWeight: 'bold',
        marginRight: 10,
    },
    ticketBadges: {
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
    ticketDescription: {
        color: theme.xpText,
        fontSize: 12,
        marginBottom: 8,
        lineHeight: 18,
    },
    ticketFooter: {
        borderTopWidth: 1,
        borderTopColor: theme.xpBorderDark,
        paddingTop: 8,
    },
    ticketMeta: {
        color: theme.xpTextLight,
        fontSize: 11,
        marginBottom: 2,
    },
    ticketDate: {
        color: theme.xpTextLight,
        fontSize: 10,
        marginTop: 4,
    },
    ticketActions: {
        flexDirection: 'row',
        gap: 5,
    },
    loadingText: {
        color: theme.xpText,
        textAlign: 'center',
        padding: 20,
        fontSize: 14,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        color: theme.xpTextLight,
        fontSize: 14,
        textAlign: 'center',
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
export default function TicketsScreenStyles() {
    return null;
}
