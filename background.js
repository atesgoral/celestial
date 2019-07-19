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

      // @todo actually interpret MIDI messages

      // @todo send to popup port only?
      chrome.runtime.sendMessage({ type: 'midiMessage', data: { timeStamp } });

      // @todo extremely rudimentary interpretation of MIDI bytes
      const warp = {
        sin: status / 256,
        cos: data1 / 256,
        time: data2 / 256
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
