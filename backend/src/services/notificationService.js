const { Expo } = require('expo-server-sdk');
const User = require('../models/User');

const expo = new Expo();

async function sendPushNotifications(userIds, title, body, data = {}) {
  console.log(`[NOTIF] sendPushNotifications called for ${userIds.length} users:`, userIds);
  if (!userIds.length) return;

  const users = await User.getPushTokensByUserIds(userIds);
  console.log(`[NOTIF] Found ${users.length} users with push tokens`);
  const messages = [];

  for (const user of users) {
    const pushToken = user.expo_push_token;
    if (!Expo.isExpoPushToken(pushToken)) {
      console.warn(`Invalid Expo push token for user ${user.id}: ${pushToken}`);
      continue;
    }

    messages.push({
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
    });
  }

  console.log(`[NOTIF] Sending ${messages.length} push messages`);
  if (!messages.length) return;

  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      for (const ticket of tickets) {
        if (ticket.status === 'error') {
          console.error('Push notification error:', ticket.message);
        }
      }
    } catch (err) {
      console.error('Failed to send push notification chunk:', err);
    }
  }
}

async function notifySessionFull(session, participants) {
  const userIds = participants.map(p => p.user_id);
  const title = 'Session Full!';
  const body = `"${session.sport_type}" session at ${session.location_address} is now full with ${session.max_participants} players.`;

  await sendPushNotifications(userIds, title, body, {
    type: 'session_full',
    sessionId: session.id,
    sessionSessionId: session.session_id,
  });
}

module.exports = {
  sendPushNotifications,
  notifySessionFull,
};
