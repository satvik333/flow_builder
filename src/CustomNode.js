import React, { memo, useMemo } from 'react';
import { Handle, Position } from 'reactflow';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';

function CustomNode({ data }) {
  // console.log(data, 'datatatata');

  const calculateWidth = () => {
    let baseWidth = 280; 
    if (data.label === 'Create Form node') {
      baseWidth = 400; 
    }
    return baseWidth;
  };

  const dynamicWidth = useMemo(() => calculateWidth(), [data.label]);

  const truncatedMessage = data?.message?.length > 23
    ? `${data.message.slice(0, 23)}...`
    : data.message;

  return (
    <div style={{ width: `${dynamicWidth}px` }} className="flex items-center wrapper gradient relative">
      <div className="flex items-center bg-black inner body shadow-md rounded-md border-2 border-stone-400 relative">
        <div className="flex items-center">
          <div
            style={{ color: '#7B3F00' }}
            className="rounded-full mr-1 flex justify-center items-center"
          >
            {data?.icon}
          </div>
          <div>
            <div style={{ fontSize: '14px' }}>{data?.label}</div>
          </div>
          {data.label !== 'Trigger' && (
            <div className="absolute pr-3 right-0 p-1" data-testid="CancelIcon" style={{ cursor: 'pointer' }}>
              <CancelIcon
                fontSize="large"
                className="pb-2"
                style={{ color: '#f56565' }}
                data-testid="CancelIcon"
              />
            </div>
          )}
        </div>
        {(data.label === 'Message node' ||
          data.label === 'Options node' ||
          data.label === 'Api Caller node' ||
          /^Node dndnode_\d+$/.test(data.label)) && (
          <>
            <hr className="mt-2" style={{ width: '110%' }} />
            <div className="mt-2">
              <div
                className="text-sm flex rounded-md pt-1 justify-center items-center border-2 border-stone-400 p-1"
                style={{ fontSize: '12px', width: '195px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
              >
                {truncatedMessage}
              </div>
            </div>
          </>
        )}
        {
          data.label === 'Create Form node' &&
          <>
            <hr className="mt-2 mb-2" style={{ width: '110%' }} />
            <ol>
              {data?.formFields?.map((field, index) => (
                <div key={index}>
                  {field.value.length > 0 && <li className='flex flex-start'>{index + 1} {field.value} {field.required === true ? "(Required)" : "(Not Required)"}</li>}
                </div>
              ))}
            </ol>
          </>
        }
        {data.label === 'Options node' && data.hasChild && (
          <div className="absolute bottom-0 right-0 mb-4 pl-4">
            {!data.collapsed && (
              <ArrowDropDownIcon
                fontSize="large"
                style={{ cursor: 'pointer' }}
                data-testid="KeyboardArrowDownIcon"
              />
            )}
            {data.collapsed && (
              <ArrowDropUpIcon
                fontSize="large"
                style={{ cursor: 'pointer' }}
                data-testid="KeyboardArrowUpIcon"
              />
            )}
          </div>
        )}
      </div>
      {data.direction === 'LR' && !data.label.includes('Trigger') && (
        <Handle
          type="target"
          position={Position.Left}
          className="custom-handle"
        />
      )}
      {data.direction !== 'LR' && !data.label.includes('Trigger') && (
        <Handle
          type="target"
          position={Position.Top}
          className="custom-handle"
          style={{ top: -4, left: '50%', transform: 'translateX(-50%)' }}
        />
      )}
      {data.direction === 'LR' && !data.label.includes('End Of Flow node') && (
        <Handle
          type="source"
          position={Position.Right}
          className="custom-handle"
        />
      )}
      {data.direction !== 'LR' && !data.label.includes('End Of Flow node') && (
        <Handle
          type="source"
          className="custom-handle"
          position={Position.Bottom}
          style={{
            marginBottom: '5px',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />
      )}
    </div>
  );
}

export default memo(CustomNode);
