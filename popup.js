const thenable = (then) => ({ then });

async function storageSet(items) {
  return await thenable((resolve) => chrome.storage.local.set(items, resolve));
}

async function storageGet(keys) {
  return await thenable((resolve) => chrome.storage.local.get(keys, resolve));
}

function lerp(a1, a2, t) {
  return a1.map((c1, idx) => {
    const c2 = a2[idx];
    const d = c2 - c1;
    return d * t + c1;
  });
}

async function init() {
  const inputEl = document.getElementById('input');
  const midiEventsEl = document.getElementById('midi-events');

  midiEventsEl.width = midiEventsEl.clientWidth;
  midiEventsEl.height = midiEventsEl.clientHeight;

  let lastMidiEventDrawnAt = null;
  let lastMidiEventReceivedAt = null;

  function draw(t) {
    const EVENT_MAX_AGE = 250;
    const EVENT_OFF_COLOR = [0, 0, 0];
    const EVENT_ON_COLOR = [153, 255, 51];

    requestAnimationFrame(draw);

    if (lastMidiEventReceivedAt === null) {
      return;
    }

    if (lastMidiEventDrawnAt === null) {
      lastMidiEventDrawnAt = lastMidiEventReceivedAt;
      return;
    }

    const ctx = midiEventsEl.getContext('2d');

    ctx.clearRect(0, 0, midiEventsEl.width, midiEventsEl.height);

    const elapsed = lastMidiEventReceivedAt - lastMidiEventDrawnAt;
    const fade = elapsed <= EVENT_MAX_AGE ? (1 - elapsed / EVENT_MAX_AGE) : 0;

    ctx.fillStyle = `rgb(${lerp(EVENT_OFF_COLOR, EVENT_ON_COLOR, fade)})`;
    ctx.fillRect(0, 0, midiEventsEl.width, midiEventsEl.height);

    lastMidiEventDrawnAt = lastMidiEventReceivedAt;
  }

  requestAnimationFrame(draw);

  const { gotMidiAccess, inputs, selectedInputId } = await storageGet([ 'gotMidiAccess', 'inputs', 'selectedInputId' ]);

  console.log('Got MIDI access:', gotMidiAccess);

  if (inputs instanceof Array) {
    inputs.forEach(({ id, name, manufacturer }) => {
      inputEl.innerHTML += `<option value="${id}">${name} by ${manufacturer}</option>`;
    });
  }

  inputEl.value = selectedInputId || "";

  inputEl.addEventListener('change', async () => {
    const selectedInputId = inputEl.value;
    await storageSet({ selectedInputId });
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.midiMessage) {

      lastMidiEventReceivedAt = message.midiMessage.ts;
    }
  });
}

init();
