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
    const traceRes = await request({
      url: `${workerHost}/trace`,
      method: 'POST',
      data: {name, version}
    });
    const data = traceRes.data;
    res.json(data);
  } catch (e) {
    console.error(e);
    res.sendStatus(500).end();
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Web service started on ${port}`));
