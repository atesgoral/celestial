const thenable = (then) => ({ then });

async function storageSet(items) {
  return await thenable((resolve) => chrome.storage.local.set(items, resolve));
}

async function storageGet(keys) {
  return await thenable((resolve) => chrome.storage.local.get(keys, resolve));
}

const contentPorts = [];

async function updateInputs(access) {
  const inputs = [];

  for (let input of access.inputs.values()) {
    // console.log('MIDI input:', input);

    const { id, name, manufacturer } = input;

    inputs.push({ id, name, manufacturer });

    input.onmidimessage = (message) => {
      const [command, note, velocity] = message.data;
      const ts = performance.now();

      // @todo send to celestial-popup port only?
      chrome.runtime.sendMessage({ midiMessage: { command, note, velocity, ts } });

      contentPorts.forEach((port) => {
        port.postMessage({ midiMessage: { command, note, velocity, ts } });
      });
      // midiMessages.push({
      //   t: performance.now(),
      //   command,
      //   note,
      //   velocity
      // });

      // switch (command) {
      // case 0x90: // Note on
      //   // console.log('Note on', note, velocity);
      //   break;
      // case 0x100: // Note off
      //   break;
      // }
    };
  }

  await storageSet({ inputs });
}

async function handlePortConnected(access, port) {
  console.log(port.name, port.manufacturer, port.state);
  await updateInputs(access);
}

async function handlePortDisconnected(access, port) {
  console.log(port.name, port.manufacturer, port.state);
  await updateInputs(access);
}

chrome.runtime.onInstalled.addListener(async () => {
  try {
    const access = await navigator.requestMIDIAccess();

    console.log('Got MIDI access');
    await storageSet({ gotMidiAccess: true });

    access.onstatechange = (event) => {
      switch (event.port.state) {
      case 'connected':
        handlePortConnected(access, event.port);
        break;
      case 'disconnected':
        handlePortDisconnected(access, event.port);
        break;
      }
    };
  } catch (error) {
    console.log('Could not get MIDI access', error);
    await storageSet({ gotMidiAccess: false });
  }
});

chrome.runtime.onMessage.addListener(async (message) => {
  if (message === 'enableOnActiveTab') {
    chrome.tabs.executeScript({
      file: 'content.js'
    });
  }
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'celestial-content') {
    console.log('Content port connected');
    contentPorts.push(port);

    port.onDisconnect.addListener(() => {
      console.log('Content port disconnected');
      contentPorts.splice(contentPorts.indexOf(port), 1);
    });
  }
});
