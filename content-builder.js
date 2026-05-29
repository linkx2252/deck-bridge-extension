(function () {
  if (!new URLSearchParams(window.location.search).has('deckbridge')) return;

  const deckName = new URLSearchParams(window.location.search).get('deckname') || '';

  function waitFor(fn, timeout = 8000) {
    return new Promise((resolve, reject) => {
      const result = fn();
      if (result) return resolve(result);
      const deadline = Date.now() + timeout;
      const observer = new MutationObserver(() => {
        const result = fn();
        if (result) { observer.disconnect(); resolve(result); }
        else if (Date.now() > deadline) { observer.disconnect(); reject(new Error('Timed out')); }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  async function runExport() {
    // Wait for SPA to finish redirecting (strips deckbridge params, adds tab=maindeck)
    await new Promise((resolve) => {
      const check = () => new URLSearchParams(window.location.search).has('tab');
      if (check()) return resolve();
      const interval = setInterval(() => { if (check()) { clearInterval(interval); resolve(); } }, 100);
      setTimeout(() => { clearInterval(interval); resolve(); }, 5000);
    });
    await new Promise(r => setTimeout(r, 1000));

    const exportBtn = await waitFor(() => document.querySelector('button[title="Export deck"]'));
    await new Promise(r => setTimeout(r, 500));
    exportBtn.click();

    const textTab = await waitFor(() =>
      document.querySelector('button[role="tab"][aria-controls$="-content-text"]') ||
      Array.from(document.querySelectorAll('button[role="tab"]')).find(el => el.textContent.trim() === 'Text')
    );
    await new Promise(r => setTimeout(r, 800));
    textTab.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, isPrimary: true }));
    textTab.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    textTab.dispatchEvent(new MouseEvent('mouseup',   { bubbles: true, cancelable: true }));
    textTab.dispatchEvent(new MouseEvent('click',     { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 500));

    const ta = await waitFor(() => {
      const panel = document.querySelector('[id$="-content-text"]');
      const el = panel?.querySelector('textarea');
      return (el && el.value.trim().length > 0) ? el : null;
    });

    const text = ta.value.trim();

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('STORE_DECK timed out')), 5000);
      chrome.runtime.sendMessage({ type: 'STORE_DECK', deck: text, name: deckName }, () => {
        clearTimeout(timeout);
        if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
        window.location.href = 'https://tcg-arena.fr/decks';
        resolve();
      });
    });
  }

  runExport().catch(err => {
    alert('Deck Bridge: export failed. Please try again.\n\n' + err.message);
  });
})();
