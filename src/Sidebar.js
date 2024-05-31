import React from 'react';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import ListIcon from '@mui/icons-material/List';
import PauseIcon from '@mui/icons-material/Pause';
import ApiIcon from '@mui/icons-material/Api';
import './sidebarCss.css';

const Sidebar = () => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside>
      <div className="description pr-4">Widget Library.</div>
      <div className="dndnode input" onDragStart={(event) => onDragStart(event, 'Message')} draggable>
        <div>
          <ChatBubbleIcon fontSize="large" className="icon" /><span style={{ marginLeft: '15%' }}>Send Message</span>
        </div>
        <div>
          <p>Send a message.</p>
        </div>
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'Options')} draggable>
        <div>
          <ListIcon fontSize="large" className="icon" /><span style={{ marginLeft: '12%' }}>Select Messages</span>
        </div>
        <div>
          <p>Select a list of options.</p>
        </div>
      </div>
      <div className="dndnode api" onDragStart={(event) => onDragStart(event, 'Api Caller')} draggable>
        <div>
          <ApiIcon fontSize="large" className="icon" /><span style={{ marginLeft: '14%' }}>Request an API</span>
        </div>
        <div>
          <p>Perform an API request.</p>
        </div>
      </div>
      <div className="dndnode output" onDragStart={(event) => onDragStart(event, 'End Of Flow')} draggable>
        <div>
          <PauseIcon fontSize="large" className="icon" /><span style={{ marginLeft: '19%' }}>End Of Flow</span>
        </div>
        <div>
          <p>End the current flow.</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
