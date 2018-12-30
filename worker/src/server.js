const express = require('express');
const os = require('os');
const path = require('path');
const execa = require('execa');
const uuid = require('uuid');
const fs = require('fs');
const {promisify} = require('util');
const Firestore = require('@google-cloud/firestore');

const readFile = promisify(fs.readFile);

const db = new Firestore();
const jobs = db.collection('jobs');

// configure express
const app = express();
app.use(express.json());

app.post('/trace', async (req, res) => {
  try {
    const {name, version} = req.body;
    console.log(`tracing ${name}@${version}`);
    const job = {
      id: uuid.v4(),
      name,
      version,
      // RUNNING | COMPLETE | ERROR
      status: 'RUNNING'
    };
    await jobs.doc(job.id).set(job)

    // this will run after the requests is complete
    trace(job.id, name, version);

    res.json(job);
  } catch (e) {
    console.error(e);
    res.sendStatus(500).end();
  }
});

app.get('/jobs/:id', async (req, res) => {
  const id = req.params.id;
  console.log(`Getting Job Id ${id}`);
  const doc = await jobs.doc(id).get();
  const job = doc.data();
  res.json(job);
});

const port = process.env.PORT || 8081;
app.listen(port, () => console.log(`Worker service started on ${port}`));

/**
 * Produce a load trace for a given npm package and version.
 * @param {string} id Unique identifier for the job
 * @param {string} package Name of the npm package
 * @param {string} version Semver version to trace
 * @returns JSON trace data
 */
async function trace(id, package, version) {
  console.log(`fetching job ${id}`);
  const doc = await jobs.doc(id).get();
  const job = doc.data();
  console.log(job);
  try {
    const tracePath = path.join(os.tmpdir(), uuid.v4());
    await execa('npx', ['require-so-slow', '-o', tracePath, `${package}@${version}`], {stdio: 'inherit'});
    const contents = await readFile(tracePath, 'utf8');
    const payload = JSON.parse(contents);
    job.status = 'COMPLETE';
    job.payload = payload;
  } catch (e) {
    console.error(`Error tracing ${package}@${version}`);
    console.error(e);
    job.payload = e.toString()
    job.status = 'ERROR';
  }
  await jobs.doc(id).set(job);
}
