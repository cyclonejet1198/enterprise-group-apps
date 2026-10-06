const express = require('express');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/summary', async (req,res)=>{
  let docs = {total:0}, proc = {total:0};
  try{ 
    const r = await fetch('http://04-documents-api-1:3000/stats'); 
    docs = await r.json(); 
  }catch(e){ docs={total:0, error:e.message} }
  try{ 
    const r = await fetch('http://05-procurement-api-1:3000/stats'); 
    proc = await r.json(); 
  }catch(e){ proc={total:0, error:e.message} }
  res.json({
    total_platforms:6,
    running:["04-documents:3004","05-procurement:3005","06-dashboard:3006"],
    live_counts: {documents: docs.total, procurement: proc.total},
    documents: docs, procurement: proc,
    timestamp: new Date().toISOString(),
    network: "enterprise-net"
  });
});
app.get('/health', (req,res)=>res.json({status:'ok'}));
app.get('/api/status', (req,res)=>res.json({platforms:6, up:3}));
app.get('/', (req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(3000, ()=>console.log('06 live on enterprise-net'));
