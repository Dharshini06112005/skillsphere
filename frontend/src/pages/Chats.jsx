import React, { useState, useEffect, useRef, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';
import API from '../services/api';
import {
  Send,
  MessageSquare,
  User,
  Loader2,
  Clock,
  Check,
  CheckCheck,
  ArrowLeft
} from 'lucide-react';

const Chats = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  
  // Socket reference
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // States
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [contactTyping, setContactTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);

  // Connect Socket.IO on mount
  useEffect(() => {
    socketRef.current = io('http://localhost:5000', {
      transports: ['websocket'],
    });

    // Register current user on connection
    socketRef.current.on('connect', () => {
      console.log('Socket connected inside Chat Component');
      socketRef.current.emit('register_user', user?._id);
    });

    // Listen for incoming messages
    socketRef.current.on('receive_message', (message) => {
      // Append message if it belongs to current active room
      setMessages((prev) => {
        // Prevent duplicate appending
        if (prev.some((m) => m._id === message._id)) return prev;
        
        // Match message room
        if (message.room === activeRoom?.room) {
          return [...prev, message];
        }
        return prev;
      });

      // Re-fetch conversation list to update unread counts and sorting
      fetchRooms();
    });

    // Listen for typing indicator
    socketRef.current.on('typing', (data) => {
      if (data.userId !== user?._id) {
        setContactTyping(data.isTyping);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [activeRoom, user]);

  // Handle URL redirect query triggers (from GigDetails "Chat" button click)
  useEffect(() => {
    const checkQueryParams = async () => {
      await fetchRooms();

      const params = new URLSearchParams(location.search);
      const qRoomId = params.get('roomId');
      const qContactId = params.get('contactId');
      const qContactName = params.get('contactName');

      if (qRoomId && qContactId && qContactName) {
        const dummyActive = {
          room: qRoomId,
          contact: {
            _id: qContactId,
            name: decodeURIComponent(qContactName),
          },
        };
        // Join socket room
        if (socketRef.current) {
          socketRef.current.emit('join_room', qRoomId);
        }
        setActiveRoom(dummyActive);
        loadChatHistory(qRoomId);
      }
    };
    if (user?._id) {
      checkQueryParams();
    }
  }, [location, user]);

  // Scroll to bottom on message load
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, contactTyping]);

  const fetchRooms = async () => {
    try {
      const res = await API.get('/chats/rooms');
      if (res.data.success) {
        setRooms(res.data.chats);
      }
    } catch (err) {
      console.error('Error fetching chat rooms:', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  const loadChatHistory = async (roomId) => {
    setLoadingHistory(true);
    try {
      const res = await API.get(`/chats/history/${roomId}`);
      if (res.data.success) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSelectRoom = (roomData) => {
    setActiveRoom(roomData);
    setMessages([]);
    setContactTyping(false);

    // Join room
    if (socketRef.current) {
      socketRef.current.emit('join_room', roomData.room);
    }
    
    loadChatHistory(roomData.room);
    fetchRooms(); // reset unread count badge
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeRoom) return;

    const payload = {
      sender: user?._id,
      senderName: user?.name,
      recipient: activeRoom.contact?._id,
      room: activeRoom.room,
      text: messageText.trim(),
    };

    // Emit via Socket.IO
    socketRef.current.emit('send_message', payload);
    setMessageText('');

    // Emit stop typing
    socketRef.current.emit('typing', {
      room: activeRoom.room,
      userId: user?._id,
      isTyping: false,
    });
  };

  // Handle typing state
  const handleKeyDown = () => {
    if (!activeRoom || !socketRef.current) return;

    socketRef.current.emit('typing', {
      room: activeRoom.room,
      userId: user?._id,
      isTyping: true,
    });

    if (typingTimeout) clearTimeout(typingTimeout);

    setTypingTimeout(
      setTimeout(() => {
        socketRef.current.emit('typing', {
          room: activeRoom.room,
          userId: user?._id,
          isTyping: false,
        });
      }, 2000)
    );
  };

  return (
    <div className="glass rounded-3xl overflow-hidden shadow-2xl h-[78vh] flex flex-col md:flex-row relative">
      
      {/* Sidebar List of Active Dialogs */}
      <aside className={`w-full md:w-80 border-r border-gray-900 bg-gray-950/40 flex flex-col ${
        activeRoom ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="p-5 border-b border-gray-900 flex justify-between items-center bg-gray-950/20">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageSquare size={18} className="text-indigo-400" /> Chats Inbox
          </h2>
          <span className="text-[10px] bg-gray-900 text-gray-500 border border-gray-800 rounded-full px-2 py-0.5 font-semibold">
            {rooms.length} Active
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-900/60 p-2 space-y-1">
          {loadingRooms ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-xs italic">
              No active conversations yet. Visit a gig page to contact users.
            </div>
          ) : (
            rooms.map((chat) => (
              <div
                key={chat.room}
                onClick={() => handleSelectRoom(chat)}
                className={`flex gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                  activeRoom?.room === chat.room
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'hover:bg-gray-900/40 text-gray-400 hover:text-white'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center font-bold text-indigo-400 uppercase border shrink-0 ${
                  activeRoom?.room === chat.room ? 'border-white/20 text-white' : 'border-gray-800'
                }`}>
                  {chat.contact?.name?.charAt(0) || 'U'}
                </div>
                
                <div className="overflow-hidden flex-grow space-y-0.5">
                  <div className="flex justify-between items-start gap-2">
                    <span className={`text-xs font-semibold truncate block ${
                      activeRoom?.room === chat.room ? 'text-white' : 'text-gray-200'
                    }`}>
                      {chat.contact?.name}
                    </span>
                    <span className="text-[9px] text-gray-500 shrink-0">
                      {new Date(chat.lastMessageDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] truncate leading-tight text-gray-500">
                    {chat.lastMessage}
                  </p>
                </div>

                {chat.unreadCount > 0 && activeRoom?.room !== chat.room && (
                  <span className="bg-indigo-500 text-white text-[9px] font-bold h-5 w-5 rounded-full flex items-center justify-center shrink-0">
                    {chat.unreadCount}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Messaging View (Right Column) */}
      <section className={`flex-1 flex flex-col justify-between bg-dark-bg/30 ${
        activeRoom ? 'flex' : 'hidden md:flex items-center justify-center'
      }`}>
        {activeRoom ? (
          <>
            {/* Header info */}
            <div className="px-6 py-4 border-b border-gray-900 flex items-center gap-4 bg-gray-950/20">
              <button
                onClick={() => setActiveRoom(null)}
                className="md:hidden p-1.5 rounded-lg bg-gray-900 text-gray-400 hover:text-white shrink-0"
              >
                <ArrowLeft size={16} />
              </button>
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold uppercase shrink-0">
                {activeRoom.contact?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{activeRoom.contact?.name}</h3>
                <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-semibold block">
                  Active room session
                </span>
              </div>
            </div>

            {/* Chat message flow */}
            <div className="flex-grow p-6 overflow-y-auto space-y-4">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender === user?._id;
                  return (
                    <div
                      key={msg._id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] p-3.5 rounded-2xl text-sm relative group ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/10'
                          : 'bg-gray-900/60 border border-gray-800 text-gray-300 rounded-bl-none'
                      }`}>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        
                        <div className="flex items-center justify-end gap-1.5 mt-1.5 text-[9px] text-gray-400">
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMe && (
                            msg.isRead ? <CheckCheck size={11} className="text-indigo-300" /> : <Check size={11} className="text-gray-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing indicators */}
              {contactTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-900 border border-gray-800 p-3 rounded-2xl rounded-bl-none text-xs text-gray-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-150"></span>
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-300"></span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Submission */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-900 flex gap-3 bg-gray-950/20">
              <input
                type="text"
                required
                value={messageText}
                onKeyDown={handleKeyDown}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                className="flex-grow bg-gray-950/60 border border-gray-900 focus:border-indigo-500 rounded-xl py-3 px-4 text-sm text-white outline-none"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 px-5 transition-colors cursor-pointer shrink-0 flex items-center justify-center"
              >
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          /* Empty/No selected dialog state */
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400 shadow-lg">
              <MessageSquare size={30} />
            </div>
            <h3 className="text-xl font-bold text-white">Inbox Messenger</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Select a conversation from the active contacts list to initiate chat discussions.
            </p>
          </div>
        )}
      </section>

    </div>
  );
};

export default Chats;
