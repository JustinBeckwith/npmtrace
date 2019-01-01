const os = require('os');
const path = require('path');
const execa = require('execa');
const uuid = require('uuid');
const fs = require('fs');
const {promisify} = require('util');
const Queue = require('p-queue');
const fetch = require('node-fetch');
const Firestore = require('@google-cloud/firestore');
const semver = require('semver');

const readFile = promisify(fs.readFile);
const workerHost = process.env.WORKER_HOST || 'http://localhost:8081';

const db = new Firestore();
const traceCache = db.collection('traces');

exports.trace = async (req, res) => {
  try {
    const {name, version} = req.body;
    console.log(`Getting tracing for ${name}@${version}`);
    let data = await getDataFromCache(name, version);
    if (!data) {
      console.log('Cache miss!');
      const tracePath = path.join(os.tmpdir(), uuid.v4());
      try {
        await execa('npx', ['require-so-slow', '-o', tracePath, `${name}@${version}`], {stdio: 'inherit'});
        const contents = await readFile(tracePath, 'utf8');
        data = {
          data: JSON.parse(contents)
        };
      } catch(e) {
        data = {
          error: e.toString(),
          data: []
        }
      }
      await cacheData(name, version, data);
    } else {
      console.log('Cache hit!');
    }
    res.json(data);
  } catch (e) {
    console.error(`Cache error!`);
    console.error(e);
    res.sendStatus(500).end();
  }
};

exports.traceAll = async (req, res) => {
  try {
    const {name} = req.body;
    console.log(`tracing all ${name}`);
    const npmRes = await fetch(`https://registry.npmjs.org/${name}`);
    const package = await npmRes.json();
    const versions = Object.keys(package.versions);
    console.log(versions);
    const q = new Queue({concurrency: 50});
    const proms = versions.map(version => {
      return q.add(async () => {
        try {
          const traceRes = await fetch(`${workerHost}/trace`, {
            method: 'post',
            body: JSON.stringify({name, version}),
            headers: { 'Content-Type': 'application/json' }
          });
          const traceData = await traceRes.json();
          if (traceData.error || traceData.data.length === 0) {
            return null;
          }
          return {
            version,
            tracePoints: traceData.data
          };
        } catch (e) {
          return null;
        }
      });
    });
    let traces = await Promise.all(proms);
    traces = traces.filter(x => !!x);
    traces.sort((v1, v2) => semver.compare(v1.version, v2.version));
    const result = { name, traces };
    res.json(result);
  } catch (e) {
    console.error(e);
    res.sendStatus(500).end();
  }
}

async function getDataFromCache(name, version) {
  const majorVersion = semver.major(process.version);
  const url = `${majorVersion}/${encodeURIComponent(name)}/${version}`;
  const doc = await traceCache.doc(url).get();
  if (!doc.exists) {
    return;
  }
  return doc.data();
}

async function cacheData(name, version, data) {
  const majorVersion = semver.major(process.version);
  const url = `${majorVersion}/${encodeURIComponent(name)}/${version}`;
  await traceCache.doc(url).set(data);
}
