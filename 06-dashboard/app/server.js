const express = require('express');
const path = require('path');
const { createClient } = require('redis');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const REDIS_URL = process.env.REDIS_URL || 'redis://dashboard-redis:6379';
const redis = createClient({ url: REDIS_URL });
redis.on('error', e=>console.log('Redis error', e.message));
redis.connect().then(()=>console.log('Redis Cache OK')).catch(()=>console.log('Redis offline - fallback to direct'));

async function safeFetch(url, retries=2) {
  for(let i=0;i<=retries;i++){
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(2500) });
      if(!r.ok) throw new Error(r.status);
      const j = await r.json();
      return { up: true, data: j, latency: r.headers.get('x-response-time') || 'ok' };
    } catch(e){
      if(i===retries) return { up: false, error: e.message, retries };
      await new Promise(res=>setTimeout(res, 200*i));
    }
  }
}

app.get('/summary', async (req,res)=>{
  const CACHE_KEY = 'dashboard:summary';
  try{
    const cached = await redis.get(CACHE_KEY);
    if(cached && !req.query.nocache){
      return res.json({...JSON.parse(cached), cached: true});
    }
  }catch(e){}

  const start = Date.now();
  const [e1, e2, e3, e4, e5] = await Promise.all([
    safeFetch('http://01-event-api:3000/health'),
    safeFetch('http://02-facility-api:3000/health'),
    safeFetch('http://03-inventory-api:3000/health'),
    safeFetch('http://04-documents-api:3000/stats'),
    safeFetch('http://05-procurement-api:3000/stats')
  ]);

  const payload = {
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
    response_time_ms: Date.now()-start,
    cache: 'MISS',
    network: "enterprise-net",
    engineer: "Yaw Bremang Acquah - EP-C19-L01",
    scalability: { cache: 'redis', healthchecks: 'enabled', replicas: 'ready for k8s' }
  };

  try{ await redis.setEx(CACHE_KEY, 5, JSON.stringify(payload)); }catch(e){}
  res.json(payload);
});

app.post('/api/create-document', async (req,res)=>{
  try{
    await redis.del('dashboard:summary');
    const r = await fetch('http://04-documents-api:3000/docs', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(req.body)
    });
    res.json(await r.json());
  }catch(e){ res.status(500).json({error:e.message}) }
});

app.post('/api/create-procurement', async (req,res)=>{
  try{
    await redis.del('dashboard:summary');
    const r = await fetch('http://05-procurement-api:3000/requests', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(req.body)
    });
    res.json(await r.json());
  }catch(e){ res.status(500).json({error:e.message}) }
});

app.get('/health', async (req,res)=>{
  let redisUp = false;
  try{ await redis.ping(); redisUp = true; }catch(e){}
  res.json({status:'ok', platform:'06-dashboard', redis: redisUp ? 'connected' : 'disconnected', uptime: process.uptime()});
});

app.get('/', (req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(3000, ()=>console.log('06 PRODUCTION - Redis caching + healthchecks'));
