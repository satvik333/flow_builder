import axios from 'axios';

let baseUrl = 'https://api.codebrewery.codes/api';

async function saveFlow(flow) {
  try {
    const transformedFlow = {
      clientId: flow.clientId,
      flow_name: flow.flowName,
      flow_json: flow_json,
      react_flow_json: {
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

    const response = await axios.post(
                                    `${baseUrl}/save-flow`, 
                                    transformedFlow,
                                    { headers: { 
                                      'authorization': 'MTQwNzVjMjcxODlkOWYzNTMyMmIxNDlkYTM0N2MyMjA2ODVmNzM0NGUyNGM5OTJhM2IxZTMwNmVhZTJjOGQyZA==', 'Content-Type': 'application/json',
                                      "subDomain": window.location.href.split('/')[2].split(".")[0]
                                    } }
                                  );
    alert("Successfully Saved");
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
      flow_json: flow_json,
      react_flow_json: {
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
      subDomain: window.location.href.split('/')[2].split(".")[0]
    };

    const response = await axios.post(
                                      `${baseUrl}/update-flow`, 
                                      transformedFlow,
                                      { headers: { 
                                        'authorization': 'ZmQ1MDljZjk4ZDU2NjZkZDAxNTM5ZjhiMzFmMThkMzQxMGU0MjU5NmU2YzFlMjRkZDkzZDAzOTdlZmNjMjRlOA==', 'Content-Type': 'application/json',
                                        "subDomain": window.location.href.split('/')[2].split(".")[0]
                                      } }
                                    );
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
