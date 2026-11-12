"""Analyze Lighthouse JSONs + /en document scripts. Prints tables used in audit-performance.md."""
import json, re, statistics, pathlib, urllib.request, urllib.parse

BASE = pathlib.Path(__file__).parent
FILES = {
    "en-run1": BASE / "lighthouse-en-run1.json",
    "en-run2": BASE / "lighthouse-en-run2.json",
    "en-run3": BASE / "lighthouse-en-run3.json",
    "ar-run1": BASE / "lighthouse-ar-run1.json",
}
CATS = ["performance", "accessibility", "best-practices", "seo"]
METRICS = [
    ("FCP", "first-contentful-paint"),
    ("LCP", "largest-contentful-paint"),
    ("TBT", "total-blocking-time"),
    ("CLS", "cumulative-layout-shift"),
    ("SI", "speed-index"),
]

def load(name):
    j = json.loads(FILES[name].read_text(encoding="utf-8"))
    scores = {c: round((j["categories"][c]["score"] or 0) * 100) for c in CATS}
    metrics = {}
    for label, key in METRICS:
        a = j["audits"][key]
        v = a.get("numericValue")
        metrics[label] = (round(v) if key != "cumulative-layout-shift" else round(v, 4))
    return {
        "url": j["finalDisplayedUrl"],
        "fetchTime": j.get("fetchTime", ""),
        "lhVersion": j.get("lighthouseVersion", ""),
        "scores": scores,
        "metrics": metrics,
        "runWarnings": j.get("runWarnings", []),
    }

runs = {name: load(name) for name in FILES}
en_runs = [runs["en-run1"], runs["en-run2"], runs["en-run3"]]

print("== per-run category scores ==")
print("run | " + " | ".join(c.upper() for c in CATS))
for name, r in runs.items():
    print(f"{name} ({r['fetchTime']}, LH {r['lhVersion']}) | " + " | ".join(str(r["scores"][c]) for c in CATS))

print()
print("== per-run metrics ==")
print("run | FCP(ms) | LCP(ms) | TBT(ms) | CLS | SI(ms)")
for name, r in runs.items():
    m = r["metrics"]
    print(f"{name} | {m['FCP']} | {m['LCP']} | {m['TBT']} | {m['CLS']} | {m['SI']}")

print()
print("== /en medians (3 runs) ==")
for c in CATS:
    print(f"{c}: median={statistics.median([r['scores'][c] for r in en_runs])}")
for label, _ in METRICS:
    print(f"{label}: median={statistics.median([r['metrics'][label] for r in en_runs])}")

print()
print("== verdict vs launch bar (median >= 90 in all four categories on /en) ==")
med_scores = {c: statistics.median([r["scores"][c] for r in en_runs]) for c in CATS}
for c in CATS:
    print(f"{c}: {'PASS' if med_scores[c] >= 90 else 'FAIL'} (median {med_scores[c]})")
print("overall:", "PASS" if all(v >= 90 for v in med_scores.values()) else "FAIL")

for name, r in runs.items():
    if r["runWarnings"]:
        print(f"runWarnings[{name}]: {r['runWarnings']}")

print()
print("== /en self-hosted <script src> ==")
html = (BASE / "en.html").read_text(encoding="utf-8")
srcs = re.findall(r'<script\b[^>]*\bsrc=["\']([^"\']+)["\'][^>]*>', html)
seen, selfhost, external = [], [], []
for s in srcs:
    if s in seen:
        continue
    seen.append(s)
    parsed = urllib.parse.urlparse(s)
    if parsed.scheme in ("http", "https"):
        (selfhost if parsed.netloc == "fotedev.me" else external).append(s)
    elif s.startswith("//"):
        external.append(s)
    elif s.startswith("/"):
        selfhost.append(s)
    else:
        selfhost.append(s)  # relative path = same origin

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (audit)"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()

total = 0
rows = []
for u in selfhost:
    full = u if u.startswith("http") else "https://fotedev.me" + ("" if u.startswith("/") else "/") + u
    body = fetch(full)
    total += len(body)
    rows.append((u, len(body)))
    print(f"{len(body):>9} B  {u}")
print(f"count={len(selfhost)}  total={total} bytes ({total/1024:.1f} KiB)")
big = [r for r in rows if r[1] > 100_000]
print("offenders >100KB raw:", big if big else "none")
print("external script srcs (not downloaded):", external if external else "none")
