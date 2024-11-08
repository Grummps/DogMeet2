const Conversation = require('../models/conversationModel');

const getOrCreateConversation = async (participants) => {
  let conversation = await Conversation.findOne({
    participants: { $all: participants, $size: participants.length },
  });

  if (!conversation) {
    conversation = new Conversation({ participants });
    await conversation.save();
  }

  return conversation;
};

module.exports = getOrCreateConversation;