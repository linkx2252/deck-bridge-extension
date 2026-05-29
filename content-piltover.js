(function () {
  function addButton() {
    if (document.getElementById('deck-bridge-btn')) return;

    const anchor = document.querySelector('button[aria-label="Deck options"]');
    if (!anchor) return;

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

    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = 'Reading deck…';
      try {
        const legendH3 = Array.from(document.querySelectorAll('h3'))
          .find(h => h.textContent.trim() === 'Legend');
        if (!legendH3) throw new Error('Could not find deck section on page.');
        const container = legendH3.parentElement?.parentElement?.parentElement;
        if (!container) throw new Error('Could not find deck container.');

        // --- Legend card name from img alt ---
        const legendSection = legendH3.parentElement?.parentElement;
        const legendCard = legendSection?.querySelector('img')?.alt || '';

        // --- Champion: the (Chosen) card in main deck ---
        // --- Rune type names from img alts ---
        const runesH3 = Array.from(document.querySelectorAll('h3'))
          .find(h => h.textContent.trim() === 'Runes');
        const runesSection = runesH3?.parentElement?.parentElement;
        const runeImgs = Array.from(runesSection?.querySelectorAll('img') || []);
        const runeTypes = runeImgs.map(img => img.alt).filter(Boolean);

        // --- Parse the raw text for all other sections ---
        const raw = container.innerText;
        const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

        const SECTION_MAP = {
          'LEGEND': 'Legend',
          'MAIN DECK': 'MainDeck',
          'BATTLEFIELDS': 'Battlefields',
          'RUNES': 'Runes',
          'SIDEBOARD': 'Sideboard',
        };
        const SECTION_KEYS = Object.keys(SECTION_MAP);
        const SKIP = /^(DECK|\d+\s*cards?|Energy|\+\d+|\d+\/\d+|\d+)$/i;

        const sections = { 'LEGEND': [], 'MAIN DECK': [], 'BATTLEFIELDS': [], 'RUNES': [], 'SIDEBOARD': [], 'CHAMPION': [] };
        let currentSection = null;

        for (const line of lines) {
          const sectionKey = SECTION_KEYS.find(k => line.toUpperCase() === k);
          if (sectionKey) { currentSection = sectionKey; continue; }
          if (!currentSection) continue;
          if (SKIP.test(line)) continue;

          // Rune counts like ×7
          const runeMatch = line.match(/^[\u00d7x](\d+)$/);
          if (runeMatch) {
            sections['RUNES'].push({ rune: true, count: parseInt(runeMatch[1]) });
            continue;
          }

          // Chosen champion — split into Champion section
          if (line.includes('(Chosen)')) {
            const name = line.replace(/\s*\(Chosen\)\s*$/, '').trim();
            sections['CHAMPION'].push(name);
            continue;
          }

          sections[currentSection].push(line);
        }

        function countCards(arr) {
          const counts = {};
          const order = [];
          for (const name of arr) {
            if (!counts[name]) { counts[name] = 0; order.push(name); }
            counts[name]++;
          }
          return order.map(name => `${counts[name]} ${name}`);
        }

        const out = [];

        // Legend
        if (legendCard) { out.push('Legend:'); out.push('1 ' + legendCard); }

        // Champion (Chosen)
        if (sections['CHAMPION'].length) {
          out.push('');
          out.push('Champion:');
          countCards(sections['CHAMPION']).forEach(l => out.push(l));
        }

        // MainDeck
        if (sections['MAIN DECK'].length) {
          out.push('');
          out.push('MainDeck:');
          countCards(sections['MAIN DECK']).forEach(l => out.push(l));
        }

        // Battlefields
        if (sections['BATTLEFIELDS'].length) {
          out.push('');
          out.push('Battlefields:');
          countCards(sections['BATTLEFIELDS']).forEach(l => out.push(l));
        }

        // Runes
        const runeCounts = sections['RUNES'].filter(e => e.rune);
        if (runeCounts.length) {
          out.push('');
          out.push('Runes:');
          runeTypes.forEach((type, i) => {
            if (runeCounts[i]) out.push(`${runeCounts[i].count} ${type}`);
          });
        }

        // Sideboard
        if (sections['SIDEBOARD'].length) {
          out.push('');
          out.push('Sideboard:');
          countCards(sections['SIDEBOARD']).forEach(l => out.push(l));
        }

        const deckText = out.join('\n');
        if (!deckText.trim()) throw new Error('Failed to parse deck from page.');

        const deckName = document.querySelector('h1')?.textContent?.trim() || '';

        await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({ type: 'STORE_DECK', deck: deckText, name: deckName }, () => {
            if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
            resolve();
          });
        });

        window.location.href = 'https://tcg-arena.fr/decks';
      } catch (err) {
        btn.disabled = false;
        btn.textContent = 'Send to TCG-Arena →';
        alert('Deck Bridge: failed to read deck.\n\n' + err.message);
      }
    });

    anchor.parentElement.insertBefore(btn, anchor);
  }

  addButton();

  const observer = new MutationObserver(addButton);
  observer.observe(document.body, { childList: true, subtree: true });
})();
