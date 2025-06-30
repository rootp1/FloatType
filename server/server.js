require('dotenv').config();

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.get('/gemini-proxy', (req, res) => {
  res.json({ apiKey: GEMINI_API_KEY });
});

app.listen(3000, () => console.log('Proxy listening on port 3000'));
