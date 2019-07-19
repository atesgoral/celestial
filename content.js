document.body.setAttribute('injected', 'true');

const port = chrome.runtime.connect({ name: 'celestial-content' });

port.onMessage.addListener((message) => {
  console.log('Got msg', message);
});
