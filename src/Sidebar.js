import React from 'react';
import AddCommentIcon from '@mui/icons-material/AddComment';

export default () => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside>
      <div className="description">Widget Library.</div>
      <div className="dndnode input" onDragStart={(event) => onDragStart(event, 'Extra Data')} draggable>
        <AddCommentIcon fontSize="large" className='pr-2'/>  Extra Data Node
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'Default')} draggable>
        <AddCommentIcon fontSize="large" className='pr-2'/> Default Data Node
      </div>
      <div className="dndnode output" onDragStart={(event) => onDragStart(event, 'End Of Flow')} draggable>
        <AddCommentIcon fontSize="large" className='pr-2'/> End Of Flow Node
      </div>
    </aside>
  );
};
