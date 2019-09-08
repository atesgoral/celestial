let settings = {};

// @todo may not need dedicated port
let midiActivityPort = null;
const externalPorts = [];

const midiNotes = Array(128).fill().map((_, idx) => ({
  isOn: false,
  onVelocity: 0,
  offVelocity: 0,
  onTimeStamp: null,
  offTimeStamp: null
}));

let lastMidiEventTimeStamp = null;

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

        lastMidiEventTimeStamp = timeStamp;

        switch (status & 0xf0) {
        case 0x80:
          // Note off
          midiNotes[note].isOn = false;
          midiNotes[note].offVelocity = velocity;
          midiNotes[note].offTimeStamp = timeStamp;
          break;
        case 0x90:
          // Note on
          midiNotes[note].isOn = true;
          midiNotes[note].onVelocity = velocity;
          midiNotes[note].onTimeStamp = timeStamp;
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

        externalPorts.forEach((port) => {
          port.postMessage({ type: 'notes', data: { midiNotes, lastMidiEventTimeStamp } });
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

  externalPorts.push(port);

  port.onDisconnect.addListener(() => {
    console.log('Internal port disconnected');
    midiActivityPort = null;
    externalPorts.splice(externalPorts.indexOf(port), 1);
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
