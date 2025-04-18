const db = require('../db');

const createUsersTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      socket_id VARCHAR(255)
    );
  `;
  await db.query(query);
};

const findUserByEmail = async (email) => {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};

const createUser = async (name, email, password) => {
  const result = await db.query(
    'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
    [name, email, password]
  );
  return result.rows[0];
};

const updateSocketId = async (userId, socketId) => {
  await db.query('UPDATE users SET socket_id = $1 WHERE id = $2', [socketId, userId]);
};

const clearSocketId = async (userId) => {
  await db.query('UPDATE users SET socket_id = NULL WHERE id = $1', [userId]);
};

module.exports = { createUsersTable, findUserByEmail, createUser, updateSocketId, clearSocketId };