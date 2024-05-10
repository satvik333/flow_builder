import React from 'react';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';

export default () => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside>
      <div className="description">You can drag these nodes to the pane on the left.</div>
      <div className="dndnode input" onDragStart={(event) => onDragStart(event, 'Extra Data')} draggable>
        Extra Data Node
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'Default')} draggable>
        Default Node
      </div>
      <div className="dndnode output" onDragStart={(event) => onDragStart(event, 'End Of Flow')} draggable>
        End Of Flow Node
      </div>
    </aside>
  );
};
