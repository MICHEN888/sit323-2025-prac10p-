require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const promClient = require('prom-client');

const app  = express();
const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mydb';


mongoose.connect(MONGO_URI)
  .then(() => console.log('[Mongo] Connected'))
  .catch(err => console.error('[Mongo] Error:', err.message));


app.get('/health', (_, res) => res.send('OK'));
app.get('/api/time', (_, res) => res.json({ now: Date.now() }));


const counter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'code'],
});
app.use((req, res, next) => {
  res.on('finish', () => {
    counter.inc({ method: req.method, route: req.path, code: res.statusCode });
  });
  next();
});
app.get('/metrics', async (_, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});


app.listen(PORT, () => console.log(`[API] Listening on ${PORT}`));
