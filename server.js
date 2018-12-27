const express = require('express');
const execa = require('execa');
const uuid = require('uuid');
const os = require('os');
const path = require('path');
const fs = require('fs');
const {promisify} = require('util');
const fetch = require('node-fetch');

const readFile = promisify(fs.readFile);

/**
 * Produce a load trace for a given npm package and version.
 * @param {string} package Name of the npm package
 * @param {string} version Semver version to trace
 * @returns JSON trace data
 */
async function trace(package, version) {
  const tracePath = path.join(os.tmpdir(), uuid.v4());
  await execa('npx', ['require-so-slow', '-o', tracePath, `${package}@${version}`], {stdio: 'inherit'});
  const contents = await readFile(tracePath, 'utf8');
  return JSON.parse(contents);
}

/**
 * Get the latest tag for a given npm module
 * @param {string} package name of the package
 * @returns The semver version with the latest tag
 */
async function getLatest(package) {
  if (!package) {
    throw new Error('Package is required.');
  }
  const url = `http://registry.npmjs.org/-/package/${package}/dist-tags`;
  console.log(url);
  const packageRes = await fetch(url);
  const packageData = await packageRes.json();
  console.log(packageData);
  const latest = packageData.latest;
  return latest;
}

function extractFromRoute(path) {
  const parts = path.split('/').filter(x => x.length).slice(1);
  console.log(parts);
  let name;
  let version;
  if (parts[0].startsWith('@')) {
    switch(parts.length) {
      case 2:
        name = parts.join('/');
        break;
      case 3:
        name = parts.slice(0, 2).join('/');
        version = parts[2];
        break;
      default:
        throw new Error(`Malformed url: ${path}`);
    }
  } else {
    switch(parts.length) {
      case 1:
        name = parts[0];
        break;
      case 2:
        name = parts[0];
        version = parts[1];
        break;
      default:
        throw new Error(`Malformed url: ${path}`);
    }
  }
  console.log({name, version});
  return {name, version};
}

const app = express();
app.use(express.static('public'))

app.get('/packages/*', async (req, res) => {
  const {name, version} = extractFromRoute(req.path);
  if (!version) {
    const latest = await getLatest(name);
    const newUrl = `/packages/${name}/${latest}`;
    return res.redirect(newUrl);
  }
  res.sendFile(path.join(__dirname, 'public/trace.html'));
});

app.get('/api/packages/*', async (req, res) => {
  const path = req.path.slice(4);
  const {name, version} = extractFromRoute(path);
  const data = await trace(name, version);
  res.json(data);
});

app.listen(8080, () => console.log('Server started.'));
