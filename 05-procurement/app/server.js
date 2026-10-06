const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
app.use(cors()); app.use(express.json());

mongoose.connect(process.env.MONGO_URI || 'mongodb://db:27017/procurement').then(()=>console.log('Proc DB OK'));

const Req = mongoose.model('Request', new mongoose.Schema({
  item: String, amount: Number, vendor: String, status:{type:String, default:'pending'}, createdAt:{type:Date, default:Date.now}
}));

app.get('/', (req,res)=>res.json({status:'Procurement Platform Running', port:3005, blueprints:['Requests','Approvals','Vendors']}));
app.get('/health', (req,res)=>res.json({status:'ok', service:'05-procurement'}));
app.get('/requests', async (req,res)=> res.json(await Req.find()));
app.post('/requests', async (req,res)=> res.json(await Req.create(req.body)));
app.post('/requests/:id/approve', async (req,res)=> res.json(await Req.findByIdAndUpdate(req.params.id, {status:'approved'}, {new:true})));
app.get('/stats', async (req,res)=> res.json({total: await Req.countDocuments(), pending: await Req.countDocuments({status:'pending'})}));

app.listen(3000, ()=>console.log('05 running 3000->3005'));
