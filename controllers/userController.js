const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'prathamesh0901'; // Move to .env later

exports.loginUser = async (req, res) => {
  const { email, password, socketId } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password required' });

  try {
    const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0)
      return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid credentials' });

    if (socketId) {
      await db.query('UPDATE users SET socket_id = $1 WHERE id = $2', [socketId, user.rows[0].id]);
    }

    const token = jwt.sign({ id: user.rows[0].id }, JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email,
        socketId: socketId || null,
        token,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ message: 'All fields are required' });

  try {
    const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0)
      return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await db.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hashedPassword]
    );

    res.status(201).json({ message: 'User registered successfully', user: newUser.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateSocketId = async (req, res) => {
  const { userId, socketId } = req.body;

  if (!userId || !socketId)
    return res.status(400).json({ message: 'User ID and Socket ID required' });

  try {
    await db.query('UPDATE users SET socket_id = $1 WHERE id = $2', [socketId, userId]);
    res.status(200).json({ message: 'Socket ID updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.clearSocketId = async (req, res) => {
  const { userId } = req.body;

  if (!userId)
    return res.status(400).json({ message: 'User ID required' });

  try {
    await db.query('UPDATE users SET socket_id = NULL WHERE id = $1', [userId]);
    res.status(200).json({ message: 'Socket ID cleared' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};