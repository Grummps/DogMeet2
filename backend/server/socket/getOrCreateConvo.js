const Conversation = require('../models/conversationModel');

async function getOrCreateConversation(participants) {
  try {
    const participantIds = participants.map((id) => id.toString());

    let conversation = await Conversation.findOne({
      participants: { $all: participantIds, $size: participantIds.length },
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: participantIds,
      });
      await conversation.save();
    }

    return conversation;
  } catch (error) {
    console.error('Error in getOrCreateConversation:', error);
    throw error;
  }
}

module.exports = getOrCreateConversation;
