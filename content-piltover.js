(function () {
  function getDeckId() {
    const match = window.location.pathname.match(/\/decks\/view\/([^/?#]+)/);
    return match?.[1] ?? null;
  }

  function addButton() {
    if (document.getElementById('deck-bridge-btn')) return;

    const anchor = document.querySelector('button[aria-label="Deck options"]');
    if (!anchor) return;

    const deckId = getDeckId();
    if (!deckId) return;

    const btn = document.createElement('button');
    btn.id = 'deck-bridge-btn';
    btn.textContent = 'Send to TCG-Arena →';
    btn.style.cssText = [
      'display:inline-flex',
      'align-items:center',
      'padding:0 10px',
      'height:' + anchor.offsetHeight + 'px',
      'background:#3b82f6',
      'color:#fff',
      'border:none',
      'border-radius:6px',
      'cursor:pointer',
      'font-size:13px',
      'font-weight:500',
      'font-family:inherit',
      'white-space:nowrap',
      'margin-right:6px',
    ].join(';');

    btn.addEventListener('mouseenter', () => (btn.style.background = '#2563eb'));
    btn.addEventListener('mouseleave', () => (btn.style.background = '#3b82f6'));

    btn.addEventListener('click', () => {
      const deckName = encodeURIComponent(document.querySelector('h1')?.textContent?.trim() || '');
      window.open(
        `https://piltoverarchive.com/deckbuilder?edit=${deckId}&deckbridge=1&deckname=${deckName}`,
        '_blank'
      );
    });

    anchor.parentElement.insertBefore(btn, anchor);
  }

  addButton();

  const observer = new MutationObserver(addButton);
  observer.observe(document.body, { childList: true, subtree: true });
})();
