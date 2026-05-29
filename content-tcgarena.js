(function () {
  chrome.runtime.sendMessage({ type: 'GET_DECK' }, (response) => {
    if (chrome.runtime.lastError || !response?.deck) return;

    const deckText = response.deck;
    const deckName = response.name || '';

    function waitFor(fn, timeout = 8000) {
      return new Promise((resolve, reject) => {
        const result = fn();
        if (result) return resolve(result);
        const deadline = Date.now() + timeout;
        const observer = new MutationObserver(() => {
          const result = fn();
          if (result) { observer.disconnect(); resolve(result); }
          else if (Date.now() > deadline) { observer.disconnect(); reject(new Error('Timed out waiting for: ' + fn.toString().slice(0, 80))); }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      });
    }

    function showNotice(msg, color) {
      const notice = document.createElement('div');
      notice.textContent = msg;
      notice.style.cssText = [
        'position:fixed', 'bottom:20px', 'right:20px',
        'background:' + color, 'color:#fff',
        'padding:10px 16px', 'border-radius:8px',
        'font-size:13px', 'font-weight:500', 'font-family:inherit',
        'z-index:99999', 'box-shadow:0 2px 8px rgba(0,0,0,.2)',
        'pointer-events:none',
      ].join(';');
      document.body.appendChild(notice);
      setTimeout(() => notice.remove(), 3000);
    }

    function findEditButton() {
      for (const box of document.querySelectorAll('.deckbox')) {
        const nameEl = box.querySelector('h3.text-start');
        if (nameEl?.textContent.trim() === deckName) {
          return Array.from(box.querySelectorAll('button.btn-primary'))
            .find(b => b.textContent.trim() === 'Edit deck') || null;
        }
      }
      return null;
    }

    // Auto-dismiss backup conflict dialog
    const keepLocalObserver = new MutationObserver(() => {
      const btn = Array.from(document.querySelectorAll('button'))
        .find(b => b.textContent.includes('Keep local'));
      if (btn) { keepLocalObserver.disconnect(); btn.click(); }
    });
    keepLocalObserver.observe(document.documentElement, { childList: true, subtree: true });

    async function run() {
      const onDeckEditor = () => /\/deck\/[\w-]+/.test(window.location.pathname);

      if (!onDeckEditor()) {
        await waitFor(() =>
          Array.from(document.querySelectorAll('button'))
            .find(b => b.textContent.trim() === 'Create deck')
        );
        await new Promise(r => setTimeout(r, 1000));

        const editBtn = findEditButton();

        if (editBtn) {
          editBtn.click();
          showNotice('Updating existing deck…', '#3b82f6');
          await waitFor(() => onDeckEditor(), 10000);
          await new Promise(r => setTimeout(r, 800));
        } else {
          const createBtn = Array.from(document.querySelectorAll('button'))
            .find(b => b.textContent.trim() === 'Create deck');
          createBtn.click();
          const nameInput = await waitFor(() => document.getElementById('deck-title'));
          nameInput.value = deckName;
          nameInput.dispatchEvent(new Event('input', { bubbles: true }));
          nameInput.dispatchEvent(new Event('change', { bubbles: true }));
          const confirmBtn = await waitFor(() =>
            Array.from(document.querySelectorAll('button.btn-primary'))
              .find(b => b.textContent.trim() === 'Create deck')
          );
          confirmBtn.click();
          showNotice('Creating new deck…', '#3b82f6');
        }
      } else {
        showNotice('Updating existing deck…', '#3b82f6');
      }

      const importBtn = await waitFor(() =>
        Array.from(document.querySelectorAll('button'))
          .find(b => b.textContent.trim() === 'Import')
      , 15000);
      importBtn.click();
      await new Promise(r => setTimeout(r, 800));

      const ta = await waitFor(() => document.getElementById('import-decklist'), 10000);
      ta.value = deckText;
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(r => setTimeout(r, 300));

      const importReplaceBtn = await waitFor(() =>
        Array.from(document.querySelectorAll('button'))
          .find(b => b.textContent.trim() === 'Import and replace')
      , 10000);
      importReplaceBtn.click();
      await new Promise(r => setTimeout(r, 800));

      // Save is optional — only appears if the deck actually changed
      try {
        const saveBtn = await waitFor(() =>
          Array.from(document.querySelectorAll('button.btn-secondary'))
            .find(b => b.textContent.trim() === 'Save')
        , 4000);
        saveBtn.click();
      } catch (e) { /* no changes, nothing to save */ }

      showNotice('✓ Deck imported from Piltover Archive', '#22c55e');
      setTimeout(() => { window.location.href = 'https://tcg-arena.fr/play'; }, 500);
    }

    run().catch(err => {
      showNotice('Deck Bridge failed: ' + err.message, '#ef4444');
    });
  });
})();
