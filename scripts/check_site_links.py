#!/usr/bin/env python3
"""Validate rendered-site links and optional external targets."""

from __future__ import annotations

import argparse
import concurrent.futures
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path


IGNORED_SCHEMES = {"data", "javascript", "mailto", "tel"}
REACHABLE_HTTP_ERRORS = {401, 403, 405, 429}


class LinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[str] = []
        self.anchors: set[str] = set()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if values.get("id"):
            self.anchors.add(values["id"])
        if tag == "a" and values.get("name"):
            self.anchors.add(values["name"])
        if tag == "a" and values.get("href"):
            self.links.append(values["href"])
        if (
            tag == "link"
            and values.get("href")
            and values.get("rel") not in {"preconnect", "dns-prefetch"}
        ):
            self.links.append(values["href"])


def parse_html(path: Path) -> LinkParser:
    parser = LinkParser()
    parser.feed(path.read_text(encoding="utf-8"))
    return parser


def resolve_internal(root: Path, source: Path, url: str) -> tuple[Path, str]:
    parsed = urllib.parse.urlsplit(url)
    decoded_path = urllib.parse.unquote(parsed.path)
    if decoded_path.startswith("/"):
        target = root / decoded_path.lstrip("/")
    else:
        target = source.parent / decoded_path if decoded_path else source
    target = Path(os.path.normpath(target)).resolve()
    if decoded_path.endswith("/"):
        target /= "index.html"
    return target, urllib.parse.unquote(parsed.fragment)


def check_external(url: str) -> tuple[str, str | None]:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "lincoln-metaphor-publication-link-check/1.0"},
        method="HEAD",
    )
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            if response.status >= 400:
                return url, f"HTTP {response.status}"
    except urllib.error.HTTPError as error:
        if error.code not in REACHABLE_HTTP_ERRORS:
            return url, f"HTTP {error.code}"
    except (urllib.error.URLError, TimeoutError) as error:
        return url, str(error.reason if isinstance(error, urllib.error.URLError) else error)
    return url, None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", nargs="?", default="_site", type=Path)
    parser.add_argument("--external", action="store_true")
    args = parser.parse_args()

    root = args.root.resolve()
    html_files = sorted(root.rglob("*.html"))
    if not html_files:
        print(f"No rendered HTML files found under {root}", file=sys.stderr)
        return 1

    parsed_files = {path: parse_html(path) for path in html_files}
    failures: list[str] = []
    external_urls: set[str] = set()
    internal_count = 0

    for source, parsed_html in parsed_files.items():
        for link in parsed_html.links:
            parsed = urllib.parse.urlsplit(link)
            if parsed.scheme in {"http", "https"}:
                external_urls.add(urllib.parse.urlunsplit(parsed._replace(fragment="")))
                continue
            if parsed.scheme in IGNORED_SCHEMES or link.startswith("//"):
                continue
            internal_count += 1
            target, fragment = resolve_internal(root, source, link)
            try:
                target.relative_to(root)
            except ValueError:
                failures.append(f"{source.relative_to(root)} -> outside site root {link}")
                continue
            if not target.exists():
                failures.append(f"{source.relative_to(root)} -> missing {link}")
                continue
            if fragment and target.suffix == ".html":
                target_parser = parsed_files.get(target) or parse_html(target)
                if fragment not in target_parser.anchors:
                    failures.append(
                        f"{source.relative_to(root)} -> missing fragment {link}"
                    )

    if args.external:
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
            for url, error in executor.map(check_external, sorted(external_urls)):
                if error:
                    failures.append(f"external {url} -> {error}")

    print(
        f"Checked {len(html_files)} HTML files, {internal_count} internal links, "
        f"and {len(external_urls) if args.external else 0} external links."
    )
    if failures:
        print("Link failures:", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        return 1
    print("All checked links resolved.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
