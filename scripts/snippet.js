// UMich Collected Works fetch snippet — run in Chrome DevTools console on any
// quod.lib.umich.edu page after passing the CAPTCHA.
// Downloads individual .txt files for all 18 corpus documents.
//
// For each target, either:
//   directUrl — fetch this known-correct section URL directly (no TOC lookup)
//   vol + pattern — discover the section URL from the volume TOC
//   findLast — pick the LAST TOC match (when an earlier same-named doc would match first)

(async () => {
  async function getHtml(url) {
    const r = await fetch(url, { credentials: 'include', headers: { Accept: 'text/html' } });
    if (!r.ok) throw new Error(`HTTP ${r.status} at ${url}`);
    return new DOMParser().parseFromString(await r.text(), 'text/html');
  }

  // Discover document URL from volume TOC by matching anchor text against pattern.
  // matchIndex: which match to return (0=first, 1=second, -1=last). Default 0.
  async function findInToc(vol, pattern, matchIndex = 0) {
    const tocUrls = [
      `https://quod.lib.umich.edu/l/lincoln/lincoln${vol}`,
      `https://quod.lib.umich.edu/cgi/t/text/text-idx?c=lincoln;cc=lincoln;view=toc;idno=lincoln${vol}`,
    ];
    for (const tocUrl of tocUrls) {
      let dom;
      try { dom = await getHtml(tocUrl); } catch (e) { continue; }
      const matches = [];
      for (const a of dom.querySelectorAll('a[href]')) {
        if (pattern.test(a.textContent.trim())) {
          matches.push(new URL(a.getAttribute('href'), tocUrl).href);
        }
      }
      if (matches.length === 0) continue;
      const idx = matchIndex < 0 ? matches.length + matchIndex : matchIndex;
      if (matches[idx]) return matches[idx];
      // matchIndex out of range — return last available
      return matches[matches.length - 1];
    }
    return null;
  }

  // Extract the document body from a DLXS page.
  // UMich pages put content after the "Pages" section header; strip everything
  // before that and the bottom "Previous Section ◆ Next Section" navigation.
  function extractText(dom) {
    // Try known content selectors first
    for (const sel of ['#TextDiv', '.text', 'div.body', '#content', 'main']) {
      const el = dom.querySelector(sel);
      if (el && el.innerText.trim().length > 200) return cleanDlxs(el.innerText);
    }
    // Fall back: extract "Pages" section from body text
    const body = dom.body.innerText;
    const pagesIdx = body.search(/\bPages\b/);
    if (pagesIdx !== -1) {
      let content = body.slice(pagesIdx + 'Pages'.length);
      const bottomNav = content.search(/\bPrevious Section\b/);
      if (bottomNav !== -1) content = content.slice(0, bottomNav);
      return cleanDlxs(content);
    }
    return cleanDlxs(body);
  }

  function cleanDlxs(text) {
    return text
      .replace(/\d+Jump to section\n?/g, '')       // "1Jump to section" heading artifacts
      .replace(/keyboard_return\s*Return\n?/g, '')  // footnote-back link artifacts
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  async function fetchDoc(startUrl) {
    const visited = new Set();
    let url = startUrl;

    // First page: look for "View Entire Text" to get single-page view
    const firstDom = await getHtml(url);
    visited.add(url);
    for (const a of firstDom.querySelectorAll('a')) {
      if (/view entire|entire text/i.test(a.textContent)) {
        const allUrl = new URL(a.getAttribute('href'), url).href;
        if (!visited.has(allUrl)) {
          await new Promise(r => setTimeout(r, 600));
          const singleDom = await getHtml(allUrl);
          return extractText(singleDom);
        }
      }
    }

    // No single-page view: paginate through all pages
    const pages = [];
    let dom = firstDom;
    while (true) {
      pages.push(extractText(dom));
      let next = null;
      for (const a of dom.querySelectorAll('a')) {
        if (/^next page$|^next$/i.test(a.textContent.trim())) {
          const candidate = new URL(a.getAttribute('href'), url).href;
          if (!visited.has(candidate)) { next = candidate; break; }
        }
      }
      if (!next || visited.size >= 80) break;
      url = next;
      visited.add(url);
      await new Promise(r => setTimeout(r, 700));
      dom = await getHtml(url);
    }
    return pages.join('\n\n--- PAGE BREAK ---\n\n');
  }

  function download(filename, text) {
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }

  const TARGETS = [
    // ── Volume 2 (1848–1858) ──────────────────────────────────────────────
    // Vol. 2 has both a Zachary Taylor and a Henry Clay eulogy; match Clay specifically
    { id: 'doc_003', vol: 2, pattern: /eulogy.*clay|henry.*clay/i },
    // Vol. 2 has three Peoria speeches (1852, 1854, 1856); year not in TOC link text
    // so use matchIndex:1 to get the second match (the Oct 1854 landmark speech)
    { id: 'doc_004', vol: 2, pattern: /peoria/i, matchIndex: 1 },
    { id: 'doc_005', vol: 2, pattern: /house.*divided/i },

    // ── Volume 3 (1858–1860) — Lincoln-Douglas Debates ───────────────────
    // Ottawa & Freeport: hardcoded section IDs verified from prior fetch
    { id: 'doc_006a', directUrl: 'https://quod.lib.umich.edu/l/lincoln/lincoln3/1:1' },
    { id: 'doc_006b', directUrl: 'https://quod.lib.umich.edu/l/lincoln/lincoln3/1:5' },
    // Use ordinal patterns to avoid matching "Notes for the Debate at X" prep docs
    { id: 'doc_006c', vol: 3, pattern: /third.*debate/i },
    { id: 'doc_006d', vol: 3, pattern: /fourth.*debate/i },
    { id: 'doc_006e', vol: 3, pattern: /fifth.*debate/i },
    { id: 'doc_006f', vol: 3, pattern: /sixth.*debate/i },
    { id: 'doc_006g', vol: 3, pattern: /seventh.*debate/i },
    { id: 'doc_007',  vol: 3, pattern: /cooper/i },

    // ── Volume 4 (1860–1861) ─────────────────────────────────────────────
    { id: 'doc_010', vol: 4, pattern: /special.*session|message.*congress.*session/i },
    { id: 'doc_011', vol: 4, pattern: /fragment.*constitution|constitution.*fragment/i },

    // ── Volume 5 (1861–1862) ─────────────────────────────────────────────
    { id: 'doc_013', vol: 5, pattern: /preliminary.*emancipation/i },
    { id: 'doc_014', vol: 5, pattern: /annual.*message/i },

    // ── Volume 6 (1862–1863) ─────────────────────────────────────────────
    // matchIndex:1 — first match is the Dec 30 preliminary draft; we want the Jan 1 final
    { id: 'doc_015', vol: 6, pattern: /emancipation.*proclamation/i, matchIndex: 1 },

    // ── Volume 7 (1863–1864) ─────────────────────────────────────────────
    { id: 'doc_018', vol: 7, pattern: /memorandum.*reelect|probable.*failure/i },

    // ── Volume 8 (1864–1865) ─────────────────────────────────────────────
    // Section 1:219 confirmed as Nov 10, 1864 re-election serenade response.
    { id: 'doc_020', directUrl: 'https://quod.lib.umich.edu/l/lincoln/lincoln8/1:219?rgn=div1;view=fulltext' },
  ];

  // Debug helper: call debugToc(8) in console to list all Vol.8 TOC link texts.
  // Use this to find the exact title for doc_020 (Nov 10, 1864 re-election response).
  window.debugToc = async function(vol) {
    const tocUrl = `https://quod.lib.umich.edu/l/lincoln/lincoln${vol}`;
    const dom = await getHtml(tocUrl);
    const links = [...dom.querySelectorAll('a[href]')]
      .map(a => ({ text: a.textContent.trim().slice(0, 80), href: a.getAttribute('href') }))
      .filter(l => l.text.length > 5);
    console.table(links);
    return links;
  };

  let ok = 0, fail = 0;
  for (const t of TARGETS) {
    const label = t.directUrl ? t.directUrl : `Vol.${t.vol} "${t.pattern}"${t.matchIndex ? ` [match #${t.matchIndex}]` : ''}`;
    console.log(`\n[${t.id}] ${label}`);
    try {
      let docUrl;
      if (t.directUrl) {
        docUrl = t.directUrl;
      } else {
        docUrl = await findInToc(t.vol, t.pattern, t.matchIndex ?? 0);
        if (!docUrl) {
          console.warn(`  NOT FOUND — pattern: ${t.pattern}`);
          fail++;
          continue;
        }
        console.log(`  → ${docUrl}`);
      }
      await new Promise(r => setTimeout(r, 600));
      const text = await fetchDoc(docUrl);
      console.log(`  ✓ ${text.length} chars`);
      download(`${t.id}.txt`, text);
      ok++;
    } catch (e) {
      console.error(`  ERROR: ${e.message}`);
      fail++;
    }
    await new Promise(r => setTimeout(r, 1200));
  }

  console.log(`\nDone. OK: ${ok}  Failed: ${fail}`);
  console.log('Place downloaded .txt files in corpus/raw/ — no separate strip script needed.');
})();
