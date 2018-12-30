const express = require('express');
const path = require('path');
const yes = require('yes-https');
const util = require('./helpers.js');

const app = express();
app.use(express.static('src/public'));
app.use(yes());

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
  const path = req.path.slice(4);
  const {name, version} = util.extractFromRoute(path);
  let data = await util.getDataFromCache(name, version);
  if (!data) {
    try {
      data = await util.trace(name, version);
      await util.cacheData(name, version, data);
    } catch (e) {
      console.error(e);
      res.sendStatus(500).end();
      return;
    }
  }
  res.json(data);
});

app.listen(8080, () => console.log('Server started.'));
