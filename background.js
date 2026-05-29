chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'STORE_DECK') {
    chrome.storage.local.set({ deckBridgePending: { deck: msg.deck, name: msg.name } }, () => {
      sendResponse({ ok: true });
    });
    return true;
  }
  if (msg.type === 'GET_DECK') {
    chrome.storage.local.get('deckBridgePending', (result) => {
      chrome.storage.local.remove('deckBridgePending');
      sendResponse(result.deckBridgePending || null);
    });
    return true;
  }
});
