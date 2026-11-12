import json, re
from pathlib import Path
from lxml import html as lhtml

EV = Path(".factory/evidence/m6/html")

print("=== JSON-LD extraction (all pages, any depth) ===")
pages = [p.stem for p in EV.glob("en_*.html") if not p.stem.endswith("_headers")] + \
        [p.stem for p in EV.glob("ar_*.html")]
for name in sorted(set(pages)):
    if name.startswith("404"):
        continue
    doc = lhtml.fromstring((EV / f"{name}.html").read_bytes())
    scripts = doc.findall('.//script[@type="application/ld+json"]')
    if not scripts:
        print(f"{name}: NO JSON-LD")
        continue
    for s in scripts:
        raw = (s.text or "").strip()
        try:
            data = json.loads(raw)
            def types(d):
                if isinstance(d, list):
                    return [types(x) for x in d]
                return d.get("@type")
            print(f"{name}: VALID | @type={types(data)}")
        except Exception as e:
            print(f"{name}: PARSE-ERR {e}")

print()
print("=== JSON-LD full content (pages that have it) ===")
for name in ["en_home", "ar_home", "en_about", "ar_about", "en_contact", "ar_contact"]:
    doc = lhtml.fromstring((EV / f"{name}.html").read_bytes())
    for s in doc.findall('.//script[@type="application/ld+json"]'):
        print(f"--- {name} ---")
        print((s.text or "").strip()[:1200])

print()
print("=== 404 pages detail ===")
for name in ["404_en", "404_ar"]:
    doc = lhtml.fromstring((EV / f"{name}.html").read_bytes())
    t = doc.find(".//title")
    print(f"== {name} ==")
    print("  title:", repr(t.text) if t is not None else None)
    print("  robots meta:", [m.get("content") for m in doc.findall(".//meta") if m.get("name") == "robots"])
    print("  canonical:", [c.get("href") for c in doc.findall('.//link[@rel="canonical"]')])
    h1s = doc.findall(".//h1")
    print("  h1:", len(h1s), [" ".join(h.text_content().split())[:80] for h in h1s])
    txt = " ".join(doc.text_content().split())
    # find visible 404-ish strings
    print("  text sample:", txt[:400])

print()
print("=== icon / manifest link tags (regex on raw html) ===")
for name in ["en_home", "ar_home", "en_about"]:
    raw = (EV / f"{name}.html").read_text(encoding="utf-8", errors="replace")
    tags = re.findall(r'<link[^>]*rel="(?:icon|shortcut icon|apple-touch-icon|manifest|mask-icon)"[^>]*>', raw)
    print(f"--- {name} ---")
    for tg in tags:
        print("  ", tg)
