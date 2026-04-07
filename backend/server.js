const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const path = require('path');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow ALL requests (fixes Vercel CORS issue dynamically)
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
app.set('io', io);

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join Personal Room for Notifications
  socket.on('join_personal_room', (userId) => {
    socket.join(userId);
    console.log(`User ${socket.id} joined personal room ${userId}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const { room, sender, receiver, message } = data;

      // Save to Database
      const Chat = require('./models/Chat');
      const newChat = new Chat({
        sender,
        receiver,
        message
      });
      await newChat.save();

      // Emit to conversation room (for current chat window)
      socket.to(room).emit('receive_message', {
        ...data,
        timestamp: newChat.timestamp
      });

      // Emit notification to receiver's personal room (for Navbar/Global alerts)
      io.to(receiver).emit('new_notification', {
        sender,
        message,
        timestamp: newChat.timestamp
      });
    } catch (err) {
      console.error("Socket send_message error:", err);
    }
  });

  // WebRTC Signaling Events
  socket.on("callUser", (data) => {
    io.to(data.userToCall).emit("callUser", { signal: data.signalData, from: data.from, name: data.name });
  });

  socket.on("answerCall", (data) => {
    io.to(data.to).emit("callAccepted", data.signal);
  });

  socket.on("toggle_mic", (data) => {
    io.to(data.to).emit("toggle_mic", { isMuted: data.isMuted });
  });

  socket.on("toggle_video", (data) => {
    io.to(data.to).emit("toggle_video", { isVideoOff: data.isVideoOff });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Database Connection
const connectDB = async () => {
  const MONGO_URI = process.env.MONGO_URI;
  const maskedUri = MONGO_URI ? MONGO_URI.replace(/:([^@]+)@/, ':****@') : 'UNDEFINED';

  const options = {
    serverSelectionTimeoutMS: 5000, // Fail faster initially to trigger retry
  };

  const connectWithRetry = async () => {
    console.log(`🔄 Attempting to connect to MongoDB: ${maskedUri}`);
    try {
      await mongoose.connect(MONGO_URI, options);
      console.log('✅ MongoDB Connected Successfully');
    } catch (err) {
      console.error('❌ Database connection error:', err.message);

      if (err.message.includes('IP') || err.message.includes('whitelisted')) {
        console.error('👉 TIP: Please check if your IP is whitelisted in MongoDB Atlas (Network Access).');
      }

      console.log('🔄 Retrying in 5 seconds...');
      setTimeout(connectWithRetry, 5000);
    }
  };

  // Set global Mongoose behavior
  // Disable buffering so that queries fail immediately if not connected
  mongoose.set('bufferCommands', false);

  connectWithRetry();
};
connectDB();

// Basic Route
app.get('/', (req, res) => {
  res.send('SkillSwap API Running');
});

// Import Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/skills', require('./routes/skills'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/video', require('./routes/video'));
app.use('/api/certificate', require('./routes/certificate'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/notifications', require('./routes/notifications'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
