const search = document.getElementById('search');
search.onkeyup = e => {
  if (e.keyCode === 13) {
    trace();
  }
};

const submit = document.getElementById('submit');
submit.onkeyup = e => {
  if (e.keyCode === 13) {
    trace();
  }
};
submit.onclick = e => {
  trace();
};

function trace () {
  if (search.value !== '') {
    let route = search.value;
    if (route.indexOf('@') > 0) {
      if (route[0] === '@') {
        route = '@' + route.slice(1).split('@').join('/');
      } else {
        route = route.split('@').join('/');
      }
    }
    window.location.href = `packages/${route}`;
  }
}
