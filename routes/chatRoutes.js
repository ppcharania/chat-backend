const express = require('express');
const router = express.Router();
const chatModel = require('../models/chatModel');

// ✅ Create a new group
router.post('/group', async (req, res) => {
  try {
    const { groupName, userIds } = req.body;

    if (!groupName || !userIds || userIds.length < 2) {
      return res.status(400).json({ message: 'Group name and at least 2 members are required' });
    }

    const chat = await chatModel.createGroupChat(groupName, userIds);
    res.status(201).json(chat);
  } catch (err) {
    console.error('❌ Error creating group:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Get all groups user is part of
router.get('/user/:userId/groups', async (req, res) => {
  try {
    const { userId } = req.params;
    const groups = await chatModel.getUserGroups(userId);
    res.status(200).json(groups);
  } catch (err) {
    console.error('❌ Error fetching user groups:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
