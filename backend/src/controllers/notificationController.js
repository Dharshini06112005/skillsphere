const Notification = require('../models/Notification');

/**
 * Get current user's notifications
 */
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50); // cap at 50

    // Count total unread
    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Could not fetch notifications feed' });
  }
};

/**
 * Mark notifications as read
 */
exports.markNotificationsAsRead = async (req, res) => {
  try {
    const { id } = req.body; // if id is passed, mark that specific notification, otherwise mark all

    if (id) {
      await Notification.findOneAndUpdate(
        { _id: id, user: req.user._id },
        { isRead: true }
      );
    } else {
      await Notification.updateMany(
        { user: req.user._id, isRead: false },
        { isRead: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Notifications updated successfully',
    });
  } catch (error) {
    console.error('Mark read notifications error:', error);
    res.status(500).json({ success: false, message: 'Could not update read receipts' });
  }
};
