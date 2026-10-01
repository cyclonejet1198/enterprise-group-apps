const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/docs';
mongoose.connect(MONGO_URL).then(() => console.log('Mongo Connected')).catch(e => console.error(e));

// === BLUEPRINTS (Tables from Power Apps idea) ===
const Document = mongoose.model('Document', new mongoose.Schema({
  title: String,
  type: { type: String, enum: ['contract','invoice','report','policy','other'] },
  owner: String,
  department: String,
  fileUrl: String,
  relatedTo: { id: String, collection: String },
  status: { type: String, default: 'active' },
  expiryDate: Date,
  createdAt: { type: Date, default: Date.now }
}));

const Version = mongoose.model('Version', new mongoose.Schema({
  docId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  version: Number,
  changedBy: String,
  notes: String,
  date: { type: Date, default: Date.now }
}));

// === API ===
app.get('/', (req,res) => res.json({ status: 'Doc Tracking Platform Running', blueprints: ['Documents','Versions'] }));

app.get('/documents', async (req,res) => {
  const docs = await Document.find();
  res.json(docs);
});

app.post('/documents', async (req,res) => {
  const doc = new Document(req.body);
  await doc.save();
  res.json(doc);
});

app.get('/documents/expiring', async (req,res) => {
  const soon = new Date(); soon.setDate(soon.getDate() + 30);
  const docs = await Document.find({ expiryDate: { $lte: soon } });
  res.json(docs);
});

app.listen(3000, () => console.log('API on 3000'));
