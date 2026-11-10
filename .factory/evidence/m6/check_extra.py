import json
from pathlib import Path

EV = Path(".factory/evidence/m6/html")
data = json.loads((EV / "parsed.json").read_text(encoding="utf-8"))
PAGES = ["en_home", "en_about", "en_contact", "en_privacy", "en_projects", "en_services",
         "en_projects_masar-x", "en_projects_ghost", "en_projects_khalat",
         "ar_home", "ar_about", "ar_contact", "ar_privacy", "ar_projects", "ar_services",
         "ar_projects_masar-x", "ar_projects_ghost", "ar_projects_khalat"]
titles = [data[k]["title"] for k in PAGES]
extra = 0
for k in PAGES:
    d = data[k]
    fails = []
    t = d["title"] or ""
    if not t or titles.count(t) != 1 or len(t) > 60:
        fails.append(("title", f"len={len(t)} unique={titles.count(t)==1}"))
    cans = d["canonical"]
    loc, slug = k.split("_", 1)
    path = "" if slug == "home" else "/" + slug.replace("_", "/")
    self_url = f"https://fotedev.me/{loc}{path}"
    if not (len(cans) == 1 and cans[0] == self_url):
        fails.append(("canonical", f"{cans} != {self_url}"))
    m = d["metas"]
    need = ["og:title", "og:description", "og:url", "og:type", "og:locale"]
    missing = [x for x in need if not m.get(x)]
    locok = m.get("og:locale") == ("en_US" if loc == "en" else "ar_EG")
    urlok = m.get("og:url") == self_url
    if missing or not locok or not urlok:
        fails.append(("og_core", f"missing={missing} locok={locok} urlok={urlok} og:locale={m.get('og:locale')} og:url={m.get('og:url')}"))
    h = d["hreflang"]
    en_u = f"https://fotedev.me/en{path}"
    ar_u = f"https://fotedev.me/ar{path}"
    if not (h.get("en") == [en_u] and h.get("ar") == [ar_u] and h.get("x-default") == [en_u] and set(h.keys()) == {"en", "ar", "x-default"}):
        fails.append(("hreflang_html", str(h)))
    if d["h1_count"] != 1:
        fails.append(("h1", str(d["h1_count"])))
    if fails:
        extra += len(fails)
        print(k, fails)
print("extra fails beyond the 5 known per-page root causes:", extra)
