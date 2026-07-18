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
  ArrowLeft,
  Paperclip,
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  ExternalLink
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

  // File sharing & Video call states
  const [fileUrl, setFileUrl] = useState('');
  const [showFileModal, setShowFileModal] = useState(false);

  const [activeVideoCall, setActiveVideoCall] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callTimer, setCallTimer] = useState(null);

  useEffect(() => {
    if (activeVideoCall) {
      setCallDuration(0);
      const timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
      setCallTimer(timer);
    } else {
      if (callTimer) {
        clearInterval(callTimer);
        setCallTimer(null);
      }
    }
    return () => {
      if (callTimer) clearInterval(callTimer);
    };
  }, [activeVideoCall]);

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

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

  const handleSendMessage = (e, customFileUrl) => {
    if (e) e.preventDefault();
    const activeText = messageText.trim();
    if (!activeText && !customFileUrl) return;

    const payload = {
      sender: user?._id,
      senderName: user?.name,
      recipient: activeRoom.contact?._id,
      room: activeRoom.room,
      text: activeText || '📎 Sent an attachment',
      fileUrl: customFileUrl || null
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

  const handleSendFileLink = (e) => {
    e.preventDefault();
    if (!fileUrl.trim()) return;

    handleSendMessage(null, fileUrl.trim());
    setFileUrl('');
    setShowFileModal(false);
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
            <div className="px-6 py-4 border-b border-gray-900 flex justify-between items-center bg-gray-950/20">
              <div className="flex items-center gap-4">
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

              <button
                type="button"
                onClick={() => setActiveVideoCall(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl p-2.5 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-lg shadow-indigo-600/30"
                title="Start WebRTC Video Call"
              >
                <Video size={15} /> Video Call
              </button>
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

                        {msg.fileUrl && (
                          <div className="mt-2.5 p-2 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-4">
                            <span className="text-[10px] text-gray-300 truncate max-w-[150px]">
                              📁 Attached File Link
                            </span>
                            <a
                              href={msg.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 underline flex items-center gap-0.5 shrink-0"
                            >
                              Download <ExternalLink size={10} />
                            </a>
                          </div>
                        )}
                        
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
            <form onSubmit={(e) => handleSendMessage(e)} className="p-4 border-t border-gray-900 flex gap-3 bg-gray-950/20">
              <button
                type="button"
                onClick={() => setShowFileModal(true)}
                className="bg-gray-900 border border-gray-800 hover:border-indigo-500/30 text-indigo-400 rounded-xl p-3.5 transition-colors cursor-pointer shrink-0 flex items-center justify-center"
                title="Attach Document URL"
              >
                <Paperclip size={16} />
              </button>
              <input
                type="text"
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

      {/* Mock File Attachment Modal */}
      {showFileModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSendFileLink} className="glass p-6 md:p-8 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden animate-fade-in">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2 border-b border-gray-800 pb-3">
              <Paperclip className="text-indigo-400" />
              Attach File Reference
            </h3>
            <p className="text-xs text-gray-400 mb-5">
              Paste a link to share specifications, wireframes, or documents with your contact.
            </p>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Document URL Link</label>
                <input
                  type="url"
                  required
                  placeholder="e.g. https://drive.google.com/your-project-file"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-800 focus:border-indigo-500 rounded-xl py-2.5 px-4 text-white text-xs outline-none"
                />
              </div>
            </div>
            <div className="flex gap-4 pt-6 mt-4 border-t border-gray-950">
              <button
                type="button"
                onClick={() => {
                  setShowFileModal(false);
                  setFileUrl('');
                }}
                className="w-1/2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold py-3 px-4 rounded-xl border border-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/30"
              >
                Attach File
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mock WebRTC Video Call Screen Overlay */}
      {activeVideoCall && (
        <div className="fixed inset-0 z-50 bg-gray-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass p-6 md:p-8 rounded-3xl max-w-2xl w-full h-[80vh] shadow-2xl relative flex flex-col justify-between overflow-hidden animate-fade-in border border-indigo-500/10">
            
            {/* Call Header */}
            <div className="flex justify-between items-center relative z-10 border-b border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white animate-pulse">
                  {activeRoom?.contact?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{activeRoom?.contact?.name}</h3>
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                    WebRTC Connected (Peer-to-Peer)
                  </span>
                </div>
              </div>
              <div className="text-sm font-semibold text-gray-400 bg-gray-900 px-3 py-1 rounded-xl">
                {formatDuration(callDuration)}
              </div>
            </div>

            {/* Main Call Video Streams Area */}
            <div className="flex-grow my-6 rounded-2xl bg-gray-950 border border-gray-805 relative flex items-center justify-center overflow-hidden">
              {videoMuted ? (
                <div className="text-center space-y-2 relative z-10">
                  <VideoOff className="w-12 h-12 text-gray-600 mx-auto" />
                  <span className="text-xs text-gray-500 font-semibold">Peer video is muted</span>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-indigo-950/20">
                  <div className="space-y-4 text-center">
                    <div className="flex gap-1.5 justify-center items-end h-16">
                      <span className="w-2 bg-indigo-500 rounded animate-[pulse_1s_infinite_100ms] h-8"></span>
                      <span className="w-2 bg-indigo-500 rounded animate-[pulse_1s_infinite_200ms] h-12"></span>
                      <span className="w-2 bg-indigo-500 rounded animate-[pulse_1s_infinite_300ms] h-16"></span>
                      <span className="w-2 bg-indigo-500 rounded animate-[pulse_1s_infinite_400ms] h-10"></span>
                      <span className="w-2 bg-indigo-500 rounded animate-[pulse_1s_infinite_500ms] h-6"></span>
                    </div>
                    <span className="text-xs text-gray-400 block uppercase tracking-wider font-semibold">Streaming video feed...</span>
                  </div>
                </div>
              )}

              {/* Self Stream (Small PIP Corner View) */}
              <div className="absolute bottom-4 right-4 w-32 h-44 rounded-xl bg-gray-900 border-2 border-indigo-500 overflow-hidden shadow-2xl flex items-center justify-center">
                {videoMuted ? (
                  <VideoOff className="w-6 h-6 text-gray-500" />
                ) : (
                  <div className="text-center space-y-1">
                    <div className="w-8 h-8 rounded-full bg-gray-800 mx-auto flex items-center justify-center text-[10px] text-gray-400 font-bold border border-gray-700">
                      Me
                    </div>
                    <span className="text-[8px] text-indigo-400 font-semibold block uppercase tracking-widest">Self Feed</span>
                  </div>
                )}
              </div>
            </div>

            {/* Call Controls Footer */}
            <div className="flex justify-center items-center gap-6 relative z-10 pt-4 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setAudioMuted(!audioMuted)}
                className={`p-3 rounded-full transition-all cursor-pointer ${
                  audioMuted ? 'bg-red-650 text-white' : 'bg-gray-900 hover:bg-gray-800 text-gray-300'
                }`}
                title={audioMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {audioMuted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              <button
                type="button"
                onClick={() => setActiveVideoCall(false)}
                className="p-3.5 bg-red-600 hover:bg-red-500 text-white rounded-full transition-colors cursor-pointer shadow-lg shadow-red-600/30"
                title="Hang Up Call"
              >
                <PhoneOff size={20} />
              </button>

              <button
                type="button"
                onClick={() => setVideoMuted(!videoMuted)}
                className={`p-3 rounded-full transition-all cursor-pointer ${
                  videoMuted ? 'bg-red-655 text-white' : 'bg-gray-900 hover:bg-gray-800 text-gray-300'
                }`}
                title={videoMuted ? 'Start Video' : 'Stop Video'}
              >
                {videoMuted ? <VideoOff size={18} /> : <Video size={18} />}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Chats;
