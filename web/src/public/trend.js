const main = document.getElementById('main');
const form = document.getElementById('form');
const search = document.getElementById('search');
const spinny = document.getElementById('spinframe');
const message = document.getElementById('message');
const problem = document.getElementById('problem');
const graph = document.getElementById('graph')
const messages = [
  'this could take a little while.',
  'npm.trace needs to install every version of this module available',
  'then, we need to go profile it',
  'for some modules, this can take a little time',
  'after that, we can read the result from a cache',
  'you should checkout out npm.im/require-so-slow to learn more',
  'we made this at google to make it easier to profile cold start',
  'you may be surprised at long some modules take to load',
  'it\s especially nice for seeing your progress over time',
  'sometimes, you may get an outlier',
  'so it goes with profiling in the cloud :shrugs:',
  'well, I\'ve run out of things to say',
  'this is starting to get a little bit awkward',
  'just wait here for a few minutes',
  'I\'m like 90% sure this will return data eventually',
  'and if it doesn\'t, you can always refresh',
  'really this is it',
  'data coming fresh and hot, like really soon'
];
const packageName = window.location.pathname.split('/').filter(x => !!x).slice(1).join('/');
search.placeholder = packageName;

let messageIdx = 0;
const messageInterval = setInterval(() => {
  if (messageIdx < messages.length) {
    message.innerText = messages[messageIdx];
    messageIdx++;
  }
}, 4000);

async function getTrace() {
  const url = `/api${window.location.pathname}`;
  const res = await fetch(url);
  if (res.status !== 200) {
    return showError();
  }
  const data = await res.json();
  console.log(data);
  google.charts.load('current', {packages: ['corechart', 'line']});
  google.charts.setOnLoadCallback(() => {
    showTrace(data);
  });
}

getTrace().catch(console.error);

async function showTrace(data) {
  const table = new google.visualization.DataTable();
  table.addColumn('string', 'X');
  table.addColumn('number', 'duration');
  table.addRows(data.traces.map(r => [r.version, r.duration/1000]));
  const options = {
    hAxis: {
      title: 'Version'
    },
    vAxis: {
      title: 'Duration (ms)'
    },
    series: {
      1: {curveType: 'function'}
    }
  };
  const chart = new google.visualization.LineChart(graph);
  chart.draw(table, options);

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

