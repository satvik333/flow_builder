import React from 'react';
import AddCommentIcon from '@mui/icons-material/AddComment';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import ListIcon from '@mui/icons-material/List';
import PauseIcon from '@mui/icons-material/Pause';
import ApiIcon from '@mui/icons-material/Api';

export default () => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside>
      <div className="description">Widget Library.</div>
      <div className="dndnode input" onDragStart={(event) => onDragStart(event, 'Message')} draggable>
        <ChatBubbleIcon fontSize="large" className='pr-2'/> Message
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'Options')} draggable>
        <ListIcon fontSize="large" className='pr-2'/> Select Messages
      </div>
      <div className="dndnode api" onDragStart={(event) => onDragStart(event, 'Api Caller')} draggable>
        <ApiIcon fontSize="large" className='pr-2'/> Api Caller
      </div>
      <div className="dndnode output" onDragStart={(event) => onDragStart(event, 'End Of Flow')} draggable>
        <PauseIcon fontSize="large" className='pr-2'/> End Of Flow
      </div>
    </aside>
  );
};
