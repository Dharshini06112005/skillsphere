const Message = require('../models/Message');
const User = require('../models/User');

/**
 * Get message history for a room
 */
exports.getChatHistory = async (req, res) => {
  try {
    const { roomId } = req.params;

    // Room format is user1_user2. Verify requesting user is in the room.
    const roomUsers = roomId.split('_');
    if (!roomUsers.includes(req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this conversation' });
    }

    // Fetch messages
    const messages = await Message.find({ room: roomId })
      .sort({ createdAt: 1 })
      .exec();

    // Mark messages sent to this user as read
    await Message.updateMany(
      { room: roomId, recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ success: false, message: 'Could not fetch message history' });
  }
};

/**
 * Get active conversations (Rooms) for user
 */
exports.getChatRooms = async (req, res) => {
  try {
    const userId = req.user._id;

    // Aggregate unique rooms the user participates in
    const rooms = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { recipient: userId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: '$room',
          lastMessage: { $first: '$$ROOT' },
        },
      },
      {
        $sort: { 'lastMessage.createdAt': -1 },
      },
    ]);

    // Populate the contact details (the counterpart user in each room)
    const chats = await Promise.all(
      rooms.map(async (room) => {
        const contactId =
          room.lastMessage.sender.toString() === userId.toString()
            ? room.lastMessage.recipient
            : room.lastMessage.sender;

        const contact = await User.findById(contactId).select('name email role status');
        
        // Count unread messages in this room sent to current user
        const unreadCount = await Message.countDocuments({
          room: room._id,
          recipient: userId,
          isRead: false,
        });

        return {
          room: room._id,
          lastMessage: room.lastMessage.text,
          lastMessageDate: room.lastMessage.createdAt,
          unreadCount,
          contact,
        };
      })
    );

    res.status(200).json({
      success: true,
      chats: chats.filter((c) => c.contact !== null), // remove empty/deleted accounts
    });
  } catch (error) {
    console.error('Get chat rooms error:', error);
    res.status(500).json({ success: false, message: 'Could not fetch conversation list' });
  }
};
