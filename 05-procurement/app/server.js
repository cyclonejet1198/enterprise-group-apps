const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const mongoUri = process.env.MONGO_URI || 'mongodb://db:27017/procurement';
mongoose.connect(mongoUri).then(() => console.log('MongoDB connected for Procurement')).catch(err => console.error(err));

app.get('/', (req, res) => {
  res.json({ status: "Procurement Platform Running", blueprints: ["Requests", "Approvals", "Vendors"] });
});

app.get('/health', (req, res) => {
  res.json({ ok: true, platform: "05-procurement" });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Procurement API running on ${PORT}`));
