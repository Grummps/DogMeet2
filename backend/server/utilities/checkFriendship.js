const User = require('../models/userModel'); // Adjust the path as necessary

const checkFriendship = async (senderId, receiverId) => {
  try {
    // Find the sender's document
    const sender = await User.findById(senderId);

    if (!sender) {
      console.log('Sender not found');
      return false;
    }

    // Check if the receiverId is in the sender's friends array
    const isFriend = sender.friends.includes(receiverId);

    return isFriend;
  } catch (error) {
    console.error('Error checking friendship:', error);
    return false;
  }
};

module.exports = checkFriendship;
