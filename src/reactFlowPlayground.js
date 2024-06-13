import React, { useState, useRef, useCallback, useEffect } from "react";
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  useReactFlow,
  Background,
  Panel
} from "reactflow";
import DeleteIcon from '@mui/icons-material/Delete';
import "reactflow/dist/style.css";
import dagre from "dagre";
import AddCommentIcon from "@mui/icons-material/AddComment";
import Sidebar from "./Sidebar";
import "./react-flow.css";
import "reactflow/dist/base.css";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import CustomNode from "./CustomNode";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { convert } from "html-to-text";
import SendIcon from '@mui/icons-material/Send';
import DownloadButton from "./DownloadButton";
import {
  saveFlow,
  getFlowsByClient,
  updateFlow,
  getAllApis,
} from "./services/flowService";

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));


const nodeTypes = {
  custom: CustomNode,
};

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
  const [flowKey, setFlowKey] = useState(() => {
    const today = Date.now();
    return `flow_${today}`;
  });
  const [actionName, setActionName] = useState("");
  const [actionType, setActionType] = useState("");
  const [dataLabel, setDataLabel] = useState(null);
  const [noOfNodes, setNoOfNodes] = useState(1);
  const [collapsedNodes, setCollapsedNodes] = useState({});
  const [allFlows, setAllFlows] = useState([{ flow_name: 'none' }]);
  const [selectedOption, setSelectedOption] = useState("");
  const [selectedApi, setSelectedApi] = useState({name: ''});
  const [selectedId, setSelectedId] = useState(null);
  const [allApis, setAllApis] = useState(null);
  const [currentFlow, setCurrentFlow] = useState(null);
  const [selectedRadioOption, setSelectedRadioOption] = useState('menu');
  const [selectedLayout, setSelectedLayout] = useState("");
  const [formFields, setFormFields] = useState([{ title: `Input Field 1`, value: 'Enter Your Email', required: false }]);
  const [loading, setLoading] = useState(false);

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
      ) {
        return;
      }
  
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === sourceNode.id
            ? { ...node, data: { ...node.data, hasChild: true } }
            : node
        )
      );
  
      setEdges((edges) => [
        ...edges,
        {
          id: `reactflow__edge-${params.source}-${params.target}`,
          source: params.source,
          sourceHandle: params.sourceHandle,
          target: params.target,
          targetHandle: params.targetHandle,
        },
      ]);
    },
    [setEdges, nodes, connectingNodeId, setNodes]
  );  

  useEffect(() => {
    const fetchFlows = async () => {
      let clientId = "1234";
      try {
        const flows = await getFlowsByClient(clientId);
        setAllFlows(prev => [...flows.result]);
      } catch (error) {
        console.error("Error fetching flows:", error);
      }
    };

    fetchFlows();
  }, []);

  useEffect(() => {

    if (!selectedOption) setCurrentFlow({nodes: nodes, edges: edges});

    const handleClick = (event) => {
      const clickedElement = event.target;
      let attribute = clickedElement.getAttribute("data-testid");

      if (clickedElement.tagName === 'path' && clickedElement.getAttribute('d') === 'M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2m5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12z') {
        const parentElement = clickedElement.closest('[data-testid]');
        if (parentElement) {
          const attribute = parentElement.getAttribute("data-testid");
          if (attribute === "CancelIcon") {
            const nodeId = parentElement.closest(".react-flow__node")?.dataset.id;
            if (nodeId) {
              removeNode(nodeId);
            }
          }
        }
      }

      if (attribute === "CancelIcon" ) {
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
      dagreGraph.setEdge(edge?.source, edge?.target);
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
    setFormFields([{ title: `Input Field 1`, value: 'Enter Your Email', required: false }]);

    const sourceNodeId = edges
      .filter((edge) => edge?.target === idToRemove)
      .map((edge) => edge?.source)[0];
      
    setNodes((prevNodes) => {
      const filteredNodes = prevNodes.filter((node) => node.id !== idToRemove);
      if (sourceNodeId) {
        return filteredNodes.map((node) =>
          (node.id === sourceNodeId)
            ? { ...node, data: { ...node.data, hasChild: false } }
            : node
        );
      }

      return filteredNodes;
    });
    setTimeout(() => {
      setNodeData(null);
    }, 700);
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

      convertFlowToDecisionTreeFlow(flow);

      alert("Check Flow Name before Save");

      saveFlow(flow);
    }
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
          options: nodes[i].data.label === "Options node" ? getOptions(nodes[i]) : null,
          answer: nodes[i].data.label != "Options node" ? getOptions(nodes[i]) : null,
          timeout: nodes[i].data.label === "Options node" ? "1" : null,
          action: actionType,
          selectedApi: nodes[i].data.selectedApi || '',
          optionType: nodes[i].data.selectedRadioOption || "",
          formFields: nodes[i].data.label === "Create Form node" ? nodes[i].data.formFields : []
        };
      }
    }
    console.log(decisionTree, "descion treeeee");
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
    setFormFields([{ title: `Input Field 1`, value: 'Enter Your Email', required: false }]);
  }

  const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
    initialNodes
    // initialEdges
  );

  const getNodeId = () => `randomnode_${+new Date()}`;

  const onElementClick = useCallback(async (element) => {
    setLoading(true); 

    setTimeout(async () => {
      if (element.nodes.length > 0) {
        const nodeData = element.nodes[0];
        setNodeData(nodeData);
        setEditedMessage(nodeData.data.message);
    
        const nodeId = nodeData.data.id;
        const lastNumber = nodeId.match(/\d+$/)?.[0];
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
    
        setActionName(nodeData.data.actionName || "");
        setActionType(nodeData.data.actionType || "");
    
        if (nodeData?.data.label === 'Options node') {
          let apis = await getAllApis();
          setAllApis(apis.result);
          const selectedApi = apis.result.find((api) => api.id === nodeData.data?.selectedApi?.id);
          if (selectedApi) {
            setSelectedApi(selectedApi);
          }
        }
    
        if (nodeData?.data.label === 'Create Form node') {
          if (nodeData.data?.formFields?.length > 0) setFormFields(nodeData.data.formFields);
        }
      }
      
      setLoading(false); 
    }, 800);
  }, [setNodeData, setEditedMessage, setActionName, setActionType, setSelectedApi, setAllApis, setFormFields]);

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
                optionType: selectedRadioOption,
                formFields: formFields
                // messages: messages
              },
            };
          }
          return node;
        });
        return updatedNodes;
      });
    }
  }, [editedMessage, nodeData, noOfNodes, actionName, actionType, selectedApi, selectedRadioOption, formFields]);

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
    setFormFields([{ title: `Input Field 1`, value: 'Enter Your Email', required: false }]);
    setEditedMessage(null);
    // setMessages([]);
  }

  const onFlowChange = (event) => {
    setFlowKey(event.target.value);
  };

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


        newEdges.push({source: nodeData.id, target: nodes[1].id, id: Date.now()});

        setNodes(uniqueById([...currentFlow.nodes, ...nodes]));
        setEdges(uniqueById([...currentFlow.edges, ...newEdges]));
      }
    });
  };

  
  function handleApiChange(event) {
    const selectedApi = allApis.find((api) => api.id === Number(event.target.value));
    if (selectedApi) {
      setSelectedApi(selectedApi);
    }
  }

  const handleRadioChange = (event) => {
    setSelectedRadioOption(event.target.value);
  };


  function countNodes(id) {
    let counter = 0;
    edges.forEach((edge) => {
      if (edge?.source === id) {
        counter += 1;
      }
    });
    setNoOfNodes(counter)
  }

  useEffect(() => {
    if (nodeData?.data.label === 'Options node') countNodes(nodeData?.id);
  }, [nodeData, edges])

  const addField = () => {
    setFormFields((prevFormFields) => {
        const arrayFormFields = Array.isArray(prevFormFields) ? prevFormFields : [];
        return [
            ...arrayFormFields,
            { title: `Input Field ${arrayFormFields.length + 1}`, value: '', required: false }
        ];
    });
  };

  const handleFormChange = (index, event) => {
    const newFields = [...formFields];
    newFields[index].value = event.target.value;
    setFormFields(newFields);
  };

  function removeInputField(index) {
    setFormFields(formFields.filter((_, idx) => idx !== index));
  }

  const handleCheckBox = (index) => {
    setFormFields((prevFields) => 
      prevFields.map((field, idx) => {
        if (idx === index) {
          return { ...field, required: !field.required };
        }
        return field;
      })
    );
  };

  const handleLayoutChange = (event) => {
    const value = event.target.value;
    setSelectedLayout(value);
    if (value === "verticalTB") {
      onLayout("TB");
    } else if (value === "horizontalLR") {
      onLayout("LR");
    }
  };


  return (
    <div className="dndflow" style={{ width: "100%", height: "100vh" }}>
      <ReactFlowProvider>
        <div className="flow-sec">
          {loading && <div style={{width: "20vw"}}><span className="loader"></span></div>}
          {!loading && (nodeData && nodeData.data.label !== "Trigger") ? (
            <aside>
              <div className="ml-1" style={{ display: "flex", alignItems: "center" }}>
                <ArrowBackIcon
                  fontSize="large"
                  style={{ cursor: "pointer", color: "whitesmoke" }}
                  onClick={resetNodeData}
                />
                <h1 className="ml-4 font-bold" style={{ fontSize: "25px" }}>
                  Properties.
                </h1>
              </div>
              <hr className="divider" />
              { nodeData.data.label !== "Create Form node" &&
                <>
                  <h1
                    className="font-bold mb-1 mt-4 ml-2 flex items-start"
                    style={{ fontSize: "15px" }}
                  >
                    Message Body:
                  </h1>
                  <div className="ckeditor-dark-mode ml-2 mr-12">
                  <CKEditor
                      editor={ClassicEditor}
                      data={editedMessage}
                      onChange={(event, editor) => {
                        const data = editor.getData();
                        onInputChange(data);
                      }}
                      config={{
                        toolbar: [
                          'heading',
                          '|',
                          'bold',
                          'italic',
                          'link',
                          'bulletedList',
                          'numberedList',
                          'blockQuote',
                          'imageUpload',
                        ],
                        fontSize: {
                          options: ['tiny', 'small', 'default', 'big', 'huge'],
                        },
                        ckfinder: {
                          uploadUrl: 'http://localhost:3002/api-handler/upload-image',
                        },
                      }}
                    />
                  </div>
                  <button
                    className="px-10 mt-3 mr-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    onClick={onUpdate}
                  >
                    Update
                  </button>
                </>
              }
              { nodeData.data.label === "Create Form node" &&
                <>
                  <div className="form-row">
                    <h1
                      className="font-bold mt-2 ml-2 mb-4 flex items-start"
                      style={{ fontSize: "15px" }}
                    >
                      Form Input Fields :
                    </h1>
                    <button className="mb-2" onClick={addField} style={{ padding: '5px', fontSize: '14px', backgroundColor: "blue", borderRadius: "5px", marginLeft: '35%' }}>
                        + Add New
                    </button>
                  </div>
                  <div className="custom-scrollbar ml-2 mr-4" style={{ height: '20%', width: '86%',overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
                    {formFields?.map((field, index) => (
                        <div key={index} style={{ marginBottom: '15px' }}>
                          <h3 className="mr-4" style={{ display: 'block', marginBottom: '5px' }}>{field.title}:<span style={{marginLeft: '53%'}}>Required</span></h3>
                          <label>{index+1}.</label>
                          <input
                            className="input-field ml-2"
                            type="text"
                            value={field.value}
                            onChange={(event) => handleFormChange(index, event)}
                            style={{ padding: '5px', fontSize: '14px', borderRadius: "5px", border: '2px solid whitesmoke' }}
                          />
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={() => handleCheckBox(index)}
                            className="ml-6 large-checkbox"
                          />
                          <DeleteIcon
                            fontSize="medium"
                            className="ml-1 mb-1"
                            style={{ color: '#f56565', cursor: 'pointer' }}
                            onClick={() => removeInputField(index)}
                          />
                      </div>
                      ))}
                  </div>
                </>
              }
              <h1
                className="font-bold mt-6 ml-2 flex items-start"
                style={{ fontSize: "15px" }}
              >
                Action Name:
              </h1>
              <input
                style={{ textAlign: "left", paddingLeft: "1rem", fontSize: '15px', width: '87%' }}
                className="input-field mr-10 mt-2 mb-6 py-1 border rounded-md border-gray-300 focus:outline-none focus:border-indigo-500"
                type="text"
                value={actionName}
                placeholder="Action Name"
                onChange={onActionNameChange}
              />
              <h1
                className="font-bold mt-2 ml-2 flex items-start"
                style={{ fontSize: "15px" }}
              >
                Action Type:
              </h1>
              <input
                style={{ textAlign: "left", paddingLeft: "1rem", fontSize: '15px', width: '87%' }}
                className="input-field mr-10 mt-2 mb-6 py-1 border rounded-md border-gray-300 focus:outline-none focus:border-indigo-500"
                type="text"
                value={actionType}
                onChange={onActionTypeChange}
                placeholder="Action Type"
              />
              {nodeData.data.label !== "End Of Flow node" && (
                <>
                  <div style={{ width: "100%", fontSize: "18px" }}>
                    {nodeData.data.label === "Options node" && (
                      <>
                        <h1
                          className="font-bold ml-2 mt-2 flex items-start"
                          style={{ fontSize: "17px" }}
                        >
                          Type:
                        </h1>
                        <div className="mt-2 ml-2 flex" style={{marginRight: '70%'}}>
                          <div className="flex">
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
                          <div className="ml-8 flex">
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
                          className="font-bold mt-6 ml-2 flex items-start"
                          style={{ fontSize: "15px" }}
                        >
                          Enter the Number of Nodes:
                        </h1>
                        <div className="ml-2 flex items-center mt-2 mb-6">
                          <input
                            style={{
                              textAlign: "left",
                              paddingLeft: "1rem",
                              width: "80%",
                              fontSize: '16px'
                            }}
                            className="input-field py-1 border rounded-md border-gray-300 focus:outline-none focus:border-indigo-500"
                            type="text"
                            value={noOfNodes}
                            onChange={onNoOfNodeChange}
                          />
                          <SendIcon
                            fontSize="medium"
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
                  <h5 style={{fontSize: '16px'}} className="mt-6  ml-2 flex items-start font-bold">
                    Select API:
                  </h5>
                  <select
                    className="pl-2 mt-2 input-field mr-10 mb-6 py-2 border rounded-md border-gray-300 focus:outline-none focus:border-indigo-500"
                    value={selectedApi.id || ''}
                    onChange={handleApiChange}
                    style={{ width: "87%", fontSize: '15px' }}
                  >
                    <option style={{ color: "white" }} value="" disabled>
                      Select an API
                    </option>
                    {allApis?.map((api) => (
                      <option
                        style={{ color: "white" }}
                        key={api.id}
                        value={api.id}
                      >
                        {api.name}
                      </option>
                    ))}
                  </select>
                </>
              )}
              { !nodeData.data.hasChild && nodeData.data.label !== "Api Caller node" &&
                <>
                  <h2 style={{fontSize: '16px'}} className="mt-6 ml-2 flex items-start font-bold">
                    Select Flows:
                  </h2>
                  <select
                    className="pl-2 mt-2 input-field mr-10 mb-6 py-2 border rounded-md border-gray-300 focus:outline-none focus:border-indigo-500"
                    value={selectedOption}
                    onChange={handleChange}
                    style={{ width: "87%", fontSize: '15px' }}
                  >
                    <option style={{ color: "white" }} value="" disabled>
                      Select a Flow
                    </option>
                    <option style={{ color: "white" }} value="none">
                      None
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
            !loading &&
            <>
              <Sidebar />
              <div>
                <h1 className="flex items-start font-bold text-lg">
                  Flow Title:
                </h1>
                <input
                  style={{
                    textAlign: "left",
                    paddingLeft: "1rem",
                    width: "19vw",
                  }}
                  className="pl-2 input-field mt-2 mb-2 py-3 border rounded-md border-gray-300 focus:outline-none focus:border-indigo-500 text-lg"
                  type="text"
                  value={flowKey}
                  onChange={onFlowChange}
                />
                <div className="pl-10 pr-10 flex justify-between mb-8">
                  <button
                    className="px-10 py-2 action-btns text-white rounded-md"
                    onClick={onClear}
                  >
                    CLEAR
                  </button>
                  {selectedOption.length == 0 && (
                    <button
                      className="px-10 py-2 action-btns ml-6 text-white rounded-md"
                      onClick={onSave}
                    >
                      SAVE
                    </button>
                  )}
                  {selectedOption.length !== 0 && (
                    <button
                      className="px-10 py-2 action-btns ml-6 text-white rounded-md"
                      onClick={onUpdateFlow}
                    >
                      UPDATE
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
            <Panel position="top">
              <select
                className="input-field py-1 px-2 border rounded-md border-gray-300 focus:outline-none focus:border-indigo-500 text-lg"
                value={selectedLayout}
                onChange={handleLayoutChange}
                style={{ marginLeft: '64vw' }}
              >
                <option style={{ color: "white" }} value="" disabled>
                  Layout
                </option>
                <option style={{ color: "white" }} value="verticalTB">
                  Vertical
                </option>
                <option style={{ color: "white" }} value="horizontalLR">
                  Horizontal
                </option>
              </select>
            </Panel>
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
