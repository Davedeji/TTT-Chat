import "./index.css"
import React, { useState } from 'react';
import uuid from 'react-uuid';


const ChatFooter = ({socket}) => {
  const [message, setMessage] = useState('');

  const handleSendMessage = (e) => {
        e.preventDefault();
        if (message.trim()) {
          socket.current?.send(JSON.stringify({
            action: 'sendMessage',
            text: message,
            name: localStorage.getItem('userName'),
            id: uuid(),
            socketID: localStorage.getItem('socketID'),
          }));
        }
        setMessage('');
      };
  return (
    <div className="chat__footer">
      <form className="form" onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder="Write message"
          className="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button className="sendBtn">SEND</button>
      </form>
    </div>
  );
};

export default ChatFooter;
