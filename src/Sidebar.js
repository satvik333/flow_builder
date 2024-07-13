import React from 'react';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import ListIcon from '@mui/icons-material/List';
import PauseIcon from '@mui/icons-material/Pause';
import ApiIcon from '@mui/icons-material/Api';
import DynamicFormIcon from '@mui/icons-material/DynamicForm';
import './sidebarCss.css';

const Sidebar = () => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside>
      <div className="description">Widget Library</div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'Message')} draggable>
        <div>
          <ChatBubbleIcon fontSize="medium" className="icon" /><span>Send Message</span>
        </div>
        <div className="sub-txt">
          <p>Send a message.</p>
        </div>
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'Options')} draggable>
        <div>
          <ListIcon fontSize="medium" className="icon" /><span>Select Messages</span>
        </div>
        <div className="sub-txt">
          <p>Select a list of options.</p>
        </div>
      </div>
      <div className="dndnode api" onDragStart={(event) => onDragStart(event, 'Api Caller')} draggable>
        <div>
          <ApiIcon fontSize="medium" className="icon" /><span>Request an API</span>
        </div>
        <div className="sub-txt">
          <p>Perform an API request.</p>
        </div>
      </div>
      <div className="dndnode form-node" onDragStart={(event) => onDragStart(event, 'Create Form')} draggable>
        <div>
          <DynamicFormIcon fontSize="medium" className="icon" /><span>Create Form</span>
        </div>
        <div className="sub-txt">
          <p>Create an input form.</p>
        </div>
      </div>
      <div className="dndnode output" onDragStart={(event) => onDragStart(event, 'End Of Flow')} draggable>
        <div>
          <PauseIcon fontSize="medium" className="icon" /><span>End Of Flow</span>
        </div>
        <div className="sub-txt">
          <p>End the current flow.</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
