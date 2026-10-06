const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
app.use(cors()); app.use(express.json());

mongoose.connect(process.env.MONGO_URI || 'mongodb://db:27017/docs').then(()=>console.log('Docs DB OK'));

const Doc = mongoose.model('Doc', new mongoose.Schema({
  title: String, type: String, status: {type:String, default:'draft'}, createdAt:{type:Date, default:Date.now}
}));

app.get('/', (req,res)=>res.json({status:'Document Platform Running', port:3004, blueprints:['Documents','Versions'], count: 'use /docs'}));
app.get('/health', (req,res)=>res.json({status:'ok', service:'04-documents'}));
app.get('/docs', async (req,res)=> res.json(await Doc.find()));
app.post('/docs', async (req,res)=> res.json(await Doc.create(req.body)));
app.delete('/docs/:id', async (req,res)=> res.json(await Doc.findByIdAndDelete(req.params.id)));
app.get('/stats', async (req,res)=> res.json({total: await Doc.countDocuments()}));

app.listen(3000, ()=>console.log('04 running 3000->3004'));
