const main = document.getElementById('main');
const form = document.getElementById('form');
const search = document.getElementById('search');
const spinny = document.getElementById('spinframe');
const message = document.getElementById('message');
const problem = document.getElementById('problem');
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
const container = document.createElement('track-view-container');
container.id = 'track_view_container';
viewer = document.createElement('tr-ui-timeline-view');
viewer.track_view_container = container;
Polymer.dom(viewer).appendChild(container);
viewer.id = 'trace-viewer';
viewer.globalMode = true;
Polymer.dom(main).appendChild(viewer);
const model = new tr.Model();
async function getTrace() {
  const url = `/api${window.location.pathname}`;
  const res = await fetch(url);
  if (res.status !== 200) {
    return showError();
  }
  const data = await res.json();
  if (data.type === 'job') {
    pollJob(data.id);
  } else {
    showTrace(data);
  }
}

async function pollJob(id) {
  const res = await fetch(`/api/job/${id}`);
  const job = await res.json();
  console.log(job);
  switch (job.status) {
    case 'COMPLETE':
      showTrace(job.payload);
      break;
    case 'ERROR':
      console.error(job.payload);
      showError();
      break;
    case 'RUNNING':
      setTimeout(async () => {
        await pollJob(id);
      }, 1000);
      break;
  }
}

getTrace().catch(console.error);

async function showTrace(data) {
  const i = new tr.importer.Import(model);
  await i.importTracesWithProgressDialog([data]);
  viewer.model = model;
  clearInterval(messageInterval);
  spinny.classList.add('fadeout');
  setTimeout(() => {
    spinny.style.display = 'none';
  }, 1000);
}

function showError() {
  main.style.display = 'none';
  spinny.style.display = 'none';
  problem.style.display = 'block';
}

form.onsubmit = e => {
  if (search.value !== '') {
    window.location.href = `${window.location.origin}/packages/${search.value}`;
  }
  e.preventDefault();
};
const packageName = window.location.pathname.split('/').filter(x => !!x).slice(1, -1).join('/');
search.placeholder = packageName;
