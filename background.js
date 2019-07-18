const thenable = (then) => ({ then });

async function storageSet(items) {
  return await thenable((resolve) => chrome.storage.local.set(items, resolve));
}

async function storageGet(keys) {
  return await thenable((resolve) => chrome.storage.local.get(keys, resolve));
}

async function handlePortConnected(access, port) {
  console.log(port.name, port.manufacturer, port.state);

  const inputs = [];

  for (let input of access.inputs.values()) {
    // console.log('MIDI input:', input);

    const { id, name, manufacturer } = input;

    inputs.push({ id, name, manufacturer });
    // input.onmidimessage = (message) => {
    //   const [command, note, velocity] = message.data;

    //   midiMessages.push({
    //     t: performance.now(),
    //     command,
    //     note,
    //     velocity
    //   });

    //   switch (command) {
    //   case 0x90: // Note on
    //     // console.log('Note on', note, velocity);
    //     break;
    //   case 0x100: // Note off
    //     break;
    //   }
    // };
  }

  await storageSet({ inputs });
}

async function handlePortDisconnected(access, port) {
  console.log(port.name, port.manufacturer, port.state);
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
