import React from 'react';

const MessageBox = ({ message }) => {
  if (!message) return null;
  
  return (
    <div className="message-box">
      {message}
    </div>
  );
};

export default MessageBox;