const search = document.getElementById('search');
search.onkeyup = e => {
  if (e.keyCode == 13) {
    trace();
  }
};

const submit = document.getElementById('submit');
submit.onkeyup = e => {
  if (e.keyCode == 13) {
    trace();
  }
};
submit.onclick = e => {
  trace();
};

function trace() {
  if (search.value != '') {
    window.location.href = `packages/${search.value}`;
  }
}
