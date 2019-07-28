let settings = {};

let midiActivityPort = null;
const externalPorts = [];

async function updateInputs(access) {
  const inputs = [];

  for (let input of access.inputs.values()) {
    const id = input.id.toString();
    const { name, manufacturer } = input;

    inputs.push({ id, name, manufacturer });

    if (id === settings.selectedInputId) {
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

        if (midiActivityPort) {
          midiActivityPort.postMessage({ type: 'midi', data: { channel, timeStamp } });
        }

        const warp = {
          sin: 1 + ((note - 128) / 128),
          cos: 1 + ((velocity - 128) / 128),
          time: 1
        };
        // @todo send timeStamp as well?

        externalPorts.forEach((port) => {
          port.postMessage({ type: 'warp', data: warp });
        });
      };
    } else {
      input.onmidimessage = null;
    }
  }

  await storage.set({ inputs });
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

    settings = await storage.get([ 'selectedInputId' ]);
    await storage.set({ gotMidiAccess: true });

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

    storage.subscribe(({ selectedInputId }) => {
      if (selectedInputId) {
        settings.selectedInputId = selectedInputId.newValue;
        // @todo just unsubsribe from old, subscribe to new
        updateInputs(access);
      }
    });
  } catch (error) {
    console.log('Could not get MIDI access', error);
    await storage.set({ gotMidiAccess: false });
  }
});

chrome.runtime.onConnect.addListener((port) => {
  console.log('Internal port connected');

  if (port.name === 'midi-activity') {
    midiActivityPort = port;
  }

  port.onDisconnect.addListener(() => {
    console.log('Internal port disconnected');
    midiActivityPort = null;
  });
});

chrome.runtime.onConnectExternal.addListener((port) => {
  console.log('External port connected');
  externalPorts.push(port);

  port.onDisconnect.addListener(() => {
    console.log('External port disconnected');
    externalPorts.splice(externalPorts.indexOf(port), 1);
  });
});
