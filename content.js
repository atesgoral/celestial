const tap = ({ extensionId }) => {
  console.log('Tapping!');

  const { sin, cos } = Math;
  const { requestAnimationFrame } = window;

  let midiNotes = [];
  let lastEventTimeStamp = null;

  Math.sin = (a) => {
    return sin(a);
  };
    // const note = a % (Math.PI * 2)
    //sin(a) * warp.sin;
  Math.cos = (a) => {
    return cos(a);
  };

  window.requestAnimationFrame = (callback) => {
    return requestAnimationFrame((t) => {
      callback(t);
    });
  };

  const port = chrome.runtime.connect(extensionId);

  port.onMessage.addListener((message) => {
    switch (message.type) {
    case 'notes':
      let { midiNotes, lastEventTimeStamp } = message.data;
      break;
    }
  });
};

const config = { extensionId: chrome.runtime.id };

const script = document.createElement('script');

script.textContent = `(${tap})(${JSON.stringify(config)})`;
(document.head || document.documentElement).appendChild(script);
script.remove();
