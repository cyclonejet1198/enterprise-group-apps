const express = require('express');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function safeFetch(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(2000) });
    const j = await r.json();
    return { up: true, data: j };
  } catch (e) {
    return { up: false, error: e.message };
  }
}

app.get('/summary', async (req,res)=>{
  const [e1, e2, e3, e4, e5] = await Promise.all([
    safeFetch('http://01-event-api:3000/health'),
    safeFetch('http://02-facility-api:3000/health'),
    safeFetch('http://03-inventory-api:3000/health'),
    safeFetch('http://04-documents-api:3000/stats'),
    safeFetch('http://05-procurement-api:3000/stats')
  ]);
  res.json({
    total_platforms: 6,
    running: [
      e1.up ? "01-event:3001" : null,
      e2.up ? "02-facility:3002" : null,
      e3.up ? "03-inventory:3003" : null,
      e4.up ? "04-documents:3004" : null,
      e5.up ? "05-procurement:3005" : null,
      "06-dashboard:3006"
    ].filter(Boolean),
    live_counts: {
      events: e1.up, facility: e2.up, inventory: e3.up,
      documents: e4.up ? e4.data.total : 0,
      procurement: e5.up ? e5.data.total : 0
    },
    platforms: { "01-event": e1, "02-facility": e2, "03-inventory": e3, "04-documents": e4, "05-procurement": e5 },
    timestamp: new Date().toISOString(),
    network: "enterprise-net",
    engineer: "Yaw Bremang Acquah - EP-C19-L01"
  });
});

app.post('/api/create-document', async (req,res)=>{
  try{
    const r = await fetch('http://04-documents-api:3000/docs', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(req.body)
    });
    const j = await r.json(); res.json(j);
  }catch(e){ res.status(500).json({error:e.message}) }
});

app.post('/api/create-procurement', async (req,res)=>{
  try{
    const r = await fetch('http://05-procurement-api:3000/requests', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(req.body)
    });
    const j = await r.json(); res.json(j);
  }catch(e){ res.status(500).json({error:e.message}) }
});

app.get('/health', (req,res)=>res.json({status:'ok', platform:'06-dashboard'}));
app.get('/', (req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(3000, ()=>console.log('06 live - enterprise-net - FIXED /docs'));
