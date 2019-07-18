const thenable = (then) => ({ then });

async function storageSet(items) {
  return await thenable((resolve) => chrome.storage.local.set(items, resolve));
}

async function storageGet(keys) {
  return await thenable((resolve) => chrome.storage.local.get(keys, resolve));
}

const out = document.getElementById('out');

function output(...args) {
  out.innerHTML += args.join(' ') + '\n';
}

async function init() {
  const { gotMidiAccess, inputs } = await storageGet([ 'gotMidiAccess', 'inputs' ]);

  output('Got MIDI access:', gotMidiAccess);

  const inputEl = document.getElementById('input');

  if (inputs instanceof Array) {
    inputs.forEach(({ id, name, manufacturer }) => {
      inputEl.innerHTML += `<option value="${id}">${name} by ${manufacturer}</option>`;
    });
  }
}

init();
