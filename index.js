const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const chatRoutes = require('./routes/chatRoutes');
const db = require('./db');
const userModel = require('./models/userModel');
const messageModel = require('./models/messageModel');
const chatModel = require('./models/chatModel');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// DB middleware
app.use((req, res, next) => {
  req.db = db;
  next();
});
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/chats', chatRoutes);

// DB tables init
(async () => {
  try {
    await userModel.createUsersTable();
    await messageModel.createMessagesTable();
    await chatModel.createChatsTable();
    console.log('✅ Database tables initialized');
  } catch (err) {
    console.error('❌ Error initializing tables:', err);
  }
})();

// Socket tracking
const onlineUsers = new Map();

const broadcastOnlineUsers = () => {
  const userIds = Array.from(onlineUsers.keys());
  io.emit('online-users', userIds);
};

io.on('connection', (socket) => {
  console.log('⚡ User connected:', socket.id);

  socket.on('register-user', async (userId) => {
    onlineUsers.set(userId, socket.id);
    await userModel.updateSocketId(userId, socket.id);
    broadcastOnlineUsers();
    console.log(`✅ Registered user ${userId} with socket ${socket.id}`);
  });

  socket.on('join_chat', async ({ senderId, receiverId, room }) => {
    const chatRoom = room || `${Math.min(senderId, receiverId)}-${Math.max(senderId, receiverId)}`;
    socket.join(chatRoom);
    await userModel.updateSocketId(senderId, socket.id);
    console.log(`👥 User ${senderId} joined chat: ${chatRoom}`);
  });

  socket.on('leave_chat', async ({ senderId, receiverId, room }) => {
    const chatRoom = room || `${Math.min(senderId, receiverId)}-${Math.max(senderId, receiverId)}`;
    socket.leave(chatRoom);
    await userModel.clearSocketId(senderId);
    console.log(`👋 User ${senderId} left chat: ${chatRoom}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const { senderId, receiverId, content, chatId, isGroupChat } = data;

      let message;
      let room;

      if (isGroupChat) {
        // save group message
        message = await messageModel.saveMessage(senderId, null, content, chatId);

        // attach sender_name manually
        const senderRes = await db.query('SELECT name FROM users WHERE id = $1', [senderId]);
        message.sender_name = senderRes.rows[0]?.name;

        room = `group-${chatId}`;
      } else {
        // save 1-on-1 message
        message = await messageModel.saveMessage(senderId, receiverId, content);
        room = `${Math.min(senderId, receiverId)}-${Math.max(senderId, receiverId)}`;
      }

      // broadcast
      io.to(room).emit('receive_message', message);
    } catch (err) {
      console.error('❌ Error sending message:', err);
    }
  });

  socket.on('disconnect', async () => {
    const user = await db.query('SELECT id FROM users WHERE socket_id = $1', [socket.id]);
    if (user.rows.length > 0) {
      const userId = user.rows[0].id;
      onlineUsers.delete(userId);
      await userModel.clearSocketId(userId);
    }
    broadcastOnlineUsers();
    console.log('🛑 User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

