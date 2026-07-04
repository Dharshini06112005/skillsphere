const { Server } = require('socket.io');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

// In-memory mapping of User ID to socket ID
const activeUsers = new Map();

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Register user ID with socket ID for live notifications
    socket.on('register_user', (userId) => {
      if (userId) {
        activeUsers.set(userId, socket.id);
        console.log(`User registered: ${userId} -> Socket: ${socket.id}`);
      }
    });

    // Join a chat room
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room: ${roomId}`);
    });

    // Send a message
    socket.on('send_message', async (data) => {
      try {
        const { sender, recipient, room, text, fileUrl } = data;

        if (!sender || !recipient || !room || !text) {
          console.warn('Invalid message payload received.');
          return;
        }

        // 1. Save message to Database
        const message = await Message.create({
          sender,
          recipient,
          room,
          text,
          fileUrl,
        });

        // 2. Broadcast message to room members
        io.to(room).emit('receive_message', message);

        // 3. Trigger Notification creation for recipient
        const notification = await Notification.create({
          user: recipient,
          type: 'message_received',
          message: `New message from ${data.senderName || 'Client'}: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
          relatedId: room,
        });

        // 4. Send real-time notification to recipient if online
        const recipientSocketId = activeUsers.get(recipient);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('new_notification', notification);
        }

      } catch (err) {
        console.error('Error saving or broadcasting message:', err);
      }
    });

    // Typing Indicators
    socket.on('typing', (data) => {
      // Broadcast to everyone else in the room
      socket.to(data.room).emit('typing', {
        userId: data.userId,
        isTyping: data.isTyping,
      });
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      
      // Remove user from active registration map
      for (const [userId, socketId] of activeUsers.entries()) {
        if (socketId === socket.id) {
          activeUsers.delete(userId);
          console.log(`User deregistered: ${userId}`);
          break;
        }
      }
    });
  });

  // Export helper to trigger notifications from Express endpoints
  return {
    io,
    sendLiveNotification: (userId, notificationData) => {
      const socketId = activeUsers.get(userId.toString());
      if (socketId) {
        io.to(socketId).emit('new_notification', notificationData);
      }
    }
  };
};

module.exports = initializeSocket;
