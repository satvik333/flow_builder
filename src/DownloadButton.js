import React from 'react';
import { Panel } from 'reactflow';
import { toPng } from 'html-to-image';

function downloadImage(dataUrl) {
  const a = document.createElement('a');

  a.setAttribute('download', 'reactflow.png');
  a.setAttribute('href', dataUrl);
  a.click();
}

const imageWidth = 1920;
const imageHeight = 1080;

function DownloadButton() {
  const onClick = () => {
    const reactFlowWrapper = document.querySelector('.react-flow');
    
    const style = {
      width: imageWidth,
      height: imageHeight,
    };

    toPng(reactFlowWrapper, {
      backgroundColor: 'black',
      style,
    }).then(downloadImage);
  };

  return (
    <Panel position="top-right">
      <button className="download-btn" onClick={onClick}>
        Download Image
      </button>
    </Panel>
  );
}

export default DownloadButton;
