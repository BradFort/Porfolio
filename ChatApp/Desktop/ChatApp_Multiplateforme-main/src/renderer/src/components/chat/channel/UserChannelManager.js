/**
 * Adds the user to the channel's userList if not already present.
 * @param {Object} channel - The channel object.
 * @param {Object} user - The user object.
 */
export function joinChannel(channel, user) {
  if (!Array.isArray(channel.userList)) {
    channel.userList = []
  }
  if (!channel.userList.some((u) => u.id === user.id)) {
    channel.userList.push(user)
  }
}

/**
 * Removes the user from the channel's userList.
 * @param {Object} channel - The channel object.
 * @param {Object} user - The user object.
 */
export function leaveChannel(channel, user) {
  channel.userList = channel.userList.filter((u) => u.id !== user.id)
}
