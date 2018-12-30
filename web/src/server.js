const express = require('express');
const path = require('path');
const yes = require('yes-https');
const util = require('./helpers.js');
const {request} = require('gaxios');

const app = express();
app.use(express.static('src/public'));
app.use(yes());

const workerHost = process.env.WORKER_HOST || 'http://localhost:8081';

app.get('/packages/*', async (req, res) => {
  const {name, version} = util.extractFromRoute(req.path);
  if (!version) {
    try {
      const latest = await util.getLatest(name);
      const newUrl = `/packages/${name}/${latest}`;
      return res.redirect(newUrl);
    } catch (e) {
      // ignore errors and let the /api route take care of it
    }
  }
  res.sendFile(path.join(__dirname, 'public/trace.html'));
});

app.get('/api/packages/*', async (req, res) => {
  try {
    const path = req.path.slice(4);
    const {name, version} = util.extractFromRoute(path);
    let data = await util.getDataFromCache(name, version);
    if (!data) {
      console.log('cache miss');
      const r = await request({
        url: `${workerHost}/trace`,
        method: 'POST',
        data: {name, version}
      });
      console.log(`Job queued: ${r.data.id}`);
      data = {
        type: 'job',
        id: r.data.id
      };
    }
    res.json(data);
  } catch (e) {
    console.error(e);
    res.sendStatus(500).end();
  }
});

app.get('/api/job/:id', async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`Fetching job ${id}`);
    const r = await request({
      url: `${workerHost}/jobs/${id}`
    });
    const data = r.data;
    if (data.status === 'COMPLETE') {
      await util.cacheData(data.name, data.version, data.payload);
    }
    res.json(data);
  } catch (e) {
    console.error(e);
    res.sendStatus(500).end();
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Web service started on ${port}`));
