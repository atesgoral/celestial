const thenable = (then) => ({ then });

async function storageSet(items) {
  return await thenable((resolve) => chrome.storage.local.set(items, resolve));
}

async function storageGet(keys) {
  return await thenable((resolve) => chrome.storage.local.get(keys, resolve));
}

const externalPorts = [];

async function updateInputs(access) {
  const inputs = [];

  for (let input of access.inputs.values()) {
    const { id, name, manufacturer } = input;

    inputs.push({ id, name, manufacturer });

    input.onmidimessage = (message) => {
      const { timeStamp } = message;
      const [ status, data1, data2 ] = message.data;
      const channel = status & 0x0f;
      const note = data1;
      const velocity = data2;

      switch (status & 0xf0) {
      case 0x80:
        // Note off
        break;
      case 0x90:
        // Note on
        break;
      case 0xa0:
        // Polyphonic key pressure
        break;
      case 0xb0:
        // Control change
        break;
      case 0xc0:
        // Program change
        break;
      case 0xd0:
        // Channel pressure
        break;
      case 0xe0:
        // Pitch bend
        break;
      case 0xf0:
        // System message
        return;
      }

      // @todo send to popup port only?
      chrome.runtime.sendMessage({ type: 'midi', data: { channel, timeStamp } });

      // @todo extremely rudimentary interpretation of MIDI bytes
      const warp = {
        sin: 1 + ((note - 128) / 128),
        cos: 1 + ((velocity - 128) / 128),
        time: 1
      };

      externalPorts.forEach((port) => {
        port.postMessage({ type: 'warp', data: warp });
      });
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

// chrome.runtime.onMessage.addListener(async (message) => {
//   if (message === 'enableOnActiveTab') {
//     chrome.tabs.executeScript({
//       file: 'content.js'
//     });
//   }
// });

chrome.runtime.onConnectExternal.addListener((port) => {
    console.log('External port connected');
    externalPorts.push(port);

    port.onDisconnect.addListener(() => {
      console.log('External port disconnected');
      externalPorts.splice(externalPorts.indexOf(port), 1);
    });
});
