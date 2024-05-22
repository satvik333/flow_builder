const express = require('express');
const router = express.Router();
const connection = require('../databaseConnection');
const cors = require('cors');

router.use(cors());
router.use(express.json());

router.get('/', async (req, res) => {
  try {
    res.status(200).json('HIIIIIIII');
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/get-flow', async (req, res) => {
  try {
    const [results] = await connection.execute('SELECT * FROM flows');
    
    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching flows:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/upload-flow', async (req, res) => {
  try {
    let flow = req.body.flow;

    const [results] = await connection.execute('INSERT INTO flows (flow_json) VALUES (?)', 
    [flow]);

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;