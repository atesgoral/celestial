const tap = ({ extensionId }) => {
  console.log('Tapping!');

  const { sin, cos } = Math;

  let warp = { sin: 1, cos: 1, time: 1 };

  Math.sin = (a) => sin(a) * warp.sin;
  Math.cos = (a) => cos(a) * warp.cos;

  const port = chrome.runtime.connect(extensionId);

  port.onMessage.addListener((message) => {
    switch (message.type) {
    case 'warp':
      warp = message.data;
      break;
    }
  });
};

const config = { extensionId: chrome.runtime.id };

const script = document.createElement('script');

script.textContent = `(${tap})(${JSON.stringify(config)})`;
(document.head || document.documentElement).appendChild(script);
script.remove();
