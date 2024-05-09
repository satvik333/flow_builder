import React, { useState, useRef, useCallback } from 'react';
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

import Sidebar from './Sidebar';

import './react-flow.css';
import 'reactflow/dist/base.css';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';


const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 172;
const nodeHeight = 36;

const initialNodes = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Trigger', icon: <AccessTimeFilledIcon/> },
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

    const { screenToFlowPosition } = useReactFlow();
    const { setViewport } = useReactFlow();

    const flowKey = 'example-flow';
  
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
          type,
          position,
          data: { label: `${type} node` },
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
          const newNode = {
            id,
            position: screenToFlowPosition({
              x: event.clientX,
              y: event.clientY,
            }),
            data: { label: `Node ${id}` },
            origin: [0.5, 0.0],
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
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        };
    
        return node;
      });
    
      return { nodes, edges };
    };

    const onSave = useCallback(() => {
      if (reactFlowInstance) {
        const flow = reactFlowInstance.toObject();
        console.log(flow,'fffffffffffffffffffff')
        localStorage.setItem(flowKey, JSON.stringify(flow));
      }
    }, [reactFlowInstance]);

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
  
        setNodes([...layoutedNodes]);
        setEdges([...layoutedEdges]);
      },
      [nodes, edges]
    );

    const getNodeId = () => `randomnode_${+new Date()}`;

    const onAdd = useCallback(() => {
      const newNode = {
        id: getNodeId(),
        data: { label: 'Added node' },
        position: {
          x: Math.random() * window.innerWidth - 100,
          y: Math.random() * window.innerHeight,
        },
      };
      setNodes((nds) => nds.concat(newNode));
    }, [setNodes]);

    const onElementClick = useCallback((element) => {
      if (element.nodes.length > 0) {
        console.log("Clicked element:", element.nodes);
        const clickedNodeId = element.nodes[0].id;
    setNodes((prevNodes) => {
      const updatedNodes = prevNodes.map((node) => {
        if (node.id === clickedNodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              label: 'testtttttt', 
            },
          };
        }
        return node;
      });
      return updatedNodes;
    });
      }
  }, []);
  
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
              fitViewOptions={{ padding: 2 }}
              nodeOrigin={[0.5, 0]}
              style={{ width: '100%', height: '100%' }}
              onSelectionChange={onElementClick}
            >
              <Controls />
              <Panel position="top-right">
                <button onClick={onSave}>save</button>
                <button onClick={onAdd}>add node</button>
                <button onClick={() => onLayout('TB')}>vertical layout</button>
                <button onClick={() => onLayout('LR')}>horizontal layout</button>
              </Panel>
            </ReactFlow>
          </div>
          <Sidebar />
        </ReactFlowProvider>
      </div>
    );
  };  

export default DnDFlow;
