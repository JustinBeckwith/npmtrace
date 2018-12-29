const execa = require('execa');
const uuid = require('uuid');
const os = require('os');
const {request} = require('gaxios');
const fs = require('fs');
const {promisify} = require('util');
const semver = require('semver');
const path = require('path');
const {Storage} = require('@google-cloud/storage');

const readFile = promisify(fs.readFile);
const storage = new Storage();
const bucket = storage.bucket('npmtrace');

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
  const packageRes = await request({url});
  const latest = packageRes.data.latest;
  return latest;
}

/**
 * Parse a path and return the package name and version
 * @param {string} path The path portion of the url to parse
 */
function extractFromRoute(path) {
  const parts = path.split('/').filter(x => x.length).slice(1);
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
  if (name) {
    name = name.toLowerCase();
  }
  return {name, version};
}

/**
 * Obtain trace data from GCS if available
 * @param {string} name
 * @param {string} version
 * @returns {string} The data from the cache or undefined
 */
async function getDataFromCache(name, version) {
  const majorVersion = semver.major(process.version);
  const url = `${majorVersion}/${name}/${version}/data.json`;
  const file = bucket.file(url);
  const [exists] = await file.exists();
  if (!exists) {
    return;
  }
  const contents = await file.download();
  return contents.toString();
}

/**
 * Cache a given set of trace data in cloud storage
 * @param {string} name npm package name
 * @param {string} version npm package version
 * @param {object} data The trace data to save
 */
async function cacheData(name, version, data) {
  const majorVersion = semver.major(process.version);
  const url = `${majorVersion}/${name}/${version}/data.json`;
  const file = bucket.file(url);
  await file.save(JSON.stringify(data));
}

module.exports = {
  extractFromRoute,
  getLatest,
  getDataFromCache,
  trace,
  cacheData
}