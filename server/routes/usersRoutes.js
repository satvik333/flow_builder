const express = require('express');
const router = express.Router();
const connection = require('../databaseConnection');
const cors = require('cors');

router.use(cors());
router.use(express.json());

router.get('/get-flows/:client_id', async (req, res) => {
  const clientId = req.params.client_id;
  try {
    const [results] = await connection.execute('SELECT id, flow_name, flow_json FROM react_flow WHERE client_id = ? AND del_flag = ?', [clientId, 0]);
    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching flows:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/save-flow', async (req, res) => {
  try {
    const flow = req.body;
    const date = new Date();

    const [results] = await connection.execute(
      'INSERT INTO react_flow (client_id, flow_name, flow_json, last_updated_json, added_date, updated_date, active_flag) VALUES (?, ?, ?, ?, ?, ?, ?)', 
      [flow.clientId, flow.flow_name, JSON.stringify(flow.flow_json), JSON.stringify(flow.flow_json), date, date, flow.active_flag || 1]
    );

    res.status(200).json(results);
  } catch (error) {
    console.error('Error while saving flow:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/update-flow', async (req, res) => {
  try {
    const flow = req.body;
    const date = new Date();

    const [result] = await connection.execute('SELECT flow_json FROM react_flow WHERE id = ?', [flow.id]);

    if (result.length === 0) {
      return res.status(404).json({ error: 'Flow not found' });
    }

    const lastUpdatedJson = result[0].flow_json;
    const newFlowJson = JSON.stringify(flow.flow_json);

    const [results] = await connection.execute(
      'UPDATE react_flow SET last_updated_json = ?, flow_json = ?, flow_name = ?, updated_date = ?, active_flag = 1 WHERE id = ?', 
      [lastUpdatedJson, newFlowJson, flow.flow_name, date, flow.id]
    );

    res.status(200).json(results);
  } catch (error) {
    console.error('Error while updating flow:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;