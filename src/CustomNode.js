import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import CancelIcon from '@mui/icons-material/Cancel';

function CustomNode({ data }) {
  console.log(data,'dddddddddd')

  const cancelNode = () => {
  };
  
  return (
    <div className="relative">
      <div className="px-2 py-1 shadow-md rounded-md bg-white border-2 border-stone-400 relative">
        <div className="flex items-center">
          <div style={{color: "green"}} className="rounded-full w-8 h-8 flex justify-center items-center bg-gray-100">
            {data?.icon}
          </div>
          <div className="ml-1">
            <div className="text-sm">{data?.label}</div>
          </div>
          <div>
            <CancelIcon onClick={() => cancelNode(data.id)} fontSize="medium" className='pb-3' style={{color: 'red'}}/>
          </div>
        </div>
      </div>
      {!data.label.includes('Trigger') && <Handle type="target" position={Position.Top} style={{ top: -4, left: '50%', transform: 'translateX(-50%)' }} />}
      <Handle type="source" position={Position.Bottom} style={{ bottom: -4, left: '50%', transform: 'translateX(-50%)' }} />
    </div>
  );
}

export default memo(CustomNode);
