import axios from 'axios';

let baseUrl = 'http://localhost:8080';

async function saveFlow(flow) {
  try {
    const transformedFlow = {
      clientId: flow.clientId,
      flow_name: flow.flowName,
      flow_json: {
        nodes: flow.nodes.map(node => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: {
            label: node.data.label,
            icon: node.data.icon ? node.data.icon.type.name : null,
            id: node.data.id,
            type: node.data.type,
            message: node.data.message || '',
            actionName: node.data.actionName || 'Action Name',
            actionType: node.data.actionType || 'Action Type',
            hasChild: node.data.hasChild || false,
            collapsed: node.data.collapsed || false,
            direction: node.data.direction || 'TB',
            selectedApi: node.data.selectedApi || "",
            formFields: node.data.formFields || []
          },
        })),
        edges: flow.edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.type,
        })),
      },
      active_flag: flow.activeFlag || 1,
    };

    const response = await axios.post(`${baseUrl}/save-flow`, transformedFlow);
    return response.data;
  } catch (error) {
    console.error('Error while saving flow', error);
    throw error;
  }
}

async function updateFlow(flow) {
  try {
    const transformedFlow = {
      id: flow.id,
      flow_name: flow.flowName,
      flow_json: {
        nodes: flow.nodes.map(node => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: {
            label: node.data.label,
            icon: node.data.icon ? node.data.icon.type.name : null,
            id: node.data.id,
            type: node.data.type,
            message: node.data.message || '',
            actionName: node.data.actionName || 'Action Name',
            actionType: node.data.actionType || 'Action Type',
            hasChild: node.data.hasChild || false,
            collapsed: node.data.collapsed || false,
            direction: node.data.direction || 'TB',
            selectedApi: node.data.selectedApi || "",
            formFields: node.data.formFields || []
          },
        })),
        edges: flow.edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.type,
        })),
      },
    };

    const response = await axios.post(`${baseUrl}/update-flow`, transformedFlow);
    return response.data;
  } catch (error) {
    console.error('Error while updating flow', error);
    throw error;
  }
}

async function getFlowsByClient(clientId) {
  try {
    const response = await axios.get(`${baseUrl}/get-flows/${clientId}`);
    return response.data;
  } catch (error) {
    console.error('Error while fetching flows', error);
    throw error;
  }
}

async function getAllApis() {
  try {
    const response = await axios.get(`${baseUrl}/api-handler/get-all-apis`);
    return response.data;
  } catch (error) {
    console.error("Error while fetching api's", error);
    throw error;
  }
}

export { saveFlow, getFlowsByClient, updateFlow, getAllApis };
