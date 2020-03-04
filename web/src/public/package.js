/* eslint-env browser */
/* global Polymer, tr */

const main = document.getElementById('main');
const message = document.getElementById('message');
const problem = document.getElementById('problem');

// search bar
const search = document.getElementById('search');
const form = document.getElementById('form');
const urlParts = window.location.pathname.split('/').filter(x => !!x);
const packageName = urlParts.slice(1, -1).join('/');
const packageVersion = urlParts.slice(-1)[0];
search.placeholder = packageName;
form.onsubmit = e => {
  if (search.value !== '') {
    window.location.href = `${window.location.origin}/packages/${search.value}`;
  }
  e.preventDefault();
};

// spinny
const spinny = document.getElementById('spinframe');
const messages = [
  'this could take a little while.',
  'npm.trace needs to install the module, and profile it',
  'for some modules, this can take a little time',
  'after that, we can read the result from a cache',
  'you should checkout out npm.im/require-so-slow to learn more',
  'we made this at google to make it easier to profile cold start',
  'you may be surprised at long some modules take to load',
  'developers hate this one weird trick that makes start time better',
  'if it has taken this long, something probably went wrong',
  'I\'m sort of running out of things to say',
  'can you make sure the npm module actually exists?'
];
let messageIdx = 0;
const messageInterval = setInterval(() => {
  if (messageIdx < messages.length) {
    message.innerText = messages[messageIdx];
    messageIdx++;
  }
}, 4000);

// trace viewer
const container = document.createElement('track-view-container');
container.id = 'track_view_container';
const viewer = document.createElement('tr-ui-timeline-view');
viewer.track_view_container = container;
Polymer.dom(viewer).appendChild(container);
viewer.id = 'trace-viewer';
viewer.globalMode = true;
Polymer.dom(main).appendChild(viewer);
const model = new tr.Model();
async function getTrace () {
  const url = `/api${window.location.pathname}`;
  const res = await fetch(url);
  if (res.status !== 200) {
    return showError();
  }
  const traceData = await res.json();
  if (traceData.error || traceData.data.length === 0) {
    showError();
    return;
  }
  showTrace(traceData.data);
}

getTrace().catch(console.error);

async function showTrace (data) {
  const i = new tr.importer.Import(model);
  await i.importTracesWithProgressDialog([data]);
  viewer.model = model;
  clearInterval(messageInterval);
  spinny.classList.add('fadeout');
  setTimeout(() => {
    spinny.style.display = 'none';
  }, 1000);
}

function showError () {
  main.style.display = 'none';
  spinny.style.display = 'none';
  problem.style.display = 'block';
}

// footer
const trend = document.getElementById('trend');
trend.setAttribute('href', `/trend/${packageName}`);
const select = document.getElementById('versions');
select.onchange = evt => {
  const version = evt.target.value;
  window.location.href = `/packages/${packageName}/${version}`;
};
async function getVersions () {
  const res = await fetch(`/api/versions/${packageName}`);
  const { versions } = await res.json();
  versions.forEach(version => {
    const o = document.createElement('option');
    o.value = version;
    o.textContent = version;
    if (version === packageVersion) {
      o.selected = true;
    }
    select.appendChild(o);
  });
}
getVersions().catch(console.error);
