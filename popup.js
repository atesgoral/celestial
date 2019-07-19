const thenable = (then) => ({ then });

async function storageSet(items) {
  return await thenable((resolve) => chrome.storage.local.set(items, resolve));
}

async function storageGet(keys) {
  return await thenable((resolve) => chrome.storage.local.get(keys, resolve));
}

async function init() {
  const midiInputEl = document.getElementById('midi-input');
  const midiEventsEl = document.getElementById('midi-events');

  midiEventsEl.width = midiEventsEl.clientWidth;
  midiEventsEl.height = midiEventsEl.clientHeight;

  const midiChannels = Array(16).fill().map(() => ({
    lastMidiEventDrawnAt: null,
    lastMidiEventReceivedAt: null
  }));

  function draw(t) {
    const EVENT_MAX_AGE = 1000 / 60;
    const EVENT_OFF_COLOR = [0, 0, 0];
    const EVENT_ON_COLOR = [153, 255, 51];

    requestAnimationFrame(draw);

    const ctx = midiEventsEl.getContext('2d');

    ctx.clearRect(0, 0, midiEventsEl.width, midiEventsEl.height);

    midiChannels.forEach((channel, idx) => {
      let hasRecentMidiEvent = false;

      if (channel.lastMidiEventReceivedAt !== null) {
        const elapsed = channel.lastMidiEventReceivedAt - channel.lastMidiEventDrawnAt;
        hasRecentMidiEvent = elapsed <= EVENT_MAX_AGE;
      }

      ctx.fillStyle = `rgb(${hasRecentMidiEvent ? EVENT_ON_COLOR : EVENT_OFF_COLOR})`;
      ctx.fillRect(idx * 17, 0, 16, 16);

      channel.lastMidiEventDrawnAt = channel.lastMidiEventReceivedAt;
    });
  }

  requestAnimationFrame(draw);

  const { gotMidiAccess, inputs, selectedInputId } = await storageGet([ 'gotMidiAccess', 'inputs', 'selectedInputId' ]);

  console.log('Got MIDI access:', gotMidiAccess);

  if (inputs instanceof Array) {
    inputs.forEach(({ id, name, manufacturer }) => {
      midiInputEl.innerHTML += `<option value="${id}">${name} by ${manufacturer}</option>`;
    });
  }

  midiInputEl.value = selectedInputId || "";

  midiInputEl.addEventListener('change', async () => {
    const selectedInputId = midiInputEl.value;
    await storageSet({ selectedInputId });
  });

  chrome.runtime.onMessage.addListener((message) => {
    switch (message.type) {
    case 'midi':
      const { channel, timeStamp } = message.data;
      console.log(channel);
      midiChannels[channel].lastMidiEventReceivedAt = timeStamp;
      break;
    }
  });
}

init();
