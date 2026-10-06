const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const mongoUri = process.env.MONGO_URI || 'mongodb://db:27017/dashboard';
mongoose.connect(mongoUri).then(() => console.log('MongoDB connected for Dashboard')).catch(err => console.error(err));

app.get('/', (req, res) => {
  res.json({ 
    status: "Dashboard Platform Running", 
    blueprints: ["Analytics", "KPIs", "Reports"],
    aggregates: {
      platforms: ["01-event", "02-facility", "03-inventory", "04-documents", "05-procurement", "06-dashboard"]
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ ok: true, platform: "06-dashboard" });
});

app.get('/summary', (req, res) => {
  res.json({
    total_platforms: 6,
    running: ["04-documents:3004", "05-procurement:3005", "06-dashboard:3006"]
  });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Dashboard API running on ${PORT}`));
