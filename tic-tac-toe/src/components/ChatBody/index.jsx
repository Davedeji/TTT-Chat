import "./index.css"
import React from 'react';

const ChatBody = ({ messages }) => {

  const handleLeaveChat = () => {
    // localStorage.removeItem('userName');
    // // navigate('/');
    // window.location.reload();
  };

  return (
    <>
      <header className="chat__mainHeader">
        <h3>Tic Tac Hangout</h3>
        {/* <button className="leaveChat__btn" onClick={handleLeaveChat}>
          LEAVE CHAT
        </button> */}
      </header>

      <div className="message__container">
        {messages.map((message) =>
          message.name === localStorage.getItem('userName') ? (
            <div className="message__chats" key={message.id}>
              <p className="sender__name">You</p>
              <div className="message__sender">
                <p>{message.text}</p>
              </div>
            </div>
          ) : (
            <div className="message__chats" key={message.id}>
              <p>{"Other"}</p>
              <div className="message__recipient">
                <p>{message.text}</p>
              </div>
            </div>
          )
        )}

        {/*This is triggered when a user is typing*/}
        {/* <div className="message__status">
          <p>Someone is typing...</p>
        </div> */}
      </div>
    </>
  );
};

export default ChatBody;