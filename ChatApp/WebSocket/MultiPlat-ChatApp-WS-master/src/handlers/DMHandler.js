/**
 * Auteurs : Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 */

const WebSocket = require('ws');
const logger = require('../utils/logger');

/**
 * Notifie les utilisateurs participants lorsqu'un nouveau message direct (DM) est créé.
 * @param {object} server - Instance du serveur WebSocket
 * @param {object} data - Données du DM créé
 */
function notifyDMCreated(server, data) {
    if (!server.wss) return;

    const { dm_id, channel_id, participant1_id, participant2_id, channel, created_at } = data;
    let sentCount = 0;

    logger.info(`[DM] Broadcasting DM creation to participants: ${participant1_id}, ${participant2_id}`);

    server.wss.clients.forEach(client => {
        if (client.readyState !== WebSocket.OPEN || !client.authenticated) return;

        try {
            // Notify both participants
            if (String(client.userId) === String(participant1_id) || 
                String(client.userId) === String(participant2_id)) {
                
                client.send(JSON.stringify({
                    type: 'dm_created',
                    dm_id: dm_id,
                    channel_id: channel_id,
                    channel: channel,
                    participant1_id: participant1_id,
                    participant2_id: participant2_id,
                    created_at: created_at,
                    timestamp: new Date().toISOString()
                }));
                
                sentCount++;
                logger.info(`[DM] DM creation notification sent to userId: ${client.userId}`);
            }
        } catch (error) {
            logger.error(`[DM] Error sending DM creation notification:`, error);
        }
    });

    logger.info(`[DM] DM creation broadcasted to ${sentCount} participant(s)`);
}

module.exports = {
    notifyDMCreated
};