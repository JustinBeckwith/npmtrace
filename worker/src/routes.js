const os = require('os');
const path = require('path');
const execa = require('execa');
const uuid = require('uuid');
const fs = require('fs');
const {promisify} = require('util');
const Queue = require('p-queue');
const fetch = require('node-fetch');

const readFile = promisify(fs.readFile);
const workerHost = process.env.WORKER_HOST || 'http://localhost:8081';

exports.trace = async (req, res) => {
  try {
    const {name, version} = req.body;
    console.log(`tracing ${name}@${version}`);
    const tracePath = path.join(os.tmpdir(), uuid.v4());
    await execa('npx', ['require-so-slow', '-o', tracePath, `${name}@${version}`], {stdio: 'inherit'});
    const contents = await readFile(tracePath, 'utf8');
    const payload = JSON.parse(contents);
    res.json(payload);
  } catch (e) {
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
    const q = new Queue({concurrency: 1});
    const proms = versions.map(version => {
      return q.add(async () => {
        try {
          const traceRes = await fetch(`${workerHost}/trace`, {
            method: 'post',
            body: JSON.stringify({name, version}),
            headers: { 'Content-Type': 'application/json' }
          });
          const data = await traceRes.json();
          return data;
        } catch (e) {
          return null;
        }
      });
    });
    let result = await Promise.all(proms);
    result = result.filter(x => !!x);
    res.json(result);
  } catch (e) {
    console.error(e);
    res.sendStatus(500).end();
  }
}
