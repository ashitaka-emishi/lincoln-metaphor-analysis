#!/usr/bin/env python3
"""Build raw text files for the v4 core corpus additions."""

from __future__ import annotations

import html
import re
import textwrap
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
OUTPUT_DIR = ROOT / "corpus" / "raw" / "v4-core"
USER_AGENT = "Mozilla/5.0"

GUTENBERG_URL = "https://www.gutenberg.org/cache/epub/3253/pg3253.txt"


DOCUMENTS = [
    {
        "doc_id": "doc_023",
        "slug": "first-political-announcement",
        "date": "1832-03-09",
        "source": "gutenberg",
        "start": r"^ADDRESS TO THE PEOPLE OF SANGAMON COUNTY\.$",
        "end": r"^TO E\. C\. BLANKENSHIP\.$",
    },
    {
        "doc_id": "doc_024",
        "slug": "robertson-letter",
        "date": "1855-08-15",
        "source": "alo",
        "url": "https://www.abrahamlincolnonline.org/lincoln/speeches/robert.htm",
        "start": r"<b>Springfield, Illinois<br>\s*August 15, 1855",
        "end": r"<HR>",
    },
    {
        "doc_id": "doc_025",
        "slug": "speed-letter",
        "date": "1855-08-24",
        "source": "gutenberg",
        "start": r"^RESPONSE TO A PRO-SLAVERY FRIEND$",
        "end": r"^TO R\. P\. MORGAN$",
    },
    {
        "doc_id": "doc_026",
        "slug": "dred-scott-speech",
        "date": "1857-06-26",
        "source": "gutenberg",
        "start": r"^RESPONSE TO A DOUGLAS SPEECH$",
        "end": r"^TO WILLIAM GRIMES\.$",
    },
    {
        "doc_id": "doc_027",
        "slug": "independence-hall-address",
        "date": "1861-02-22",
        "source": "gutenberg",
        "start": r"^ADDRESS IN THE HALL OF INDEPENDENCE, PHILADELPHIA,$",
        "end": r"^REPLY TO THE WILMINGTON DELEGATION,$",
    },
    {
        "doc_id": "doc_028",
        "slug": "annual-message-1861",
        "date": "1861-12-03",
        "source": "gutenberg",
        "start": r"^ANNUAL MESSAGE TO CONGRESS\.$",
        "end": r"^TO THE SENATE AND HOUSE OF REPRESENTATIVES:$",
    },
    {
        "doc_id": "doc_029",
        "slug": "corning-letter",
        "date": "1863-06-12",
        "source": "gutenberg",
        "start": r"^TO ERASTUS CORNING AND OTHERS\.$",
        "end": r"^TO THE SECRETARY OF THE TREASURY\.$",
    },
    {
        "doc_id": "doc_030",
        "slug": "meditation-on-divine-will",
        "date": "1862-09",
        "source": "alo",
        "url": "https://www.abrahamlincolnonline.org/lincoln/speeches/meditat.htm",
        "start": r"<b>Washington, D\.C\.<br>\s*September, 1862</b><p>",
        "end": r"<HR>",
    },
    {
        "doc_id": "doc_031",
        "slug": "fragment-on-slavery",
        "date": "1854-07-01",
        "source": "pal",
        "url": "https://papersofabrahamlincoln.org/documents/D200784",
    },
    {
        "doc_id": "doc_032",
        "slug": "kalamazoo-speech",
        "date": "1856-08-27",
        "source": "pal",
        "url": "https://papersofabrahamlincoln.org/documents/D200912",
    },
    {
        "doc_id": "doc_033",
        "slug": "new-haven-speech",
        "date": "1860-03-06",
        "source": "gutenberg",
        "start": r"^SPEECH AT NEW HAVEN, CONNECTICUT, MARCH 6, 1860$",
        "end": r"^RESPONSE TO AN ELECTOR'S REQUEST FOR MONEY$",
    },
    {
        "doc_id": "doc_034",
        "slug": "pierce-letter",
        "date": "1859-04-06",
        "source": "gutenberg",
        "start": r"^TO H\. L\. PIERCE AND OTHERS\.$",
        "end": r"^TO T\. CANISIUS\.$",
    },
    {
        "doc_id": "doc_035",
        "slug": "colonization-address",
        "date": "1862-08-14",
        "source": "gutenberg",
        "start": r"^ADDRESS ON COLONIZATION TO A DEPUTATION OF COLORED MEN\.$",
        "end": r"^TO HIRAM BARNEY\.$",
    },
    {
        "doc_id": "doc_036",
        "slug": "chicago-emancipation-reply",
        "date": "1862-09-13",
        "source": "gutenberg",
        "start": r"^REPLY TO REQUEST THE PRESIDENT ISSUE A PROCLAMATION OF EMANCIPATION\.$",
        "end": r"^PROCLAMATION SUSPENDING THE WRIT OF HABEAS CORPUS,$",
    },
    {
        "doc_id": "doc_037",
        "slug": "fanny-mccullough-letter",
        "date": "1862-12-23",
        "source": "gutenberg",
        "start": r"^TO MISS FANNY McCULLOUGH\.$",
        "end": r"^TO SECRETARY OF WAR\.$",
    },
    {
        "doc_id": "doc_038",
        "slug": "amnesty-proclamation",
        "date": "1863-12-08",
        "source": "gutenberg",
        "start": r"^PROCLAMATION OF AMNESTY AND RECONSTRUCTION\. DECEMBER 8, 1863\.$",
        "end": r"^ANNUAL MESSAGE TO CONGRESS, DECEMBER 8, 1863\.$",
    },
    {
        "doc_id": "doc_039",
        "slug": "annual-message-1863",
        "date": "1863-12-08",
        "source": "gutenberg",
        "start": r"^ANNUAL MESSAGE TO CONGRESS, DECEMBER 8, 1863\.$",
        "end": r"^TO THE SENATE AND HOUSE OF REPRESENTATIVES:$",
    },
    {
        "doc_id": "doc_040",
        "slug": "annual-message-1864",
        "date": "1864-12-06",
        "source": "gutenberg",
        "start": r"^ANNUAL MESSAGE TO CONGRESS,$",
        "end": r"^RESPONSE TO A SERENADE, DECEMBER 6, 1864\.$",
    },
    {
        "doc_id": "doc_041",
        "slug": "bixby-letter",
        "date": "1864-11-21",
        "source": "gutenberg",
        "start": r"^TO MRS\. BIXBY\.$",
        "end": r"^TO J\. PHILLIPS\.$",
    },
    {
        "doc_id": "doc_042",
        "slug": "ohio-delegation-serenade-response",
        "date": "1864-06-09",
        "source": "gutenberg",
        "start": r"^REPLY TO A DELEGATION FROM OHIO,$",
        "end": r"^ADDRESS TO THE ENVOY FROM THE HAWAIIAN ISLANDS,$",
    },
]


def fetch(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8", errors="replace")


def strip_html(value: str) -> str:
    value = re.sub(r"<script\b.*?</script>", "", value, flags=re.I | re.S)
    value = re.sub(r"<style\b.*?</style>", "", value, flags=re.I | re.S)
    value = re.sub(r"<br\s*/?>", "\n", value, flags=re.I)
    value = re.sub(r"</p\s*>", "\n\n", value, flags=re.I)
    value = re.sub(r"<p\b[^>]*>", "\n\n", value, flags=re.I)
    value = re.sub(r"<[^>]+>", "", value)
    return html.unescape(value)


def normalize_text(value: str) -> str:
    value = value.replace("\r\n", "\n").replace("\r", "\n")
    value = value.replace("\xa0", " ")
    value = value.replace("^", "")
    value = re.sub(r"[ \t]+\n", "\n", value)
    value = re.sub(r"\n[ \t]+", "\n", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    paragraphs = []
    for paragraph in value.split("\n\n"):
        lines = [line.strip() for line in paragraph.splitlines() if line.strip()]
        if not lines:
            continue
        if len(lines) == 1 and (lines[0].isupper() or len(lines[0]) < 60):
            paragraphs.append(lines[0])
        else:
            paragraphs.append(textwrap.fill(" ".join(lines), width=88))
    return "\n\n".join(paragraphs).strip() + "\n"


def extract_gutenberg(source: str, start_pattern: str, end_pattern: str) -> str:
    lines = source.splitlines()
    start = next(
        index for index, line in enumerate(lines) if re.search(start_pattern, line.strip())
    )
    end = next(
        index
        for index, line in enumerate(lines[start + 1 :], start + 1)
        if re.search(end_pattern, line.strip())
    )
    return normalize_text("\n".join(lines[start:end]))


def extract_alo(url: str, start_pattern: str, end_pattern: str) -> str:
    source = fetch(url)
    start = re.search(start_pattern, source, flags=re.I | re.S)
    if not start:
        raise ValueError(f"Could not find ALO start marker in {url}")
    end = re.search(end_pattern, source[start.start() :], flags=re.I | re.S)
    if not end:
        raise ValueError(f"Could not find ALO end marker in {url}")
    fragment = source[start.start() : start.start() + end.start()]
    return normalize_text(strip_html(fragment))


def extract_pal(url: str) -> str:
    source = fetch(url)
    transcription = re.search(
        r'<div id="transcription">(.*?)<!-- Document: End:', source, flags=re.I | re.S
    )
    if not transcription:
        raise ValueError(f"Could not find PAL transcription in {url}")
    body = transcription.group(1)
    body = re.sub(
        r'<div class="pal-editorial-footnote".*?</div>\s*</div>',
        "",
        body,
        flags=re.I | re.S,
    )
    blocks = re.findall(
        r'<div class="(?:pal-head|pal-p|pal-pattribToAL)"[^>]*>(.*?)</div>',
        body,
        flags=re.I | re.S,
    )
    if not blocks:
        raise ValueError(f"Could not find PAL text blocks in {url}")
    cleaned = []
    for block in blocks:
        block = re.sub(r'<span class="pal-fnref">.*?</span>', "", block, flags=re.I | re.S)
        block = re.sub(r'<span class="pal-pal-add">.*?</span>', "", block, flags=re.I | re.S)
        cleaned.append(strip_html(block))
    return normalize_text("\n\n".join(cleaned))


def output_path(document: dict[str, str]) -> Path:
    filename = f"{document['doc_id']}--{document['slug']}--{document['date']}.txt"
    return OUTPUT_DIR / filename


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    gutenberg = fetch(GUTENBERG_URL)
    expected = {output_path(document) for document in DOCUMENTS}
    for stale_path in OUTPUT_DIR.glob("doc_*.txt"):
        if stale_path not in expected:
            stale_path.unlink()

    for document in DOCUMENTS:
        if document["source"] == "gutenberg":
            text = extract_gutenberg(gutenberg, document["start"], document["end"])
        elif document["source"] == "alo":
            text = extract_alo(document["url"], document["start"], document["end"])
        elif document["source"] == "pal":
            text = extract_pal(document["url"])
        else:
            raise ValueError(f"Unknown source {document['source']}")
        output_path(document).write_text(text, encoding="utf-8")


if __name__ == "__main__":
    main()
