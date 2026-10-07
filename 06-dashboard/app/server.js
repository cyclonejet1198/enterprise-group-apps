const express = require('express');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let redis = null;
let redisReady = false;
try {
  const { createClient } = require('redis');
  redis = createClient({
    url: process.env.REDIS_URL || 'redis://redis:6379',
    socket: {
      connectTimeout: 2000,
      reconnectStrategy: (retries) => {
        if (retries > 3) return false; // Stop retrying after 3
        return 200;
      }
    }
  });
  redis.on('error', e=>console.log('Redis cache miss:', e.message));
  redis.on('connect', ()=>{ redisReady=true; console.log('Redis OK'); });
  redis.connect().catch(()=>{ redisReady=false; console.log('Redis offline - running without cache'); });
} catch(e){ console.log('No redis lib - no cache'); }

async function safeFetch(url, retries=1) {
  for(let i=0;i<=retries;i++){
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if(!r.ok) throw new Error(r.status);
      const j = await r.json();
      return { up: true, data: j };
    } catch(e){
      if(i===retries) return { up: false, error: e.message };
      await new Promise(res=>setTimeout(res, 100));
    }
  }
}

async function getCache(key){
  if(!redisReady || !redis) return null;
  try { return await redis.get(key); } catch{ return null; }
}
async function setCache(key,val,ttl=5){
  if(!redisReady || !redis) return;
  try { await redis.setEx(key, ttl, val); } catch{}
}
async function delCache(key){
  if(!redisReady || !redis) return;
  try { await redis.del(key); } catch{}
}

app.get('/summary', async (req,res)=>{
  const CACHE_KEY = 'dashboard:summary';
  try{
    if(!req.query.nocache){
      const cached = await getCache(CACHE_KEY);
      if(cached) return res.json({...JSON.parse(cached), cached: true, cache: 'HIT'});
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
      events: e1.up ? 1 : 0,
      facility: e2.up ? 1 : 0,
      inventory: e3.up ? 1 : 0,
      documents: e4.up ? e4.data.total : 0,
      procurement: e5.up ? e5.data.total : 0,
      pending: e5.up ? (e5.data.pending || 0) : 0
    },
    platforms: { "01-event": e1, "02-facility": e2, "03-inventory": e3, "04-documents": e4, "05-procurement": e5 },
    timestamp: new Date().toISOString(),
    response_time_ms: Date.now()-start,
    cache: 'MISS',
    network: "enterprise-net",
    engineer: "Yaw Bremang Acquah - EP-C19-L01"
  };

  await setCache(CACHE_KEY, JSON.stringify(payload), 5);
  res.json(payload);
});

app.post('/api/create-document', async (req,res)=>{
  try{
    await delCache('dashboard:summary');
    const r = await fetch('http://04-documents-api:3000/docs', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(req.body)
    });
    const data = await r.json();
    res.json({success: true, data});
  }catch(e){ res.status(500).json({error:e.message}) }
});

app.post('/api/create-procurement', async (req,res)=>{
  try{
    await delCache('dashboard:summary');
    const r = await fetch('http://05-procurement-api:3000/requests', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(req.body)
    });
    const data = await r.json();
    res.json({success: true, data});
  }catch(e){ res.status(500).json({error:e.message}) }
});

app.get('/health', async (req,res)=>{
  let redisStatus = 'disabled';
  if(redis){
    try{ await redis.ping(); redisStatus='connected'; } catch{ redisStatus='disconnected - fallback active'; }
  }
  res.json({status:'ok', platform:'06-dashboard', redis: redisStatus, uptime: process.uptime()});
});

app.get('/', (req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(3000, ()=>console.log('06 PRODUCTION - Redis optional + resilient'));
