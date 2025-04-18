const express = require('express');
const router = express.Router();
const Message = require('../models/messageModel');

// ✅ Group messages FIRST
router.get('/group/:chatId', async (req, res) => {
  try {
    const chatId = parseInt(req.params.chatId);
    if (isNaN(chatId)) throw new Error('Invalid chatId');

    const messages = await Message.getMessagesByGroupChatId(chatId);
    console.log('✅ Messages returned:', messages.length);
    res.json(messages);
  } catch (err) {
    console.error('❌ Error fetching group messages:', err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ 1-on-1 chat messages SECOND
router.get('/:user1Id/:user2Id', async (req, res) => {
  try {
    const { user1Id, user2Id } = req.params;
    const messages = await Message.getMessagesByChat(user1Id, user2Id);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/last/:user1Id/:user2Id', async (req, res) => {
  try {
    const { user1Id, user2Id } = req.params;
    const message = await Message.getLastMessageBetweenUsers(user1Id, user2Id);
    res.json(message || {});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.get('/group/last/:chatId', async (req, res) => {
  try {
    const chatId = parseInt(req.params.chatId);
    if (isNaN(chatId)) throw new Error('Invalid chat ID');

    const message = await Message.getLastMessageForGroup(chatId);
    res.json(message || {});
  } catch (err) {
    console.error('❌ Error fetching last group message:', err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Sending new message
router.post('/', async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;
    const message = await Message.saveMessage(senderId, receiverId, content);
    res.status(201).json(message);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
