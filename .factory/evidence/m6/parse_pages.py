import json, re, sys
from pathlib import Path
from lxml import etree, html as lhtml

EV = Path(".factory/evidence/m6/html")

def parse_headers(path):
    raw = path.read_text(encoding="utf-8", errors="replace")
    lines = raw.splitlines()
    status = lines[0].strip() if lines else "?"
    links = []  # list of (url, rel, hreflang) from each Link header line
    for ln in lines:
        if ln.lower().startswith("link:"):
            val = ln[5:].strip()
            for part in re.split(r',\s*(?=<)', val):
                m = re.match(r'<([^>]+)>(.*)', part)
                if not m:
                    continue
                url, params = m.group(1), m.group(2)
                rel = re.search(r'rel="([^"]+)"', params)
                hreflang = re.search(r'hreflang="([^"]+)"', params)
                links.append((url, rel.group(1) if rel else None, hreflang.group(1) if hreflang else None))
    return status, links

def page_meta(path):
    raw = path.read_bytes()
    doc = lhtml.fromstring(raw)
    out = {}
    html_el = doc.find("html")
    out["html_lang"] = html_el.get("lang") if html_el is not None else None
    out["html_dir"] = html_el.get("dir") if html_el is not None else None
    t = doc.find(".//head/title")
    out["title"] = t.text if t is not None else None
    metas = {}
    for m in doc.findall(".//head/meta"):
        k = m.get("name") or m.get("property")
        if k:
            metas.setdefault(k, m.get("content"))
    out["metas"] = metas
    canon = doc.findall('.//head/link[@rel="canonical"]')
    out["canonical"] = [c.get("href") for c in canon]
    alts = {}
    for a in doc.findall('.//head/link[@rel="alternate"]'):
        hl = a.get("hreflang")
        if hl:
            alts.setdefault(hl, []).append(a.get("href"))
    out["hreflang"] = alts
    jsonlds = []
    for s in doc.findall('.//script[@type="application/ld+json"]'):
        try:
            data = json.loads(s.text)
            jsonlds.append({"ok": True, "data": data})
        except Exception as e:
            jsonlds.append({"ok": False, "err": str(e), "raw": (s.text or "")[:200]})
    out["jsonld"] = jsonlds
    h1s = doc.findall(".//body//h1")
    out["h1_count"] = len(h1s)
    out["h1_texts"] = [(" ".join(h.text_content().split()))[:120] for h in h1s]
    out["title_len"] = len(out["title"]) if out["title"] else 0
    d = metas.get("description")
    out["desc_len"] = len(d) if d else 0
    return out

pages = ["en_home","en_about","en_contact","en_privacy","en_projects","en_services",
         "en_projects_masar-x","en_projects_ghost","en_projects_khalat",
         "ar_home","ar_about","ar_contact","ar_privacy","ar_projects","ar_services",
         "ar_projects_masar-x","ar_projects_ghost","ar_projects_khalat"]

result = {}
for p in pages:
    hf = EV / f"{p}_headers.txt"
    bf = EV / f"{p}.html"
    status, hlinks = parse_headers(hf)
    meta = page_meta(bf)
    hl = {}
    for url, rel, lang in hlinks:
        if lang and rel == "alternate":
            hl.setdefault(lang, url)
    result[p] = {"status": status, "http_link": hl, **meta}

with open(EV / "parsed.json", "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=1)

# compact summary
for p, r in result.items():
    jt = []
    for j in r["jsonld"]:
        if j["ok"]:
            d = j["data"]
            types = [x.get("@type") for x in (d if isinstance(d, list) else [d])]
            jt.append(types)
        else:
            jt.append(f"PARSE-ERR: {j['err']}")
    print(f"{p} | {r['status']} | lang={r['html_lang']} dir={r['html_dir']} | title[{r['title_len']}]={r['title']!r}")
    print(f"   desc[{r['desc_len']}]={r['metas'].get('description')!r}")
    print(f"   canonical={r['canonical']} | robots={r['metas'].get('robots')!r}")
    print(f"   hreflang_html={r['hreflang']}")
    print(f"   hreflang_hdr={r['http_link']}")
    og = {k: v for k, v in r["metas"].items() if k.startswith("og:")}
    tw = {k: v for k, v in r["metas"].items() if k.startswith("twitter:")}
    print(f"   og={og}")
    print(f"   twitter={tw}")
    print(f"   jsonld={jt}")
    print(f"   h1[{r['h1_count']}]={r['h1_texts']}")
