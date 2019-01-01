const os = require('os');
const path = require('path');
const execa = require('execa');
const uuid = require('uuid');
const fs = require('fs');
const {promisify} = require('util');

const readFile = promisify(fs.readFile);

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
