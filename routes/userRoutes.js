const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/socket', userController.updateSocketId);
router.post('/socket/clear', userController.clearSocketId);

// New endpoint to get all users (for sidebar)
router.get('/', async (req, res) => {
  try {
    const users = await req.db.query('SELECT id, name, email FROM users');
    res.json(users.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;