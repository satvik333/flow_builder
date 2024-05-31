import React, { useState, useRef, useCallback, useEffect } from "react";
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  useReactFlow,
  Background,
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import AddCommentIcon from "@mui/icons-material/AddComment";
import Sidebar from "./Sidebar";
import Modal from "./modal";
import "./react-flow.css";
import "reactflow/dist/base.css";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import CustomNode from "./CustomNode";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { convert } from "html-to-text";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DownloadButton from "./DownloadButton";
import {
  saveFlow,
  getFlowsByClient,
  updateFlow,
  getAllApis,
} from "./services/flowService";

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 172;
const nodeHeight = 36;

const nodeTypes = {
  custom: CustomNode,
};

let id = 0;
const getId = () => `dndnode_${Date.now()}`;

const DnDFlow = () => {
  const initialNodes = [
    {
      id: "1",
      type: "custom",
      data: {
        label: "Trigger",
        icon: <PlayCircleIcon />,
        id: "1",
        direction: "TB",
        hasChild: false,
      },
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
  const [actionName, setActionName] = useState("Action Name");
  const [actionType, setActionType] = useState("Action Type");
  const [dataLabel, setDataLabel] = useState(null);
  const [noOfNodes, setNoOfNodes] = useState(1);
  const [collapsedNodes, setCollapsedNodes] = useState({});
  const [allFlows, setAllFlows] = useState([{ flow_name: 'none' }]);
  const [selectedOption, setSelectedOption] = useState("");
  const [selectedApi, setSelectedApi] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [allApis, setAllApis] = useState(null);
  const [currentFlow, setCurrentFlow] = useState(null);
  const [selectedRadioOption, setSelectedRadioOption] = useState('');

  const { screenToFlowPosition } = useReactFlow();
  const { setViewport } = useReactFlow();

  const onConnect = useCallback(
    (params) => {
      const sourceNode = nodes.find(
        (node) => node.id === connectingNodeId.current
      );
      if (!sourceNode) {
        return;
      }

      if (
        sourceNode.data.label !== "Options node" &&
        sourceNode.data.hasChild === true
      )
        return;

      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === sourceNode.id
            ? { ...node, data: { ...node.data, hasChild: true } }
            : node
        )
      );

      setEdges((eds) => {
        const newEdges = addEdge(params, eds);
        return newEdges;
      });
    },
    [setEdges, nodes, connectingNodeId, setNodes]
  );

  useEffect(() => {
    const fetchFlows = async () => {
      let clientId = "1234";
      try {
        const flows = await getFlowsByClient(clientId);
        setAllFlows(prev => [...prev, ...flows.result]);
      } catch (error) {
        console.error("Error fetching flows:", error);
      }
    };

    fetchFlows();
  }, []);

  useEffect(() => {
    const handleClick = (event) => {
      const clickedElement = event.target;
      let attribute = clickedElement.getAttribute("data-testid");

      if (attribute === "CancelIcon") {
        const nodeId = clickedElement.closest(".react-flow__node")?.dataset.id;
        if (nodeId) {
          removeNode(nodeId);
        }
      } else if (attribute === "KeyboardArrowDownIcon") {
        const nodeId = clickedElement.closest(".react-flow__node")?.dataset.id;

        setNodes((prevNodes) =>
          prevNodes.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, collapsed: true } }
              : node
          )
        );

        const descendantNodes = getDescendantNodes(nodeId);
        setCollapsedNodes((prev) => ({
          ...prev,
          [nodeId]: descendantNodes,
        }));
        setNodes((prevNodes) =>
          prevNodes.filter(
            (node) => !descendantNodes.some((dNode) => dNode.id === node.id)
          )
        );
      } else if (attribute === "KeyboardArrowUpIcon") {
        const nodeId = clickedElement.closest(".react-flow__node")?.dataset.id;

        setNodes((prevNodes) =>
          [...prevNodes, ...collapsedNodes[nodeId]].map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, collapsed: false } }
              : node
          )
        );

        const updatedCollapsedNodes = { ...collapsedNodes };
        delete updatedCollapsedNodes[nodeId];
        setCollapsedNodes(updatedCollapsedNodes);
      }
    };

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
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
          .filter((edge) => edge?.source === currentNodeId)
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
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(nodes, edges, direction);
      let modifiedNodes = layoutedNodes.map((node) => {
        return { ...node, data: { ...node.data, direction } };
      });
      setNodes([...modifiedNodes]);
      setEdges([...layoutedEdges]);
    },
    [nodes, edges]
  );

  const getLayoutedElements = (nodes, edges, direction = "TB") => {
    const isHorizontal = direction === "LR";
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
      node.targetPosition = isHorizontal ? "left" : "top";
      node.sourcePosition = isHorizontal ? "right" : "bottom";
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
      .filter((edge) => edge?.target === idToRemove)
      .map((edge) => edge?.source)[0]; 

    const descendantNodes = sourceNodeId
      ? getDescendantNodes(sourceNodeId)
      : [];

    setNodes((prevNodes) => {
      const filteredNodes = prevNodes.filter((node) => node.id !== idToRemove);

      if (
        sourceNodeId &&
        (descendantNodes.length === 0 || descendantNodes.length === 1)
      ) {
        return filteredNodes.map((node) =>
          node.id === sourceNodeId
            ? { ...node, data: { ...node.data, hasChild: false } }
            : node
        );
      }

      return filteredNodes;
    });
  };

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onConnectStart = useCallback((_, { nodeId }) => {
    connectingNodeId.current = nodeId;
    setNoOfNodes(1);
  }, []);

  const onDrop = useCallback(
    async (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");

      if (typeof type === "undefined" || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      let newNode = {
        id: getId(),
        position,
        data: {
          label: `${type} node`,
          id: getId(),
          icon: <AddCommentIcon />,
          actionName: actionName,
          actionType: actionType,
          message: "Text",
          noOfNodes: noOfNodes,
          hasChild: false,
        },
        type: "custom",
      };

      if (type === "Api Caller") {
        newNode.data.apiCaller = true;
        let apis = await getAllApis();
        setAllApis(apis.result);
      }

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance]
  );

  const onConnectEnd = useCallback(
    (event) => {
      let cntr = 0;
      let nodeIdCounter = 1;
      for (let i = 0; i < noOfNodes; i++) {
        //if (!connectingNodeId.current) return;

        const targetIsPane =
          event.target.classList.contains("react-flow__pane");

        const sourceNode = nodes.find(
          (node) => node.id === connectingNodeId.current
        );

        if (
          sourceNode.data.label !== "Options node" &&
          sourceNode.data.hasChild === true
        )
          return;

        setNodes((prevNodes) =>
          prevNodes.map((node) =>
            node.id === sourceNode.id
              ? { ...node, data: { ...node.data, hasChild: true } }
              : node
          )
        );

        const sourcePosition = sourceNode.position;

        if (targetIsPane) {
          let targetNodeId = getId() + nodeIdCounter++;
          let targetPosition;

          if (nodeData?.data?.label === "Options node") {
            targetPosition = screenToFlowPosition({
              x: sourcePosition.x + cntr,
              y: sourcePosition.y + 250 + cntr,
            });
          } else {
            const { top, left } =
              reactFlowWrapper.current.getBoundingClientRect();

            if (reactFlowInstance) {
              targetPosition = reactFlowInstance.project({
                x: event.clientX - left,
                y: event.clientY - top,
              });
            } else {
              console.error("reactFlowInstance is null");
              return;
            }
          }

          const newNode = {
            id: targetNodeId,
            position: targetPosition,
            data: {
              label: `Message node`,
              icon: <AddCommentIcon />,
              id: targetNodeId,
              actionName: actionName,
              actionType: actionType,
              message: "Text",
              noOfNodes: noOfNodes,
              hasChild: false,
            },
            origin: [0.5, 0.0],
            type: "custom",
          };

          setNodes((prevNodes) => [...prevNodes, newNode]);

          const sourceNode = nodes.find(
            (node) => node.id === connectingNodeId.current
          );

          if (sourceNode) {
            setEdges((prevEdges) => [
              ...prevEdges,
              {
                id: getId() + nodeIdCounter++,
                source: sourceNode.id,
                target: targetNodeId,
              },
            ]);
          }
        }
        cntr += 100;
      }
    },
    [
      screenToFlowPosition,
      nodes,
      actionName,
      actionType,
      noOfNodes,
      reactFlowInstance,
    ]
  );

  const onSave = useCallback(() => {
    if (reactFlowInstance) {
      let flow = reactFlowInstance.toObject();
      flow.flowName = flowKey;
      flow.clientId = "1234";

      //convertFlowToDecisionTreeFlow(flow);

      saveFlow(flow);
    }
    alert("Successfully Saved");
  }, [reactFlowInstance]);

  function convertFlowToDecisionTreeFlow(flowData) {
    let decisionTree = {};
    let nodes = flowData?.nodes;

    function getOptions(node) {
      let indexes = [];
      let ids = [];

      flowData?.edges.forEach((edge) => {
        if (node.id === edge.source) {
          ids.push(edge.target);
        }
      });

      indexes = ids
        .map((id) => {
          return nodes.findIndex((node) => node.id === id);
        })
        .filter((index) => index !== -1);

      return indexes.length === 0 ? null : indexes.join(",");
    }

    for (let i = 0; i < nodes?.length; i++) {
      if (i !== 0) {
        decisionTree[i] = {
          message: nodes[i].data.message,
          options:
            nodes[i].data.label === "Options node"
              ? getOptions(nodes[i])
              : null,
          answer:
            nodes[i].data.label != "Options node" ? getOptions(nodes[i]) : null,
          timeout: nodes[i].data.label === "Options node" ? "1" : null,
          action: actionType,
        };
      }
    }
    console.log(decisionTree, "ddddddddddd");
    // return decisionTree
  }

  const onUpdateFlow = useCallback(() => {
    if (reactFlowInstance) {
      let flow = reactFlowInstance.toObject();
      flow.flowName = flowKey;
      flow.clientId = "1234";
      flow.id = selectedId;

      //convertFlowToDecisionTreeFlow(flow);

      updateFlow(flow);
    }
    alert("Successfully Updated");
  }, [reactFlowInstance, selectedId]);

  function onClear() {
    setNodes(initialNodes);
    setNodeData(null);
  }

  const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
    initialNodes
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
    let nodeElement = document.querySelector(
      `[data-id="${previousNodeId}"] .shadow-md.rounded-md.bg-white.border-2.border-stone-400.relative`
    );

    if (!nodeElement) {
      nodeElement = document.querySelector(
        `[data-id="${nodeId}"] .shadow-md.rounded-md.bg-white.border-2.border-stone-400.relative`
      );
    }

    if (nodeElement) {
      nodeElement.style.borderColor = "blue";
    }

    setActionName(element.nodes[0]?.data.actionName || "Action Name");
    setActionType(element.nodes[0]?.data.actionType || "Action Type");
  }, []);

  useEffect(() => {
    nodes.forEach((node) => {
      if (node?.id !== nodeData?.id) {
        const lastNumber = node?.id?.match(/\d+$/)[0];
        const previousNodeId = `dndnode_${parseInt(lastNumber)}`;
        const nodeElement = document.querySelector(
          `[data-id="${previousNodeId}"] .shadow-md.rounded-md.bg-white.border-2.border-stone-400.relative`
        );
        if (nodeElement) {
          nodeElement.style.borderColor = "";
        }
      }
    });
  }, [nodeData]);

  const onInputChange = (data) => {
    setDataLabel(data);
  };

  function onUpdate() {
    const plainText = convert(dataLabel, {
      wordwrap: 130,
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
                noOfNodes: noOfNodes,
                actionName: actionName,
                actionType: actionType,
                selectedApi: selectedApi,
                optionType: selectedRadioOption
                // messages: messages
              },
            };
          }
          return node;
        });
        return updatedNodes;
      });
    }
  }, [editedMessage, nodeData, noOfNodes, actionName, actionType, selectedApi, selectedRadioOption]);

  function resetNodeData() {
    const lastNumber = nodeData?.id?.match(/\d+$/)[0];
    const previousNodeId = `dndnode_${parseInt(lastNumber)}`;
    const nodeElement = document.querySelector(
      `[data-id="${previousNodeId}"] .shadow-md.rounded-md.bg-white.border-2.border-stone-400.relative`
    );
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
    setIsSettings((val) => !val);
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
      target: { classList: { contains: () => true } },
    });
  };

  const handleChange = (event) => {
    const value = event.target.value;
    if (value === 'none') {
      setNodes(currentFlow.nodes);
      setSelectedOption('none');
      return;
    }

    setSelectedOption(value);
    setFlowKey(value);
    allFlows?.forEach((flow) => {
      if (flow.flow_name === value) {
        setSelectedId(flow.id);
        const data = JSON.parse(flow.flow_json);
        const nodes = data.nodes;
        let newEdges = data.edges;

        newEdges = newEdges.map((edge) => {
          if (edge.source !== '1') {
            return edge;
          }
        })

        const uniqueById = (items) => {
          const seen = new Set();
          return items.filter(item => {
            const duplicate = seen.has(item?.id);
            seen.add(item?.id);
            return !duplicate;
          });
        };

        let lastCurrentNode = currentFlow.nodes[currentFlow.nodes.length - 1];

        newEdges.push({source: lastCurrentNode.id, target: nodes[1].id, id: Date.now()});

        setNodes(uniqueById([...currentFlow.nodes, ...nodes]));
        setEdges(uniqueById([...currentFlow.edges, ...newEdges]));
      }
    });
  };

  useEffect(() => {
    if (!selectedOption) setCurrentFlow({nodes: nodes, edges: edges});
  }, [nodes])
  
  function handleApiChange(event) {
    setSelectedApi(event.target.value);
  }

  const handleRadioChange = (event) => {
    setSelectedRadioOption(event.target.value);
  };

  return (
    <div className="dndflow" style={{ width: "100%", height: "100vh" }}>
      <ReactFlowProvider>
        <div className="flow-sec">
          <SettingsSuggestIcon
            fontSize="large"
            className="settings"
            onClick={enableSettings}
          />
          {nodeData && nodeData.data.label !== "Trigger" ? (
            <aside>
              <div style={{ display: "flex", alignItems: "center" }}>
                <ArrowBackIcon
                  fontSize="large"
                  style={{ cursor: "pointer", color: "whitesmoke" }}
                  onClick={resetNodeData}
                />
                <h1 className="ml-4 font-bold" style={{ fontSize: "25px" }}>
                  Properties
                </h1>
              </div>
              <hr className="divider" />
              <h1
                className="font-bold mb-1 mt-4 flex items-start"
                style={{ fontSize: "15px" }}
              >
                Message Body:
              </h1>
              <div className="ckeditor-dark-mode mr-7">
                <CKEditor
                  editor={ClassicEditor}
                  data={editedMessage}
                  onChange={(event, editor) => {
                    const data = editor.getData();
                    onInputChange(data);
                  }}
                  config={{
                    toolbar: [
                      "heading",
                      "|",
                      "bold",
                      "italic",
                      "link",
                      "bulletedList",
                      "numberedList",
                      "blockQuote",
                    ],
                    fontSize: {
                      options: ["tiny", "small", "default", "big", "huge"],
                    },
                  }}
                />
              </div>
              <button
                className="px-10 mt-2 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                onClick={onUpdate}
              >
                Update
              </button>
              <h1
                className="font-bold mt-6 flex items-start"
                style={{ fontSize: "15px" }}
              >
                Action Name:
              </h1>
              <input
                style={{ textAlign: "left", paddingLeft: "1rem", fontSize: '15px', width: '93%' }}
                className="input-field mr-8 mt-2 mb-6 px-20 py-1 border rounded-md border-gray-300 focus:outline-none focus:border-indigo-500"
                type="text"
                value={actionName}
                onChange={onActionNameChange}
              />
              <h1
                className="font-bold mt-2 flex items-start"
                style={{ fontSize: "15px" }}
              >
                Action Type:
              </h1>
              <input
                style={{ textAlign: "left", paddingLeft: "1rem", fontSize: '15px', width: '93%' }}
                className="input-field px-20 mr-8 mt-2 mb-6 py-1 border rounded-md border-gray-300 focus:outline-none focus:border-indigo-500"
                type="text"
                value={actionType}
                onChange={onActionTypeChange}
              />
              {nodeData.data.label !== "End Of Flow node" && (
                <>
                  <div style={{ width: "100%", fontSize: "18px" }}>
                    {nodeData.data.label === "Options node" && (
                      <>
                        <h1
                          className="font-bold mt-6 flex items-start"
                          style={{ fontSize: "17px" }}
                        >
                          Type:
                        </h1>
                        <div className="mt-1" style={{marginRight: '70%'}}>
                          <div>
                            <input
                              type="radio"
                              id="option1"
                              name="options"
                              value='menu'
                              checked={selectedRadioOption === 'menu'}
                              onChange={handleRadioChange}
                              className="large-radio"
                            />
                            <label className="ml-2" htmlFor="option1">Menu</label>
                          </div>
                          <div className="ml-4 mt-1">
                            <input
                              type="radio"
                              id="option2"
                              name="options"
                              value="buttons"
                              checked={selectedRadioOption === 'buttons'}
                              onChange={handleRadioChange}
                              className="large-radio"
                            />
                            <label className="ml-2" htmlFor="option2">Buttons</label>
                          </div>
                        </div>
                        <h1
                          className="font-bold mt-6 flex items-start"
                          style={{ fontSize: "15px" }}
                        >
                          Enter the Number of Nodes:
                        </h1>
                        <div className="flex items-center mt-2 mb-6">
                          <input
                            style={{
                              textAlign: "left",
                              paddingLeft: "1rem",
                              width: "83%",
                              fontSize: '16px'
                            }}
                            className="input-field py-1 border rounded-md border-gray-300 focus:outline-none focus:border-indigo-500"
                            type="text"
                            value={noOfNodes}
                            onChange={onNoOfNodeChange}
                          />
                          <ArrowForwardIcon
                            fontSize="large"
                            className="ml-2"
                            onClick={handleIconClick}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
              {nodeData.data.label === "Api Caller node" && (
                <>
                  <h5 style={{fontSize: '16px'}} className="mt-6 flex items-start font-bold">
                    Select API:
                  </h5>
                  <select
                    className="pl-2 mt-2 input-field mr-8 mb-6 py-2 border rounded-md border-gray-300 focus:outline-none focus:border-indigo-500"
                    value={selectedApi}
                    onChange={handleApiChange}
                    style={{ width: "92%", fontSize: '15px' }}
                  >
                    <option style={{ color: "white" }} value="" disabled>
                      Select an API
                    </option>
                    {allApis?.map((api, index) => (
                      <option
                        style={{ color: "white" }}
                        key={index}
                        value={api.api_endpoint}
                      >
                        {api.api_endpoint}
                      </option>
                    ))}
                  </select>
                </>
              )}
              { nodeData.data.label !== "Api Caller node" &&
                <>
                  <h2 style={{fontSize: '17px'}} className="mt-6 flex items-start font-bold">
                    Select Flows:
                  </h2>
                  <select
                    className="pl-2 mt-2 input-field mr-8 mb-6 py-2 border rounded-md border-gray-300 focus:outline-none focus:border-indigo-500 text-lg"
                    value={selectedOption}
                    onChange={handleChange}
                    style={{ width: "92%" }}
                  >
                    <option style={{ color: "white" }} value="" disabled>
                      Select a Flow
                    </option>
                    {allFlows?.map((option, index) => (
                      <option
                        style={{ color: "white" }}
                        key={index}
                        value={option.flow_name}
                      >
                        {option.flow_name}
                      </option>
                    ))}
                  </select>
                </>
              }
            </aside>
          ) : (
            <>
              {isSettings && (
                <Modal isOpen={isSettings} onClose={() => setIsSettings(false)}>
                  <div className="pl-1 pr-2 flex justify-between mb-4">
                    <button
                      style={{ width: "205px" }}
                      className="py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      onClick={() => onLayout("TB")}
                    >
                      Vertical Layout
                    </button>
                    <button
                      style={{ width: "195px" }}
                      className="ml-2 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      onClick={() => onLayout("LR")}
                    >
                      Horizontal Layout
                    </button>
                  </div>
                  {/* <div className="pl-1 pr-2 flex justify-between mb-4">
                    <button style={{width: '51%'}} className="py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600" onClick={() => setIsDarkMode(true)}>Dark Mode</button>
                    <button style={{width: '48%'}} className="ml-2 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600" onClick={() => setIsDarkMode(false)}>Light Mode</button>
                  </div> */}
                </Modal>
              )}
              <Sidebar />
              <div>
                <h1 className="flex items-start font-bold text-lg">
                  Flow Title:
                </h1>
                <input
                  style={{
                    textAlign: "left",
                    paddingLeft: "1rem",
                    width: "100%",
                  }}
                  className="pl-2 input-field mt-2 mb-6 py-3 border rounded-md border-gray-300 focus:outline-none focus:border-indigo-500 text-lg"
                  type="text"
                  value={flowKey}
                  onChange={onFlowChange}
                />
                <div className="pl-10 pr-10 flex justify-between mt-2 mb-2">
                  <button
                    className="px-10 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                    onClick={onClear}
                  >
                    CLEAR
                  </button>
                  {selectedOption.length == 0 && (
                    <button
                      className="px-10 py-2 bg-green-500 ml-6 text-white rounded-md hover:bg-green-600"
                      onClick={onSave}
                    >
                      SAVE
                    </button>
                  )}
                  {selectedOption.length !== 0 && (
                    <button
                      className="px-10 py-2 bg-green-500 ml-6 text-white rounded-md hover:bg-green-600"
                      onClick={onUpdateFlow}
                    >
                      Update
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        <div
          className="reactflow-wrapper"
          ref={reactFlowWrapper}
          style={{ width: "100%", height: "100%" }}
        >
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
            style={{ width: "100%", height: "100%" }}
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
                  <circle
                    stroke="#2a8af6"
                    strokeOpacity="0.75"
                    r="2"
                    cx="0"
                    cy="0"
                  />
                </marker>
              </defs>
            </svg>
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </div>
  );
};

export default DnDFlow;
