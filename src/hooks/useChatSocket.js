import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const useChatSocket = (userId, otherUserId, username) => {
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io('http://51.120.11.157:3000', {
      auth: { userId, otherUserId, username },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Conectado al chat');
    });

    socket.on('chat message', (msg, serverOffset, senderUsername) => {
      console.log(`[Cliente] Nuevo mensaje de ${senderUsername}: ${msg.message}`);

      setMessages((prevMessages) => [
        ...prevMessages,
        { msg, 
          user: senderUsername,
          timestamp: msg.timestamp, 
        },
      ]);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, otherUserId, username]);

  const sendMessage = (message) => {
    if (socketRef.current) {
      const messagePayload = {
        message,
        from: userId,
        to: otherUserId,
        username,
        timestamp: Date.now(), 
      };
      console.log('[HOOK] Enviando mensaje con payload:', messagePayload); // Log correcto
  
      socketRef.current.emit('chat message', messagePayload);
    }
  };

  return { messages, sendMessage };
};

export default useChatSocket;
