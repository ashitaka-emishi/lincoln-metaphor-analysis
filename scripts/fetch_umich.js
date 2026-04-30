#!/usr/bin/env node
// Connects to an existing Chrome session (via CDP) and downloads UMich Collected Works pages.
// Usage:
//   1. Launch Chrome with remote debugging:
//      /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --no-first-run --no-default-browser-check
//   2. In that Chrome window, go to https://quod.lib.umich.edu and pass the CAPTCHA
//   3. Run: node scripts/fetch_umich.js

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const RAW_DIR = path.join(__dirname, '..', 'corpus', 'raw');

// Only documents still needing Stage 2
const DOCS = [
  { id: 'doc_003', url: 'https://quod.lib.umich.edu/l/lincoln/lincoln2/1:97',   title: 'Clay Eulogy' },
  { id: 'doc_004', url: 'https://quod.lib.umich.edu/l/lincoln/lincoln2/1:199',  title: 'Peoria Speech' },
  { id: 'doc_005', url: 'https://quod.lib.umich.edu/l/lincoln/lincoln2/1:419',  title: 'House Divided' },
  { id: 'doc_006a', url: 'https://quod.lib.umich.edu/l/lincoln/lincoln3/1:1',   title: 'L-D Debate 1 Ottawa' },
  { id: 'doc_006b', url: 'https://quod.lib.umich.edu/l/lincoln/lincoln3/1:2',   title: 'L-D Debate 2 Freeport' },
  { id: 'doc_006c', url: 'https://quod.lib.umich.edu/l/lincoln/lincoln3/1:3',   title: 'L-D Debate 3 Jonesboro' },
  { id: 'doc_006d', url: 'https://quod.lib.umich.edu/l/lincoln/lincoln3/1:4',   title: 'L-D Debate 4 Charleston' },
  { id: 'doc_006e', url: 'https://quod.lib.umich.edu/l/lincoln/lincoln3/1:5',   title: 'L-D Debate 5 Galesburg' },
  { id: 'doc_006f', url: 'https://quod.lib.umich.edu/l/lincoln/lincoln3/1:6',   title: 'L-D Debate 6 Quincy' },
  { id: 'doc_006g', url: 'https://quod.lib.umich.edu/l/lincoln/lincoln3/1:7',   title: 'L-D Debate 7 Alton' },
  { id: 'doc_007', url: 'https://quod.lib.umich.edu/l/lincoln/lincoln3/1:92',   title: 'Cooper Union' },
  { id: 'doc_010', url: 'https://quod.lib.umich.edu/l/lincoln/lincoln4/1:109',  title: 'July 4 Message 1861' },
  { id: 'doc_011', url: 'https://quod.lib.umich.edu/l/lincoln/lincoln4/1:34',   title: 'Constitution Fragment' },
  { id: 'doc_013', url: 'https://quod.lib.umich.edu/l/lincoln/lincoln5/1:345',  title: 'Prelim Emancipation' },
  { id: 'doc_014', url: 'https://quod.lib.umich.edu/l/lincoln/lincoln5/1:400',  title: 'Annual Message 1862' },
  { id: 'doc_015', url: 'https://quod.lib.umich.edu/l/lincoln/lincoln6/1:20',   title: 'Final Emancipation' },
  { id: 'doc_018', url: 'https://quod.lib.umich.edu/l/lincoln/lincoln7/1:348',  title: 'Blind Memorandum' },
  { id: 'doc_020', url: 'https://quod.lib.umich.edu/l/lincoln/lincoln8/1:61',   title: 'Re-election Serenade' },
];

async function extractPageText(page) {
  // UMich DLXS pages put the main text in #TextDiv or .text or <div class="body">
  const selectors = ['#TextDiv', '.text', 'div.body', 'div#content', 'main', 'body'];
  for (const sel of selectors) {
    const el = page.locator(sel).first();
    if (await el.count() > 0) {
      const raw = await el.innerText();
      if (raw && raw.trim().length > 200) return raw.trim();
    }
  }
  return (await page.locator('body').innerText()).trim();
}

async function tryViewFullText(page) {
  // UMich often has a "View Entire Text" link — clicking it gives a single-page version
  const fullTextSelectors = [
    'a:has-text("View Entire Text")',
    'a:has-text("Entire Text")',
    'a:has-text("Full Text")',
    'a:has-text("view entire")',
    'a[href*="view=text"]',
    'a[href*="entiretext"]',
  ];
  for (const sel of fullTextSelectors) {
    const link = page.locator(sel).first();
    if (await link.count() > 0) {
      await link.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);
      return true;
    }
  }
  return false;
}

async function getAllPages(page) {
  // Collect text across paginated documents by following "Next page" links
  const pages = [];
  let pageNum = 0;
  const visited = new Set();

  while (true) {
    const url = page.url();
    if (visited.has(url)) break;
    visited.add(url);
    pageNum++;

    const text = await extractPageText(page);
    pages.push(text);
    process.stdout.write(`p${pageNum} `);

    // Look for a "Next" / "Next page" / ">" link
    const nextSelectors = [
      'a:has-text("Next page")',
      'a:has-text("Next Page")',
      'a:has-text("next page")',
      'a:has-text("Next")',
      'a[title="Next page"]',
      'a[title="next"]',
      'a:has-text(">")',
      'a[href*="page="][href*="next"]',
    ];
    let found = false;
    for (const sel of nextSelectors) {
      const next = page.locator(sel).first();
      if (await next.count() > 0) {
        const href = await next.getAttribute('href');
        // Don't follow if it loops back
        if (href && !visited.has(new URL(href, page.url()).href)) {
          await next.click();
          await page.waitForLoadState('domcontentloaded');
          await page.waitForTimeout(800);
          found = true;
          break;
        }
      }
    }
    if (!found) break;
    if (pageNum > 50) break; // safety cap
  }

  return pages.join('\n\n--- [page break] ---\n\n');
}

async function extractText(page) {
  // First try to get a single-page "full text" view
  const foundFullText = await tryViewFullText(page);
  if (foundFullText) {
    return await extractPageText(page);
  }
  // Otherwise paginate through all pages
  return await getAllPages(page);
}

async function run() {
  console.log('Connecting to Chrome on port 9222...');
  let browser;
  try {
    browser = await chromium.connectOverCDP('http://localhost:9222');
  } catch (e) {
    console.error('Could not connect. Is Chrome running with --remote-debugging-port=9222?');
    console.error(e.message);
    process.exit(1);
  }

  const contexts = browser.contexts();
  if (!contexts.length) {
    console.error('No browser context found. Open a tab in Chrome first.');
    process.exit(1);
  }
  const context = contexts[0];
  const page = await context.newPage();

  let saved = 0;
  let failed = [];

  for (const doc of DOCS) {
    const outPath = path.join(RAW_DIR, `${doc.id}.txt`);
    if (fs.existsSync(outPath)) {
      console.log(`  SKIP  ${doc.id} (already exists)`);
      continue;
    }

    process.stdout.write(`  GET   ${doc.id} ${doc.title}... `);
    try {
      await page.goto(doc.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1500); // let dynamic content settle

      // If we hit a CAPTCHA or block page, bail
      const title = await page.title();
      if (/captcha|blocked|access denied/i.test(title)) {
        console.log(`BLOCKED (${title})`);
        failed.push(doc.id);
        continue;
      }

      const text = await extractText(page);
      fs.writeFileSync(outPath, text, 'utf8');
      console.log(`OK (${text.length} chars)`);
      saved++;

      // Small delay between requests to be polite
      await page.waitForTimeout(1000);
    } catch (e) {
      console.log(`ERROR: ${e.message}`);
      failed.push(doc.id);
    }
  }

  await page.close();
  console.log(`\nDone. Saved: ${saved}  Failed: ${failed.length}`);
  if (failed.length) console.log('Failed:', failed.join(', '));
  process.exit(0);
}

run();
