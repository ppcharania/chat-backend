const db = require('../db');

const createChatsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS chats (
      id SERIAL PRIMARY KEY,
      user1_id INT,
      user2_id INT,
      chat_name VARCHAR(255),
      is_group_chat BOOLEAN DEFAULT FALSE,
      FOREIGN KEY (user1_id) REFERENCES users(id),
      FOREIGN KEY (user2_id) REFERENCES users(id)
    );
  `;
  await db.query(query);
};

// ✅ 1-on-1 chat logic
const findOrCreateChat = async (user1Id, user2Id) => {
  const [minId, maxId] = [Math.min(user1Id, user2Id), Math.max(user1Id, user2Id)];

  let result = await db.query(
    'SELECT * FROM chats WHERE user1_id = $1 AND user2_id = $2 AND is_group_chat = FALSE',
    [minId, maxId]
  );

  if (result.rows.length === 0) {
    result = await db.query(
      'INSERT INTO chats (user1_id, user2_id, chat_name, is_group_chat) VALUES ($1, $2, $3, FALSE) RETURNING *',
      [minId, maxId, `Chat between ${minId} and ${maxId}`]
    );
  }

  return result.rows[0];
};

// ✅ Group chat logic
const createGroupChat = async (groupName, userIds) => {
  const result = await db.query(
    'INSERT INTO chats (chat_name, is_group_chat) VALUES ($1, TRUE) RETURNING *',
    [groupName]
  );

  const chat = result.rows[0];

  for (const userId of userIds) {
    await db.query(
      'INSERT INTO chat_users (chat_id, user_id) VALUES ($1, $2)',
      [chat.id, userId]
    );
  }

  return chat;
};

// ✅ Get groups for sidebar
const getUserGroups = async (userId) => {
  const result = await db.query(
    `SELECT c.* FROM chats c
     JOIN chat_users cu ON c.id = cu.chat_id
     WHERE cu.user_id = $1 AND c.is_group_chat = TRUE`,
    [userId]
  );
  return result.rows;
};

module.exports = {
  createChatsTable,
  findOrCreateChat,
  createGroupChat,
  getUserGroups,
};
