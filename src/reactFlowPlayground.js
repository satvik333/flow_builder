import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  useReactFlow,
  Background
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import AddCommentIcon from '@mui/icons-material/AddComment';
import Sidebar from './Sidebar';
import Modal from './modal';
import './react-flow.css';
import 'reactflow/dist/base.css';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import CustomNode from './CustomNode';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { convert } from 'html-to-text';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DownloadButton from './DownloadButton';


const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 172;
const nodeHeight = 36;

const nodeTypes = {
  custom: CustomNode,
};


let id = 0;
const getId = () => `dndnode_${id++}`;

const DnDFlow = () => {

    const initialNodes = [
      {
        id: '1',
        type: 'custom',
        data: { label: 'Trigger', icon: <PlayCircleIcon/>, id: '1', direction: 'TB', hasChild: false },
        position: { x: 0, y: 0 },
      },
    ];
  
    const reactFlowWrapper = useRef(null);
    const connectingNodeId = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [nodeData, setNodeData] = useState(null);
    const [editedMessage, setEditedMessage] = useState(null);
    const [isSettings, setIsSettings] = useState(false);
    const [flowKey, setFlowKey] = useState(() => {
      const today = Date.now();
      return `flow_${today}`;
    });
    const [actionName, setActionName] = useState('Action Name');
    const [actionType, setActionType] = useState('Action Type');
    const [dataLabel, setDataLabel] = useState(null);
    const [noOfNodes, setNoOfNodes] = useState(1);
    const [collapsedNodes, setCollapsedNodes] = useState({});

    const { screenToFlowPosition } = useReactFlow();
    const { setViewport } = useReactFlow();

  
    const onConnect = useCallback(
      (params) => setEdges((eds) => addEdge(params, eds)),
      [],
    );

    useEffect(() => {
      const handleClick = (event) => {
        const clickedElement = event.target;
        let attribute = clickedElement.getAttribute('data-testid');
    
        if (attribute === 'CancelIcon') {
          const nodeId = clickedElement.closest('.react-flow__node')?.dataset.id;
          if (nodeId) {
            removeNode(nodeId);
          }
        } else if (attribute === 'KeyboardArrowDownIcon') {
          const nodeId = clickedElement.closest('.react-flow__node')?.dataset.id;
    
          // Update the node to set collapsed to true
          setNodes((prevNodes) => prevNodes.map((node) => 
            node.id === nodeId ? { ...node, data: { ...node.data, collapsed: true } } : node
          ));
    
          const descendantNodes = getDescendantNodes(nodeId);
          setCollapsedNodes((prev) => ({
            ...prev,
            [nodeId]: descendantNodes,
          }));
          setNodes((prevNodes) =>
            prevNodes.filter((node) => !descendantNodes.some((dNode) => dNode.id === node.id))
          );
        } else if (attribute === 'KeyboardArrowUpIcon') {
          // Revert the nodes back
          const nodeId = clickedElement.closest('.react-flow__node')?.dataset.id;
    
          // Update the node to set collapsed to false
          setNodes((prevNodes) => [
            ...prevNodes,
            ...collapsedNodes[nodeId],
          ].map((node) => 
            node.id === nodeId ? { ...node, data: { ...node.data, collapsed: false } } : node
          ));
    
          const updatedCollapsedNodes = { ...collapsedNodes };
          delete updatedCollapsedNodes[nodeId];
          setCollapsedNodes(updatedCollapsedNodes);
        }
      };
 
      document.addEventListener('click', handleClick);
      return () => {
        document.removeEventListener('click', handleClick);
      };
    }, [nodes, collapsedNodes, setNodes, setCollapsedNodes]);    

    const getDescendantNodes = (nodeId) => {
      const visited = new Set();
      const queue = [nodeId];
      const descendants = [];
  
      while (queue.length) {
        const currentNodeId = queue.shift();
        if (!visited.has(currentNodeId)) {
          visited.add(currentNodeId);
          const children = edges
            .filter((edge) => edge.source === currentNodeId)
            .map((edge) => edge.target);
  
          queue.push(...children);
          const currentNode = nodes.find((node) => node.id === currentNodeId);
          if (currentNode) {
            descendants.push(currentNode);
          }
        }
      }
      descendants.shift();

      return descendants;
    };

    const onLayout = useCallback(
      (direction) => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
          nodes,
          edges,
          direction
        );
        let modifiedNodes = layoutedNodes.map((node) => {
          return { ...node, data: { ...node.data, direction } };
        });
        setNodes([...modifiedNodes]);
        setEdges([...layoutedEdges]);
      },
      [nodes, edges]
    );

    const getLayoutedElements = (nodes, edges, direction = 'TB') => {
      const isHorizontal = direction === 'LR';
      const nodeWidth = 172;
      const nodeHeight = 36;
    
      const dagreGraph = new dagre.graphlib.Graph();
      dagreGraph.setDefaultEdgeLabel(() => ({}));
      dagreGraph.setGraph({
        rankdir: direction,
        nodesep: 100,  
        ranksep: 150, 
      });
    
      nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
      });
    
      edges?.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
      });
    
      dagre.layout(dagreGraph);
    
      nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = isHorizontal ? 'left' : 'top';
        node.sourcePosition = isHorizontal ? 'right' : 'bottom';
        node.position = {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        };
    
        return node;
      });
    
      return { nodes, edges };
    };

    const removeNode = (idToRemove) => {
      setNodeData(null);
    
      const sourceNodeId = edges
        .filter(edge => edge.target === idToRemove)
        .map(edge => edge.source)[0]; // Assuming there's only one source node for the given target
    
      const descendantNodes = sourceNodeId ? getDescendantNodes(sourceNodeId) : [];
    
      setNodes((prevNodes) => {
        const filteredNodes = prevNodes.filter(node => node.id !== idToRemove);

        if (sourceNodeId && (descendantNodes.length === 0 || descendantNodes.length === 1)) {
          return filteredNodes.map(node =>
            node.id === sourceNodeId ? { ...node, data: { ...node.data, hasChild: false } } : node
          );
        }
    
        return filteredNodes;
      });
    };
 
    const onDragOver = useCallback((event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    }, []);

    const onConnectStart = useCallback((_, { nodeId }) => {
      connectingNodeId.current = nodeId;
      setNoOfNodes(1)
    }, []);
  
    const onDrop = useCallback(
      (event) => {

        event.preventDefault();
  
        const type = event.dataTransfer.getData('application/reactflow');
  
        if (typeof type === 'undefined' || !type) {
          return;
        }
  
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        const newNode = {
          id: getId(),
          position,
          data: { label: `${type} node`, id: getId(), icon: <AddCommentIcon/>, actionName: actionName, actionType: actionType, message: 'Text', noOfNodes: noOfNodes, hasChild: false },
          type: 'custom',
        };
  
        setNodes((nds) => nds.concat(newNode));
      },
      [reactFlowInstance],
    );

    const onConnectEnd = useCallback(
      (event) => {
        let cntr = 0;
        for(let i = 0; i < noOfNodes; i++) {
    
          //if (!connectingNodeId.current) return;
    
          const targetIsPane = event.target.classList.contains('react-flow__pane');
    
          const sourceNode = nodes.find(node => node.id === connectingNodeId.current);
    
          setNodes((prevNodes) => prevNodes.map((node) => 
            node.id === sourceNode.id ? { ...node, data: { ...node.data, hasChild: true } } : node
          ));
    
          const sourcePosition = sourceNode.position;
    
          if (targetIsPane) {
            const targetNodeId = getId(); 
            let targetPosition;
    
            if (nodeData?.data?.label === 'Options node') {
              targetPosition = screenToFlowPosition({
                x: sourcePosition.x + cntr,
                y: sourcePosition.y + 250 + cntr,
              });
            } else {
    
              const { top, left } = reactFlowWrapper.current.getBoundingClientRect();
              
              if (reactFlowInstance) {
                targetPosition = reactFlowInstance.project({
                  x: event.clientX - left,
                  y: event.clientY - top,
                });
              } else {
                console.error('reactFlowInstance is null');
                return;
              }
            }
    
            const newNode = {
              id: targetNodeId,
              position: targetPosition,
              data: { label: `Node ${targetNodeId}`, icon: <AddCommentIcon/>, id: targetNodeId, actionName: actionName, actionType: actionType, message: 'Text', noOfNodes: noOfNodes, hasChild: false },
              origin: [0.5, 0.0],
              type: 'custom'
            };
    
            setNodes((prevNodes) => [...prevNodes, newNode]);
    
            const sourceNode = nodes.find(node => node.id === connectingNodeId.current);
    
            if (sourceNode) {
              setEdges((prevEdges) => [...prevEdges, { id: getId(), source: sourceNode.id, target: targetNodeId }]);
            }
          }
          cntr += 100;
        }
      },
      [screenToFlowPosition, nodes, actionName, actionType, noOfNodes, reactFlowInstance]
    );       


    const onSave = useCallback(() => {
      if (reactFlowInstance) {
        let flow = reactFlowInstance.toObject();
        flow.flowName = flowKey;
        console.log(flow.nodes,'ffffffffffffffff',flow.edges)
        //localStorage.setItem(flowKey, JSON.stringify(flow));
      }
    }, [reactFlowInstance]);     

    function onClear() {
      setNodes(initialNodes);
      setNodeData(null);
    }

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      // initialEdges
    );


    const getNodeId = () => `randomnode_${+new Date()}`;

    const onElementClick = useCallback((element) => {
      if (element.nodes.length > 0) {
        setNodeData(element.nodes[0]);
        setEditedMessage(element.nodes[0].data.message);
      }
      const nodeId = element.nodes[0]?.data.id;
      const lastNumber = nodeId?.match(/\d+$/)[0];
      const previousNodeId = `dndnode_${parseInt(lastNumber) - 1}`;
      let nodeElement = document.querySelector(`[data-id="${previousNodeId}"] .shadow-md.rounded-md.bg-white.border-2.border-stone-400.relative`);

      if (!nodeElement) {
       nodeElement = document.querySelector(`[data-id="${nodeId}"] .shadow-md.rounded-md.bg-white.border-2.border-stone-400.relative`);
      }

      if (nodeElement) {
        nodeElement.style.borderColor = "blue";
      }
      setActionName('Action Name');
      setActionType('Action Type')
  }, []);

  useEffect(() => {
    nodes.forEach(node => {
      if (node?.id !== nodeData?.id){
        const lastNumber = node?.id?.match(/\d+$/)[0];
        const previousNodeId = `dndnode_${parseInt(lastNumber)}`;
        const nodeElement = document.querySelector(`[data-id="${previousNodeId}"] .shadow-md.rounded-md.bg-white.border-2.border-stone-400.relative`);
        if (nodeElement) {
          nodeElement.style.borderColor = "";
        }
      }
    })
  }, [nodeData])

  const onInputChange = (data) => {
    setDataLabel(data)
  };

  function onUpdate() {
    const plainText = convert(dataLabel, {
      wordwrap: 130
    });
    setEditedMessage(plainText);
  }

  useEffect(() => {
    if (nodeData) {
      const clickedNodeId = nodeData.id;
      setNodes((prevNodes) => {
        const updatedNodes = prevNodes.map((node) => {
          if (node.id === clickedNodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                message: editedMessage,
                noOfNodes: noOfNodes
                // messages: messages
              },
            };
          }
          return node;
        });
        return updatedNodes;
      });
    }
  }, [editedMessage, nodeData, noOfNodes]);  

  function resetNodeData() {
    const lastNumber = nodeData?.id?.match(/\d+$/)[0];
    const previousNodeId = `dndnode_${parseInt(lastNumber)}`;
    const nodeElement = document.querySelector(`[data-id="${previousNodeId}"] .shadow-md.rounded-md.bg-white.border-2.border-stone-400.relative`);
    if (nodeElement) {
      nodeElement.style.borderColor = "";
    }
    setNodeData(null);
    setEditedMessage(null);
    // setMessages([]);
  }

  const onFlowChange = (event) => {
    setFlowKey(event.target.value);
  };

  function enableSettings() {
    setIsSettings(val => !val)
  }

  function onActionNameChange(event) {
    setActionName(event.target.value);
  }

  function onActionTypeChange(event) {
    setActionType(event.target.value);
  }

  function onNoOfNodeChange(event) {
    setNoOfNodes(Number(event.target.value));
  }

  const handleIconClick = (event) => {
    connectingNodeId.current = nodeData.id;
    onConnectEnd({
      ...event,
      target: { classList: { contains: () => true } }
    });
  };

  
    return (
      <div className="dndflow" style={{ width: '100%', height: '100vh' }}>
        <ReactFlowProvider>
          <div className="reactflow-wrapper" ref={reactFlowWrapper} style={{ width: '100%', height: '100%' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onConnectStart={onConnectStart}
              onConnectEnd={onConnectEnd}
              fitView
              fitViewOptions={{ padding: 5 }}
              nodeOrigin={[0.5, 0]}
              style={{ width: '100%', height: '100%' }}
              onSelectionChange={onElementClick}
              nodeTypes={nodeTypes}
              proOptions={{ hideAttribution: true }} 
              snapToGrid={true}
            >
              <DownloadButton />
              <Background />
              <Controls showInteractive={false} />
              <svg>
                <defs>
                  <linearGradient id="edge-gradient">
                    <stop offset="0%" stopColor="#ae53ba" />
                    <stop offset="100%" stopColor="#2a8af6" />
                  </linearGradient>
            
                  <marker
                    id="edge-circle"
                    viewBox="-5 -5 10 10"
                    refX="0"
                    refY="0"
                    markerUnits="strokeWidth"
                    markerWidth="10"
                    markerHeight="10"
                    orient="auto"
                  >
                    <circle stroke="#2a8af6" strokeOpacity="0.75" r="2" cx="0" cy="0" />
                  </marker>
                </defs>
              </svg>
            </ReactFlow>
          </div>
          <div className='flow-sec'>
            {nodeData && nodeData.data.label !== 'Trigger' ? (
              <aside>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <ArrowBackIcon fontSize="large" style={{marginTop: "10px", cursor: 'pointer', color: 'whitesmoke'}} onClick={resetNodeData}/>
                  <h1 className='ml-4 mt-2 font-bold' style={{fontSize: '25px'}}>Properties</h1>
                </div>
                <h1 className='font-bold mt-4 flex items-start' style={{fontSize: '15px'}}>Action Name:</h1>
                <input 
                  style={{ textAlign: 'left', paddingLeft: '1rem' }}
                  className='input-field w-full mt-2 mb-6 px-20 py-3 border rounded-md border-gray-300 focus:outline-none focus:border-indigo-500 text-lg'
                  type="text"
                  value={actionName}
                  onChange={onActionNameChange}
                />
                <h1 className='font-bold mt-2 flex items-start' style={{fontSize: '15px'}}>Action Type:</h1>
                <input 
                  style={{ textAlign: 'left', paddingLeft: '1rem' }}
                  className='input-field w-full mt-2 mb-6 px-20 py-3 border rounded-md border-gray-300 focus:outline-none focus:border-indigo-500 text-lg'
                  type="text"
                  value={actionType}
                  onChange={onActionTypeChange}
                />
                { nodeData.data.label !== 'End Of Flow node' &&
                  <>
                    <h1 className='font-bold mb-1 flex items-start' style={{fontSize: '15px'}}>Message Body:</h1>
                    <div style={{ height: '500px', width: '100%', fontSize: '18px' }}>
                      <div className='ckeditor-dark-mode'>
                        <CKEditor
                          editor={ClassicEditor}
                          data={editedMessage}
                          onChange={(event, editor) => {
                          const data = editor.getData();
                            onInputChange(data);
                          }}
                          config={{
                            toolbar: ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote'],
                            fontSize: {
                              options: [
                                'tiny',
                                'small',
                                'default',
                                'big',
                                'huge'
                              ]
                            }
                          }}
                        />
                      </div>
                      <button className="px-10 mt-2 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600" onClick={onUpdate}>Update</button>
                      { nodeData.data.label === 'Options node' &&
                        <>
                          <h1 className='font-bold mt-6 flex items-start' style={{ fontSize: '15px' }}>Enter the Number of Nodes:</h1>
                          <div className="flex items-center mt-2 mb-6">
                            <input 
                              style={{ textAlign: 'left', paddingLeft: '1rem', width: "100%"}}
                              className='input-field py-3 border rounded-md border-gray-300 focus:outline-none focus:border-indigo-500 text-lg'
                              type="text"
                              value={noOfNodes}
                              onChange={onNoOfNodeChange}
                            />
                            <ArrowForwardIcon fontSize="large" className="ml-2" onClick={handleIconClick}/>
                          </div>
                        </>
                      }
                    </div>
                  </>
                }
              </aside>
            )  : 
            <>
              <SettingsSuggestIcon fontSize="large" className="settings mt-2 mb-2" onClick={enableSettings}/>
              {isSettings && 
                <Modal isOpen={isSettings} onClose={() => setIsSettings(false)}>
                  <div className="pl-1 pr-2 flex justify-between mb-4">
                    <button style={{width: '205px'}} className="py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600" onClick={() => onLayout('TB')}>Vertical Layout</button>
                    <button style={{width: '195px'}} className="ml-2 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600" onClick={() => onLayout('LR')}>Horizontal Layout</button>
                  </div>
                  {/* <div className="pl-1 pr-2 flex justify-between mb-4">
                    <button style={{width: '51%'}} className="py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600" onClick={() => setIsDarkMode(true)}>Dark Mode</button>
                    <button style={{width: '48%'}} className="ml-2 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600" onClick={() => setIsDarkMode(false)}>Light Mode</button>
                  </div> */}
                </Modal>
              }
              <Sidebar/>
            </>
            }
            <div>
              <h1 style={{marginTop: '20%'}} className='pl-2 flex items-start font-bold text-lg'>Flow Title:</h1>
              <input 
                style={{ textAlign: 'left', paddingLeft: '1rem', width: '95%' }}
                className='pl-2 input-field mt-2 mb-6 py-3 border rounded-md border-gray-300 focus:outline-none focus:border-indigo-500 text-lg'
                type="text"
                value={flowKey}
                onChange={onFlowChange}
              />
              <div className="pl-10 pr-10 flex justify-between mt-2 mb-2">
                <button className="px-10 py-2 bg-red-500 text-white rounded-md hover:bg-red-600" onClick={onClear}>CLEAR</button>
                <button className="px-10 py-2 bg-green-500 text-white rounded-md hover:bg-green-600" onClick={onSave}>SAVE</button>
              </div>
            </div>
          </div>
        </ReactFlowProvider>
      </div>
    );
  };  

export default DnDFlow;
