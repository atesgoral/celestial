const storage = {
  async set(items) {
    return await thenable((resolve) => chrome.storage.local.set(items, resolve));
  },
  async get(keys) {
    return await thenable((resolve) => chrome.storage.local.get(keys, resolve));
  }
};
