const db = require('../db');
const chatModel = require('./chatModel');

const createMessagesTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      sender INT NOT NULL,
      receiver INT NOT NULL,
      content TEXT NOT NULL,
      chat_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender) REFERENCES users(id),
      FOREIGN KEY (receiver) REFERENCES users(id),
      FOREIGN KEY (chat_id) REFERENCES chats(id)
    );
  `;
  await db.query(query);
};

const saveMessage = async (senderId, receiverId, content, chatId = null) => {
  if (!chatId) {
    const chat = await chatModel.findOrCreateChat(senderId, receiverId);
    chatId = chat.id;
  }

  const result = await db.query(
    'INSERT INTO messages (sender, receiver, content, chat_id) VALUES ($1, $2, $3, $4) RETURNING *',
    [senderId, receiverId, content, chatId]
  );
  return result.rows[0];
};

const getMessagesByChat = async (user1Id, user2Id) => {
  const chat = await chatModel.findOrCreateChat(user1Id, user2Id);
  const chatId = chat.id;

  const result = await db.query(
    'SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at ASC',
    [chatId]
  );
  return result.rows;
};
const getMessagesByGroupChatId = async (chatId) => {
  const result = await db.query(
    `SELECT m.*, u.name AS sender_name
     FROM messages m
     JOIN users u ON m.sender = u.id
     WHERE m.chat_id = $1
     ORDER BY m.created_at ASC`,
    [chatId]
  );
  return result.rows;
};
const getLastMessageBetweenUsers = async (user1Id, user2Id) => {
  const chat = await chatModel.findOrCreateChat(user1Id, user2Id);
  const chatId = chat.id;

  const result = await db.query(
    'SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at DESC LIMIT 1',
    [chatId]
  );
  return result.rows[0];
};
const getLastMessageForGroup = async (chatId) => {
  const result = await db.query(
    `SELECT m.*, u.name AS sender_name
     FROM messages m
     JOIN users u ON m.sender = u.id
     WHERE m.chat_id = $1
     ORDER BY m.created_at DESC
     LIMIT 1`,
    [chatId]
  );
  return result.rows[0];
};
module.exports = { createMessagesTable, saveMessage, getMessagesByChat, getMessagesByGroupChatId, getLastMessageBetweenUsers, getLastMessageForGroup };
