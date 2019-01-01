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

app.get('/api/trend/*', async (req, res) => {
  try {
    const path = req.path.slice(4);
    const {name} = util.extractFromRoute(path);
    console.log(`Performing trending analysis for ${name}`);
    const traceRes = await request({
      url: `${workerHost}/traceAll`,
      method: 'POST',
      data: {name}
    });
    let {traces} = traceRes.data;
    traces = traces.map(versionResult => {
      const dur = versionResult.tracePoints[versionResult.tracePoints.length-1].dur;
      console.log(`Version: ${versionResult.version}, Duration: ${dur}`);
      return {
        version: versionResult.version,
        duration: dur
      };
    });
    res.json({ name, traces });
  } catch (e) {
    console.error(e);
    res.sendStatus(500).end();
  }
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
