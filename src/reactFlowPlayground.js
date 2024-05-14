import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  useReactFlow,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import AddCommentIcon from '@mui/icons-material/AddComment';

import Sidebar from './Sidebar';

import './react-flow.css';
import 'reactflow/dist/base.css';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import CustomNode from './CustomNode';


const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 172;
const nodeHeight = 36;

const nodeTypes = {
  custom: CustomNode,
};

const initialNodes = [
  {
    id: '1',
    type: 'custom',
    data: { label: 'Trigger', icon: <PlayCircleIcon/>, id: '1', direction: 'TB' },
    position: { x: 0, y: 0 },
  },
];

let id = 0;
const getId = () => `dndnode_${id++}`;

const DnDFlow = () => {
    const reactFlowWrapper = useRef(null);
    const connectingNodeId = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [nodeData, setNodeData] = useState(null);
    const [editedLabel, setEditedLabel] = useState(null);
    const [flowKey, setFlowKey] = useState('example-flow');

    const { screenToFlowPosition } = useReactFlow();
    const { setViewport } = useReactFlow();

  
    const onConnect = useCallback(
      (params) => setEdges((eds) => addEdge(params, eds)),
      [],
    );
  
    const onDragOver = useCallback((event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    }, []);

    const onConnectStart = useCallback((_, { nodeId }) => {
      connectingNodeId.current = nodeId;
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
          data: { label: `${type} node`, id: getId(), icon: <AddCommentIcon/> },
          type: 'custom',
        };
  
        setNodes((nds) => nds.concat(newNode));
      },
      [reactFlowInstance],
    );

    const onConnectEnd = useCallback(
      (event) => {
        if (!connectingNodeId.current) return;
  
        const targetIsPane = event.target.classList.contains('react-flow__pane');
  
        if (targetIsPane) {
          const id = getId();
        console.log('11111111111111',event)

          const newNode = {
            id,
            position: screenToFlowPosition({
              x: event.clientX - 550,
              y: event.clientY - 550,
            }),
            data: { label: `Node ${id}`, icon: <AddCommentIcon/>, id: id},
            origin: [0.5, 0.0],
            type: 'custom'
          };
          setNodes((nds) => nds.concat(newNode));
          setEdges((eds) =>
            eds.concat({ id, source: connectingNodeId.current, target: id }),
          );
        }
      },
      [screenToFlowPosition],
    );

    const getLayoutedElements = (nodes, edges, direction = 'TB') => {
      const isHorizontal = direction === 'LR';
      dagreGraph.setGraph({ rankdir: direction });
    
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
          x: nodeWithPosition.x,
          y: nodeWithPosition.y,
        };
       
        return node;
      });
    
      return { nodes, edges };
    };

    const onSave = useCallback(() => {
      if (reactFlowInstance) {
        let flow = reactFlowInstance.toObject();
        flow.flowName = flowKey;
        console.log(flow,'fffffffffffffffffffff')
        localStorage.setItem(flowKey, JSON.stringify(flow));
      }
    }, [reactFlowInstance]);

    function onClear() {
      setNodes(initialNodes);
    }

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      // initialEdges
    );

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
        console.log(modifiedNodes,'eeeeeee')
        setNodes([...modifiedNodes]);
        setEdges([...layoutedEdges]);
      },
      [nodes, edges]
    );

    const getNodeId = () => `randomnode_${+new Date()}`;

    const onElementClick = useCallback((element) => {
      if (element.nodes.length > 0) {
        setNodeData(element.nodes[0]);
        setEditedLabel(element.nodes[0].data.label);
      }
      const nodeElement = document.querySelector(`[data-id="${element.nodes[0]?.id}"] .px-6.py-2.shadow-md.rounded-md.bg-white.border-2.border-stone-400.relative`);
      if (nodeElement) {
        nodeElement.style.borderColor = "blue";
      }
  }, []);

  useEffect(() => {
    nodes.forEach(node => {
      if (node?.id !== nodeData?.id){
        const nodeElement = document.querySelector(`[data-id="${node?.id}"] .px-6.py-2.shadow-md.rounded-md.bg-white.border-2.border-stone-400.relative`);
        if (nodeElement) {
          nodeElement.style.borderColor = "";
        }
      }
    })
  }, [nodeData])

  const onInputChange = (event) => {
    setEditedLabel(event.target.value);
  };

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
                label: editedLabel,
              },
            };
          }
          return node;
        });
        return updatedNodes;
      });
    }
  }, [editedLabel, nodeData]);  

  function resetNodeData() {
    const nodeElement = document.querySelector(`[data-id="${nodeData.id}"] .px-6.py-2.shadow-md.rounded-md.bg-white.border-2.border-stone-400.relative`);
    if (nodeElement) {
      nodeElement.style.borderColor = "";
    }
    setNodeData(null);
    setEditedLabel(null);
  }

  const onFlowChange = (event) => {
    setFlowKey(event.target.value);
  };

  const removeNode = (idToRemove) => {
    setNodes((prevNodes) => prevNodes.filter(node => node.id !== idToRemove));
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
            >
              <Controls />
            </ReactFlow>
          </div>
          <div>
            {nodeData ? (
              <aside>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <ArrowBackIcon color="action" fontSize="large" style={{marginTop: "10px", cursor: 'pointer'}} onClick={resetNodeData}/>
                  <h1 className='ml-4 mt-2 font-bold' style={{fontSize: '25px'}}>Properties</h1>
                </div>
                <input 
                  className='mt-6 px-5 py-3 border rounded-md border-gray-300 focus:outline-none focus:border-indigo-500 font-bold text-lg'
                  type="text"
                  value={editedLabel}
                  onChange={onInputChange}
                />
              </aside>
            )  : <Sidebar/>}
            <h1 className='font-bold text-lg'>Flow Title:</h1>
            <input 
              className='mt-2 mb-6 px-8 py-3 border rounded-md border-gray-300 focus:outline-none focus:border-indigo-500 font-bold text-lg'
              type="text"
              value={flowKey}
              onChange={onFlowChange}
            />
           <div className="pl-1 pr-2 flex justify-between">
              <button className="px-10 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600" onClick={() => onLayout('TB')}>Vertical Layout</button>
              <button className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600" onClick={() => onLayout('LR')}>Horizontal Layout</button>
            </div>
            <div className="pl-10 pr-10 flex justify-between mt-4">
              <button className="px-10 py-2 bg-red-500 text-white rounded-md hover:bg-red-600" onClick={onClear}>CLEAR</button>
              <button className="px-10 py-2 bg-green-500 text-white rounded-md hover:bg-green-600" onClick={onSave}>SAVE</button>
            </div>
          </div>
        </ReactFlowProvider>
      </div>
    );
  };  

export default DnDFlow;
