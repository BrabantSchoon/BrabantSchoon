#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import re

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE_URL = "https://www.brabantschoon.nl"
PHONE_DISPLAY = "0492 - 31 30 50"
PHONE_TEL = "+31492313050"
EMAIL = "info@brabantschoon.nl"
WA_LINK = "https://wa.me/31492313050?text=Hoi%2C%20ik%20wil%20graag%20een%20offerte%20aanvragen"
KVK = "99274175"
CITY = "Helmond"
ASSET_VERSION = "50"

# ---------------------------------------------------------------
# ICONS
# ---------------------------------------------------------------
ICONS = {
    "check": '<path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/>',
    "team": '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
    "list": '<path d="M4 12h16M4 6h16M4 18h10"/>',
    "spark": '<path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/><circle cx="12" cy="12" r="3"/>',
    "chat": '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    "pin": '<path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    "window": '<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M12 4v16M4 12h16"/>',
    "office": '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 21v-4h6v4M9 8h.01M9 12h.01M15 8h.01M15 12h.01"/>',
    "key": '<rect x="3" y="11" width="18" height="10" rx="1"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    "building": '<path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/>',
    "facade": '<path d="M4 21V9l8-6 8 6v12"/><path d="M4 21h16M9 21v-8h6v8"/>',
    "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
    "phone": '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .7 3a2 2 0 0 1-.5 2.1L8 10.1a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c1 .4 2 .6 3 .7a2 2 0 0 1 1.7 2z"/>',
    "mail": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    "doc": '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h5"/>',
    "arrow": '<path d="M5 12h14M13 6l6 6-6 6"/>',
    "star-outline": '<path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    "instagram": '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>',
    "facebook": '<path d="M15 8h-2a2 2 0 0 0-2 2v2H9v3h2v7h3v-7h2.2l.8-3H14v-1.5a.5.5 0 0 1 .5-.5H16z"/>',
    "whatsapp": '<path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z"/><path d="M8.5 8.7c.2-.5.4-.5.7-.5h.5c.2 0 .4 0 .6.4.2.5.7 1.6.7 1.7.1.1.1.3 0 .4-.1.2-.1.3-.3.4-.1.2-.3.3-.4.5-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.5 1.5.3.1.5.1.6-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1.2.1 1.6.7 1.8.9.2.1.4.2.4.3 0 .2 0 .9-.3 1.3-.3.5-1.4 1-2 1-.5 0-1.9-.2-3.5-1.6-2.1-1.8-2.9-3.3-3.1-3.7-.1-.4-.7-1.2-.7-2.3 0-1 .5-1.5.7-1.7z"/>',
    "shop": '<path d="M3 9l1-5h16l1 5"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/>',
    "practice": '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    "stairs": '<path d="M4 20h4v-4h4v-4h4V8h4"/><path d="M4 20V8h4"/>',
}

def icon(name, cls="icon"):
    return f'<svg class="{cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">{ICONS[name]}</svg>'

# ---------------------------------------------------------------
# ILLUSTRATIONS (custom, abstract, brand-colored — not photos)
# ---------------------------------------------------------------
def compare_slider(before_img, after_img, base=""):
    return f"""<div class="compare-slider reveal">
    <div class="cs-layer">
      <div class="cs-after" style="background-image:url('{base}{after_img}');"></div>
      <div class="cs-before-clip" id="csBeforeClip">
        <div class="cs-before" style="background-image:url('{base}{before_img}');"></div>
      </div>
      <div class="cs-handle" id="csHandle"></div>
    </div>
    <span class="cs-label before">Voor</span>
    <span class="cs-label after">Na</span>
    <input type="range" min="0" max="100" value="50" id="csRange" aria-label="Vergelijk voor en na schoonmaak">
  </div>"""

def sparkle(x, y, size, color):
    s = size
    return f'<path d="M{x} {y-s}L{x+s*0.25} {y-s*0.25}L{x+s} {y}L{x+s*0.25} {y+s*0.25}L{x} {y+s}L{x-s*0.25} {y+s*0.25}L{x-s} {y}L{x-s*0.25} {y-s*0.25}Z" fill="{color}"/>'

# Zodra een echte foto voor een dienst is aangeleverd, komt de bestandsnaam hier te staan
# (relatief t.o.v. images/) en gebruikt de site automatisch de foto in plaats van de illustratie.
SERVICE_PHOTOS = {
    "glasbewassing": "diensten/glasbewassing.jpg",
    "specialistische-reiniging": "diensten/specialistische-reiniging.jpg",
    "gevelreiniging": "diensten/gevelreiniging.jpg",
    "vve-schoonmaak": "diensten/vve-schoonmaak.jpg",
    "opleveringsschoonmaak": "diensten/opleveringsschoonmaak.jpg",
    "kantoorreiniging": "diensten/kantoorreiniging.jpg",
    "periodieke-schoonmaak": "diensten/periodieke-schoonmaak.jpg",
}

def service_visual(svc, css_class=""):
    """Geeft een <img> terug als er een foto is, anders de illustratie-SVG."""
    photo = SERVICE_PHOTOS.get(svc["slug"])
    if photo:
        return f'<img src="../images/{photo}" alt="{svc["name"]} door BrabantSchoon in Zuidoost-Brabant" class="{css_class}" width="1200" height="800" loading="lazy" decoding="async" style="width:100%; height:100%; object-fit:cover;">'
    return service_illustration(svc["icon"])

def service_visual_from_root(svc, css_class=""):
    """Zelfde als service_visual, maar met pad relatief vanaf de hoofdmap (voor home/diensten.html)."""
    photo = SERVICE_PHOTOS.get(svc["slug"])
    if photo:
        return f'<img src="images/{photo}" alt="{svc["name"]} door BrabantSchoon in Zuidoost-Brabant" class="{css_class}" width="1200" height="800" loading="lazy" decoding="async" style="width:100%; height:100%; object-fit:cover;">'
    return service_illustration(svc["icon"])

def hero_illustration():
    return f"""<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <circle cx="320" cy="90" r="70" fill="#0082E6" opacity="0.08"/>
  <circle cx="70" cy="330" r="50" fill="#2FA84A" opacity="0.08"/>
  <rect x="70" y="80" width="220" height="220" rx="18" fill="#FFFFFF" stroke="#10205C" stroke-width="3"/>
  <line x1="180" y1="80" x2="180" y2="300" stroke="#10205C" stroke-width="3"/>
  <line x1="70" y1="190" x2="290" y2="190" stroke="#10205C" stroke-width="3"/>
  <g transform="rotate(-32 200 190)">
    <rect x="150" y="176" width="120" height="28" rx="14" fill="#2FA84A"/>
    <rect x="255" y="184" width="70" height="12" rx="6" fill="#0082E6"/>
  </g>
  {sparkle(320, 250, 14, '#0082E6')}
  {sparkle(60, 100, 10, '#2FA84A')}
  {sparkle(300, 60, 8, '#F0A93B')}
  <g transform="translate(300,230)">
    <rect x="0" y="26" width="46" height="80" rx="8" fill="#10205C"/>
    <rect x="10" y="4" width="26" height="24" rx="5" fill="#0082E6"/>
    <rect x="30" y="0" width="22" height="9" rx="4" fill="#565E72"/>
  </g>
</svg>"""

def service_illustration(icon_name, tint_stroke="#10205C"):
    body = ICONS[icon_name]
    return f"""<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="164" cy="40" r="20" fill="#0082E6" opacity="0.10"/>
  <circle cx="30" cy="164" r="16" fill="#2FA84A" opacity="0.10"/>
  <g transform="translate(40,40) scale(5)" fill="none" stroke="{tint_stroke}" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">{body}</g>
  {sparkle(168, 156, 9, '#F0A93B')}
  {sparkle(28, 32, 7, '#0082E6')}
</svg>"""

# ---------------------------------------------------------------
# SERVICES (volgorde per brief)
# ---------------------------------------------------------------
SERVICES = [
    {"slug": "kantoorreiniging", "icon": "office", "tint": "tint-1",
     "name": "Kantoorreiniging",
     "short": "Vaste of periodieke reiniging van uw kantoorpand, buiten werktijd.",
     "intro": "Een schone werkomgeving draagt bij aan hoe medewerkers en bezoekers uw bedrijf ervaren. We verzorgen de reiniging van uw kantoor op een vast, betrouwbaar ritme.",
     "bullets": ["Bureaus, vloeren en sanitair", "Pantry's en vergaderruimtes", "Afvalverwerking", "Frequentie in overleg"],
     "for": "Kantoren en praktijken in Zuidoost-Brabant.", "faqs": [("Hoe vaak kan kantoorreiniging plaatsvinden?", "Dat bepaalt u zelf: van dagelijks tot wekelijks, afhankelijk van de grootte en het gebruik van uw kantoor."), ("Werken jullie buiten kantoortijden?", "Ja, we plannen de reiniging doorgaans buiten werktijd, zodat uw bedrijfsvoering geen hinder ondervindt.")]},
    {"slug": "glasbewassing", "icon": "window", "tint": "tint-2",
     "name": "Glasbewassing",
     "short": "Ramen en kozijnen streeploos schoon, binnen en buiten.",
     "intro": "Helder glaswerk maakt direct verschil in de uitstraling van een pand. We reinigen ramen en kozijnen zorgvuldig, eenmalig of op een vast interval.",
     "bullets": ["Binnen- en buitenzijde", "Kozijnen en sponningen", "Op aanvraag of vast interval"],
     "for": "Kantoren, winkels en woningen.", "faqs": [("Hoe vaak is glasbewassing nodig?", "Dat hangt af van de locatie; de meeste klanten kiezen voor een vast interval van enkele weken tot maandelijks."), ("Kunnen jullie ook hoger gelegen ramen reinigen?", "Ja, met de juiste hulpmiddelen reinigen we ramen op verschillende hoogtes.")]},
    {"slug": "gevelreiniging", "icon": "facade", "tint": "tint-3",
     "name": "Gevelreiniging",
     "short": "Reiniging van gevels en buitenmuren.",
     "intro": "Een gevel staat jarenlang bloot aan weer en vervuiling. We reinigen gevels zorgvuldig, passend bij het materiaal van uw pand.",
     "bullets": ["Steen, hout en kunststof", "Verwijderen van aanslag", "Aanpak op maat"],
     "for": "Bedrijfspanden en woningen.", "faqs": [("Is gevelreiniging schadelijk voor het gevelmateriaal?", "Nee, we stemmen de methode af op het materiaal van uw gevel om schade te voorkomen."), ("Hoe vaak moet een gevel gereinigd worden?", "Dit verschilt per pand en ligging; meestal is een jaarlijkse of tweejaarlijkse beurt voldoende.")]},
    {"slug": "opleveringsschoonmaak", "icon": "key", "tint": "tint-4",
     "name": "Opleveringsschoonmaak",
     "short": "Een pand schoon opgeleverd bij sleuteloverdracht.",
     "intro": "Bij verhuizing, verbouwing of nieuwbouw moet een pand vaak op korte termijn klaar zijn. We zorgen dat de ruimte gereed is voor gebruik of oplevering.",
     "bullets": ["Bouwstof en resten verwijderen", "Kozijnen, kasten en sanitair", "Snel inplanbaar"],
     "for": "Verhuurders, aannemers en particulieren.", "faqs": [("Hoe snel kan opleveringsschoonmaak worden ingepland?", "Vaak binnen enkele dagen, afhankelijk van de planning en de grootte van het pand."), ("Is opleveringsschoonmaak ook geschikt na een verbouwing?", "Ja, we verwijderen bouwstof en resten zodat het pand klaar is voor gebruik of oplevering.")]},
    {"slug": "vve-schoonmaak", "icon": "building", "tint": "tint-5",
     "name": "VvE-schoonmaak",
     "short": "Onderhoud van trappenhuizen en gemeenschappelijke ruimtes.",
     "intro": "Gemeenschappelijke ruimtes verdienen structureel onderhoud. We stemmen een vast schema af met VvE-besturen en beheerders.",
     "bullets": ["Trappenhuizen en entrees", "Liften en gangen", "Direct contact met het bestuur"],
     "for": "VvE-besturen en beheerders.", "faqs": [("Hoe wordt de frequentie van VvE-schoonmaak bepaald?", "In overleg met het bestuur stellen we een schema op dat past bij het gebruik van de gemeenschappelijke ruimtes."), ("Kan de VvE één vast aanspreekpunt krijgen?", "Ja, u krijgt een vast contact voor afstemming en eventuele bijzonderheden.")]},
    {"slug": "periodieke-schoonmaak", "icon": "clock", "tint": "tint-6",
     "name": "Periodieke schoonmaak",
     "short": "Een vaste schoonmaakbeurt op een vast ritme.",
     "intro": "Niet elke ruimte heeft dagelijks onderhoud nodig. We plannen een ritme dat past bij uw pand: wekelijks, maandelijks of een ander interval.",
     "bullets": ["Frequentie op maat", "Vaste dag", "Flexibel aan te passen"],
     "for": "Ruimtes zonder dagelijks onderhoud.", "faqs": [("Wat is het verschil met een vast schoonmaakcontract?", "Periodieke schoonmaak is flexibeler qua interval; u bepaalt zelf de frequentie die bij uw ruimte past."), ("Kan de frequentie later worden aangepast?", "Ja, in overleg passen we het ritme aan als uw situatie verandert.")]},
    {"slug": "specialistische-reiniging", "icon": "spark", "tint": "tint-7",
     "name": "Specialistische reiniging",
     "short": "Maatwerk voor vloeren, tapijt en bijzondere oppervlakken.",
     "intro": "Sommige oppervlakken vragen specifieke kennis. Van tapijtreiniging tot vloerbehandeling: we pakken werk aan dat verder gaat dan regulier onderhoud.",
     "bullets": ["Tapijt- en stofferingreiniging", "Vloerbehandeling", "Op aanvraag"],
     "for": "Bedrijven met specifieke reinigingsvragen.", "faqs": [("Welke oppervlakken kunnen jullie specialistisch reinigen?", "Onder andere tapijt, stoffering en diverse vloertypen, afhankelijk van de vraag."), ("Is specialistische reiniging ook eenmalig mogelijk?", "Ja, dit is vaak maatwerk en prima als eenmalige beurt aan te vragen.")]},
]

WERKGEBIED_KERN = ["Helmond", "Deurne", "Asten", "Someren", "Gemert-Bakel", "Laarbeek"]
WERKGEBIED_OVERIG = ["Eindhoven", "Geldrop-Mierlo", "Nuenen", "Mierlo"]

FORM_SERVICE_OPTIONS = [
    "Kantoorreiniging", "Glasbewassing", "Gevelreiniging", "VvE-schoonmaak",
    "Opleveringsschoonmaak", "Specialistische reiniging", "Winkelreiniging",
    "Praktijkreiniging", "Trappenhuisreiniging", "Periodieke schoonmaak",
    "Eenmalige schoonmaak", "Anders...",
]

NAV_LINKS = [
    ("Home", "index.html"),
    ("Diensten", "diensten.html"),
    ("Over ons", "over-ons.html"),
    ("Werkgebied", "werkgebied.html"),
    ("Contact", "contact.html"),
]

# ---------------------------------------------------------------
# HEAD / SCHEMA
# ---------------------------------------------------------------
def render_head(title, description, path, base, schema_extra="", preload_image=None):
    canonical = f"{SITE_URL}/{path}" if path else f"{SITE_URL}/"
    og_image = f"{SITE_URL}/images/og-image.png"
    preload_tag = f'<link rel="preload" as="image" href="{base}{preload_image}" fetchpriority="high">' if preload_image else ""
    return f"""<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<meta name="description" content="{description}">
<link rel="canonical" href="{canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:image" content="{og_image}">
<meta property="og:url" content="{canonical}">
<meta property="og:locale" content="nl_NL">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{description}">
<meta name="twitter:image" content="{og_image}">
<link rel="icon" type="image/png" href="{base}images/favicon.png">
<meta name="theme-color" content="#10205C">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
{preload_tag}
<link rel="stylesheet" href="{base}css/styles.css?v={ASSET_VERSION}">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
{ORG_SCHEMA}
{schema_extra}"""

ORG_SCHEMA = f"""<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "BrabantSchoon",
  "url": "{SITE_URL}/",
  "logo": "{SITE_URL}/images/logo.png",
  "telephone": "{PHONE_TEL}",
  "email": "{EMAIL}",
  "address": {{
    "@type": "PostalAddress",
    "addressLocality": "{CITY}",
    "addressRegion": "Noord-Brabant",
    "addressCountry": "NL"
  }},
  "areaServed": "Noord-Brabant"
}}
</script>"""

def breadcrumb_schema(crumb_label, url):
    return f"""<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {{"@type": "ListItem", "position": 1, "name": "Home", "item": "{SITE_URL}/"}},
    {{"@type": "ListItem", "position": 2, "name": "{crumb_label}", "item": "{SITE_URL}/{url}"}}
  ]
}}
</script>"""

def faq_schema(items):
    entities = ",\n    ".join(
        f'{{"@type": "Question", "name": "{q}", "acceptedAnswer": {{"@type": "Answer", "text": "{a}"}}}}'
        for q, a in items
    )
    return f"""<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {entities}
  ]
}}
</script>"""

LOCALBUSINESS_SCHEMA = f"""<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "CleaningService"],
  "name": "BrabantSchoon",
  "image": "{SITE_URL}/images/logo.png",
  "url": "{SITE_URL}/",
  "telephone": "{PHONE_TEL}",
  "email": "{EMAIL}",
  "address": {{
    "@type": "PostalAddress",
    "addressLocality": "{CITY}",
    "addressRegion": "Noord-Brabant",
    "addressCountry": "NL"
  }},
  "areaServed": ["Helmond", "Deurne", "Asten", "Someren", "Gemert-Bakel", "Laarbeek", "Eindhoven", "Geldrop-Mierlo", "Nuenen", "Mierlo", "Noord-Brabant"],
  "sameAs": []
}}
</script>"""

def service_schema(svc):
    return f"""<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "{svc['name']}",
  "name": "{svc['name']} | BrabantSchoon",
  "description": "{svc['short']}",
  "provider": {{"@type": "LocalBusiness", "name": "BrabantSchoon", "url": "{SITE_URL}/"}},
  "areaServed": "Zuidoost-Brabant"
}}
</script>"""

# ---------------------------------------------------------------
# HEADER / FOOTER
# ---------------------------------------------------------------
def render_header(base, active):
    links = []
    for label, href in NAV_LINKS:
        full_href = f"{base}{href}"
        cls = " active" if href == active else ""
        links.append(f'<a href="{full_href}" class="{cls.strip()}">{label}</a>')
    links_html = "\n      ".join(links)
    mobile_links = "\n      ".join(f'<a href="{base}{href}">{label}</a>' for label, href in NAV_LINKS)
    return f"""<a href="#main-content" class="skip-link">Ga direct naar inhoud</a>
<input type="checkbox" id="menuCheckbox" class="menu-checkbox">
<header class="site-header">
  <div class="wrap nav">
    <a href="{base}index.html" class="logo"><img src="{base}images/logo.png" alt="BrabantSchoon" width="130" height="32"></a>
    <nav class="links">
      {links_html}
    </nav>
    <div class="nav-actions">
      <a href="tel:{PHONE_TEL}" class="phone-link">{PHONE_DISPLAY}</a>
      <a href="{base}contact.html" class="btn btn-primary btn-sm">Offerte aanvragen</a>
      <label for="menuCheckbox" class="menu-toggle" aria-label="Menu openen">{icon('list')}</label>
    </div>
  </div>
</header>
<label for="menuCheckbox" class="menu-overlay"></label>
<aside class="mobile-sidebar">
  <div class="mobile-menu-top">
    <img src="{base}images/logo.png" alt="BrabantSchoon" width="120" height="30">
    <label for="menuCheckbox" class="mobile-menu-close" aria-label="Menu sluiten">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </label>
  </div>
  <div class="mobile-menu-links">
    {mobile_links}
    <a href="tel:{PHONE_TEL}" style="color:var(--link);">{PHONE_DISPLAY}</a>
    <a href="{base}contact.html" class="btn btn-primary mobile-cta">Offerte aanvragen</a>
  </div>
</aside>"""

def render_footer(base):
    service_links = "\n        ".join(f'<a href="{base}diensten/{s["slug"]}.html">{s["name"]}</a>' for s in SERVICES)
    location_links = "\n        ".join(f'<a href="{base}locaties/{loc["slug"]}.html">{loc["name"]}</a>' for loc in LOCATIONS)
    return f"""<footer class="site-footer">
  <div class="wrap">
    <div class="footer-top">
      <div class="footer-brand">
        <img src="{base}images/logo.png" alt="BrabantSchoon" width="120" height="30">
        <p class="footer-tagline">Schoonmaak &amp; facility diensten voor bedrijven, actief in heel Noord-Brabant. Ook voor particuliere klussen, zoals opleveringsschoonmaak en vakantieparken.</p>
        <div class="footer-social">
          <a href="{WA_LINK}" target="_blank" rel="noopener" aria-label="BrabantSchoon op WhatsApp">{icon('whatsapp')}</a>
          <a href="https://facebook.com/brabantschoon" target="_blank" rel="noopener" aria-label="BrabantSchoon op Facebook">{icon('facebook')}</a>
          <a href="https://instagram.com/brabantschoon" target="_blank" rel="noopener" aria-label="BrabantSchoon op Instagram">{icon('instagram')}</a>
        </div>
      </div>
      <div class="footer-col">
        <h4>Diensten</h4>
        {service_links}
      </div>
      <div class="footer-col">
        <h4>Regio's</h4>
        <a href="{base}werkgebied.html">Werkgebied</a>
        {location_links}
      </div>
      <div class="footer-col">
        <h4>Contact</h4>
        <a href="tel:{PHONE_TEL}">{PHONE_DISPLAY}</a>
        <a href="mailto:{EMAIL}">{EMAIL}</a>
        <a href="{base}contact.html">Offerte aanvragen</a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; 2026 BrabantSchoon &middot; KvK {KVK} &middot; {CITY}</span>
      <div class="footer-legal-links">
        <a href="{base}privacy.html">Privacyverklaring</a>
        <a href="{base}voorwaarden.html">Algemene voorwaarden</a>
        <a href="{base}cookiebeleid.html">Cookiebeleid</a>
      </div>
    </div>
  </div>
</footer>"""

# ---------------------------------------------------------------
# SHARED BLOCKS
# ---------------------------------------------------------------
def trust_strip():
    items = [("doc", f"KvK {KVK}"), ("pin", "Actief in heel Noord-Brabant"), ("chat", "Persoonlijk contact, geen callcenter")]
    spans = "\n      ".join(f'<span>{icon(n)}{t}</span>' for n, t in items)
    return f'<div class="trust"><div class="wrap trust-inner">{spans}</div></div>'

def cta_band(heading="Interesse in onze diensten?", sub="Vraag een vrijblijvende offerte aan of neem direct contact op.", base=""):
    return f"""<div class="cta-band reveal">
    <h2>{heading}</h2>
    <p>{sub}</p>
    <div class="hero-actions">
      <a href="{base}contact.html" class="btn btn-primary">Vrijblijvende offerte</a>
      <a href="tel:{PHONE_TEL}" class="btn btn-outline">Neem contact op</a>
    </div>
  </div>"""

def faq_block(items):
    return "\n      ".join(f'<details><summary>{q}<span class="chev">+</span></summary><p class="faq-a">{a}</p></details>' for q, a in items)

FAQ_ITEMS = [
    ("Wat kost schoonmaak door BrabantSchoon?", "Dat hangt af van de ruimte, frequentie en het type dienst. Na een kort gesprek ontvangt u een offerte op maat."),
    ("In welke regio\u2019s is BrabantSchoon actief?", f"We zijn voornamelijk actief in {CITY} en de Peelgemeenten: Deurne, Asten, Someren, Gemert-Bakel en Laarbeek, en verder in Eindhoven, Geldrop-Mierlo, Nuenen en Mierlo. Opdrachten daarbuiten bespreken we graag in overleg."),
    ("Werk ik steeds met dezelfde persoon of hetzelfde team?", "We streven naar continu\u00efteit, zodat u niet steeds opnieuw hoeft uit te leggen hoe u het wilt."),
    ("Kan ik ook een eenmalige schoonmaakbeurt aanvragen?", "Ja, naast vaste afspraken is een eenmalige beurt mogelijk, bijvoorbeeld bij een oplevering of verhuizing."),
]

def reviews_widget_block():
    return """<div class="reveal">
    <script src="https://elfsightcdn.com/platform.js" async></script>
    <div class="elfsight-app-d2e96685-a06e-40c9-96e3-375649773c8e" data-elfsight-app-lazy></div>
  </div>"""

FORM_SERVICE_OPTIONS = [
    "Kantoorreiniging", "Glasbewassing", "Gevelreiniging", "VvE-schoonmaak",
    "Opleveringsschoonmaak", "Specialistische reiniging", "Winkelreiniging",
    "Praktijkreiniging", "Trappenhuisreiniging", "Periodieke schoonmaak",
    "Eenmalige schoonmaak", "Anders...",
]

WIZARD_DIENSTEN = [
    ("Kantoorreiniging", "office", "Kantoor, praktijk of bedrijfspand"),
    ("Glasbewassing", "window", "Ramen en kozijnen binnen en buiten"),
    ("Gevelreiniging", "facade", "Buitengevel of buitenmuur"),
    ("VvE-schoonmaak", "building", "Trappenhuis of gemeenschappelijke ruimte"),
    ("Opleveringsschoonmaak", "key", "Verhuizing, oplevering of verbouwing"),
    ("Specialistische reiniging", "spark", "Tapijt, vloer of maatwerk"),
    ("Winkelreiniging", "shop", "Winkel of showroom"),
    ("Praktijkreiniging", "practice", "Zorg- of behandelpraktijk"),
    ("Trappenhuisreiniging", "stairs", "Gemeenschappelijk trappenhuis"),
    ("Periodieke schoonmaak", "clock", "Vast ritme, wekelijks of maandelijks"),
    ("Eenmalige schoonmaak", "check", "Losse, eenmalige beurt"),
    ("Anders...", "chat", "Vertel ons uw situatie"),
]

WIZARD_OPPERVLAKTE = [
    ("Klein", "Tot 50 m\u00b2"),
    ("Middel", "50 \u2013 150 m\u00b2"),
    ("Groot", "150 \u2013 500 m\u00b2"),
    ("Zeer groot", "500 m\u00b2 of meer"),
]

WIZARD_FREQUENTIE = [
    ("Eenmalig", "Losse beurt, geen vast contract"),
    ("Wekelijks", "Elke week hetzelfde ritme"),
    ("Meerdere keren per week", "Voor drukbezochte locaties"),
    ("Maandelijks", "Periodiek, op vaste afspraak"),
    ("In overleg", "We bespreken de frequentie samen"),
]

def radio_cards(name, options, columns=3):
    cards = []
    for opt in options:
        if len(opt) == 3:
            label, icon_name, desc = opt
            icon_html = f'<div class="rc-icon">{icon(icon_name)}</div>'
        else:
            label, desc = opt
            icon_html = ""
        opt_id = f"{name}-{re.sub(r'[^a-z0-9]+', '-', label.lower())}"
        cards.append(f"""<input type="radio" name="{name}" id="{opt_id}" value="{label}" class="rc-input" required>
      <label for="{opt_id}" class="rc-card">
        {icon_html}
        <span class="rc-label">{label}</span>
        <span class="rc-desc">{desc}</span>
      </label>""")
    return f'<div class="radio-cards cols-{columns}">' + "\n      ".join(cards) + "</div>"

def contact_form():
    dienst_cards = radio_cards("dienst", WIZARD_DIENSTEN, columns=3)
    opp_cards = radio_cards("oppervlakte", WIZARD_OPPERVLAKTE, columns=2)
    freq_cards = radio_cards("frequentie", WIZARD_FREQUENTIE, columns=2)
    return f"""<noscript><p class="prose" style="background:#FFF7E6; border:1px solid #F0D9A0; border-radius:12px; padding:16px 20px; margin-bottom:16px;">Dit formulier werkt het best met JavaScript ingeschakeld. Lukt dat niet? Bel of mail ons gerust rechtstreeks: <a href="tel:{PHONE_TEL}" style="color:var(--link); font-weight:600;">{PHONE_DISPLAY}</a> of <a href="mailto:{EMAIL}" style="color:var(--link); font-weight:600;">{EMAIL}</a>.</p></noscript>
  <form name="offerte" method="POST" action="https://api.web3forms.com/submit" class="wizard-form" id="offerteWizard">
    <input type="hidden" name="access_key" value="abc98c0d-af16-42b0-ae5c-3337f35e5299">
    <input type="hidden" name="subject" value="Nieuwe offerteaanvraag via de website">
    <input type="hidden" name="redirect" value="{SITE_URL}/thanks.html">
    <input type="checkbox" name="botcheck" class="hidden-field" tabindex="-1" autocomplete="off">

    <div class="wizard-progress" aria-hidden="true">
      <div class="wizard-progress-bar"><div class="wizard-progress-fill" id="wizardFill"></div></div>
      <div class="wizard-progress-steps">
        <span class="wp-step active" data-step-label="1">1<em>Dienst</em></span>
        <span class="wp-step" data-step-label="2">2<em>Oppervlakte</em></span>
        <span class="wp-step" data-step-label="3">3<em>Frequentie</em></span>
        <span class="wp-step" data-step-label="4">4<em>Toelichting</em></span>
        <span class="wp-step" data-step-label="5">5<em>Gegevens</em></span>
      </div>
    </div>

    <div class="wizard-step" data-step="1">
      <h3 class="wizard-q">Waar wilt u een offerte voor aanvragen?</h3>
      <p class="wizard-sub">Kies de dienst die het beste bij uw situatie past.</p>
      {dienst_cards}
    </div>

    <div class="wizard-step" data-step="2" hidden>
      <h3 class="wizard-q">Hoe groot is de locatie ongeveer?</h3>
      <p class="wizard-sub">Een schatting is voldoende.</p>
      {opp_cards}
    </div>

    <div class="wizard-step" data-step="3" hidden>
      <h3 class="wizard-q">Hoe vaak wilt u schoonmaak?</h3>
      <p class="wizard-sub">U kunt dit later altijd nog aanpassen.</p>
      {freq_cards}
    </div>

    <div class="wizard-step" data-step="4" hidden>
      <h3 class="wizard-q">Nog iets toe te lichten?</h3>
      <p class="wizard-sub">Beide velden zijn optioneel.</p>
      <div>
        <label for="startdatum">Gewenste startdatum <span style="font-weight:400;">(optioneel)</span></label>
        <input id="startdatum" name="startdatum" type="text" placeholder="Bijv. zo snel mogelijk">
      </div>
      <div style="margin-top:14px;">
        <label for="bericht">Omschrijf uw opdracht <span style="font-weight:400;">(optioneel)</span></label>
        <textarea id="bericht" name="bericht" rows="4" placeholder="Vertel kort wat er schoongemaakt moet worden, hoe groot de locatie is en hoe vaak u schoonmaak wenst."></textarea>
      </div>
    </div>

    <div class="wizard-step" data-step="5" hidden>
      <h3 class="wizard-q">Uw gegevens</h3>
      <p class="wizard-sub">Zodat we contact met u kunnen opnemen.</p>
      <div class="row2">
        <div><label for="naam">Naam</label><input id="naam" name="naam" type="text" required placeholder="Voor- en achternaam"></div>
        <div><label for="bedrijfsnaam">Bedrijfsnaam <span style="font-weight:400;">(optioneel)</span></label><input id="bedrijfsnaam" name="bedrijfsnaam" type="text" placeholder="Naam van uw bedrijf"></div>
      </div>
      <div class="row2">
        <div><label for="email">E-mailadres</label><input id="email" name="email" type="email" required placeholder="jij@voorbeeld.nl"></div>
        <div><label for="telefoon">Telefoonnummer</label><input id="telefoon" name="telefoon" type="tel" required placeholder="06 - 12 34 56 78"></div>
      </div>
      <div><label for="plaats">Plaats</label><input id="plaats" name="plaats" type="text" required placeholder="Bijv. Helmond"></div>
    </div>

    <div class="wizard-nav">
      <button type="button" class="btn btn-outline wizard-back" id="wizardBack" hidden>Terug</button>
      <button type="button" class="btn btn-primary wizard-next" id="wizardNext">Volgende</button>
      <button type="submit" class="btn btn-primary wizard-submit" id="wizardSubmit" hidden>Vraag vrijblijvende offerte aan</button>
    </div>
  </form>"""

def contact_info_block(base="", show_heading=True):
    heading = '<span class="eyebrow">Contact</span>\n    <h2>Vraag uw offerte aan.</h2>\n    <p>Neem contact op via telefoon, e-mail of het formulier. We reageren binnen \u00e9\u00e9n werkdag.</p>' if show_heading else ''
    return f"""<div class="contact-info">
    {heading}
    <div class="contact-line">{icon('phone')}<a href="tel:{PHONE_TEL}">{PHONE_DISPLAY}</a></div>
    <div class="contact-line">{icon('mail')}<a href="mailto:{EMAIL}">{EMAIL}</a></div>
    <div class="contact-line">{icon('pin')}<span style="font-weight:600; font-size:15.5px;">Actief vanuit {CITY}, heel Noord-Brabant</span></div>
    <div class="contact-actions">
      <a href="{WA_LINK}" class="btn btn-outline" target="_blank" rel="noopener">WhatsApp</a>
      <a href="tel:{PHONE_TEL}" class="btn btn-outline">Bel direct</a>
    </div>
    <div class="contact-map">
      <iframe src="https://www.google.com/maps?q={CITY},+Noord-Brabant&output=embed" width="100%" height="280" style="border:0; border-radius:16px;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="BrabantSchoon werkgebied - {CITY}"></iframe>
    </div>
  </div>"""

def page_shell(title, description, path, base, active, body, extra_schema="", preload_image=None):
    return f"""<!DOCTYPE html>
<html lang="nl">
<head>
{render_head(title, description, path, base, extra_schema, preload_image)}
</head>
<body>
{render_header(base, active)}
<main id="main-content">
{body}
</main>
{render_footer(base)}
<div class="mobile-cta-bar">
  <a href="tel:{PHONE_TEL}" class="btn btn-outline">Bel direct</a>
  <a href="{base}contact.html" class="btn btn-primary">Vrijblijvende offerte</a>
</div>
<script src="{base}js/main.js?v={ASSET_VERSION}" defer></script>
</body>
</html>
"""

def write(path, content):
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(content)
    print("wrote", path)

# =================================================================
# HOME
# =================================================================
def build_home():
    base = ""
    service_cards = "\n    ".join(f"""<a href="diensten/{s['slug']}.html" class="service-card">
      <div class="thumb {s['tint']}">{service_visual_from_root(s)}</div>
      <div class="body">
        <h3>{s['name']}</h3>
        <p>{s['short']}</p>
      </div>
    </a>""" for s in SERVICES[:6])

    usp_items = [
        ("chat", "Vast aanspreekpunt", "U spreekt altijd met iemand die uw locatie en wensen kent \u2014 geen callcenter."),
        ("check", "Afspraak is afspraak", "Heldere planning die we nakomen, zonder verrassingen achteraf."),
        ("clock", "Flexibiliteit", "Frequentie en tijdstip volledig afgestemd op uw organisatie."),
        ("spark", "Kwaliteitscontrole", "Iedere beurt wordt gecontroleerd, niet alleen bij de start."),
    ]
    usp_html = "\n    ".join(f'<div class="usp"><div class="icon-circle">{icon(n)}</div><h3>{t}</h3><p>{d}</p></div>' for n, t, d in usp_items)

    sector_tags = "\n      ".join(f'<span class="area-tag primary">{s}</span>' for s in
        ["Kantoren", "Bedrijfsverzamelgebouwen", "VvE's", "Scholen", "Vastgoedbeheerders", "Winkels &amp; praktijken"])
    kern_tags = "\n      ".join(f'<span class="area-tag">{c}</span>' for c in WERKGEBIED_KERN + WERKGEBIED_OVERIG)

    body = f"""
  <section class="hero-full">
    <img src="images/hero.jpg" alt="Bedrijfswagens en medewerker van BrabantSchoon bij een klant in Zuidoost-Brabant" class="hero-full-img" width="1600" height="1067" fetchpriority="high" decoding="async">
    <div class="hero-full-overlay"></div>
    <div class="wrap hero-full-content">
      <span class="eyebrow" style="color:#BFE0FF;">Professionele schoonmaak voor bedrijven</span>
      <h1>Professionele schoonmaak. Altijd geregeld.</h1>
      <p class="lead" style="color:rgba(255,255,255,0.9);">Voor kantoren, VvE's en organisaties in Noord-Brabant. Vaste kwaliteit, duidelijke communicatie en \u00e9\u00e9n betrouwbaar aanspreekpunt.</p>
      <div class="hero-actions">
        <a href="contact.html" class="btn btn-primary">Gratis offerte aanvragen</a>
        <a href="#diensten" class="btn btn-ghost-light">Bekijk onze diensten</a>
      </div>
      <ul class="hero-checklist">
        <li>{icon('check')}Vast aanspreekpunt</li>
        <li>{icon('check')}Flexibele planning</li>
        <li>{icon('check')}Professionele medewerkers</li>
        <li>{icon('check')}Actief in heel Noord-Brabant</li>
      </ul>
    </div>
  </section>

  <section id="diensten">
    <div class="wrap">
      <div class="sec-head reveal">
        <span class="eyebrow">Diensten</span>
        <h2>Wat wij doen.</h2>
      </div>
      <div class="grid-3 reveal">
        {service_cards}
      </div>
      <div class="sec-foot"><a href="diensten.html" class="btn btn-outline">Alle diensten</a></div>
    </div>
  </section>

  <section>
    <div class="wrap">
      <div class="sec-head reveal">
        <span class="eyebrow">Waarom BrabantSchoon</span>
        <h2>Waarom bedrijven voor BrabantSchoon kiezen.</h2>
      </div>
      <div class="usp-grid reveal">
        {usp_html}
      </div>
      <div class="steps reveal" style="margin-top:56px; border-top:1px solid var(--line); padding-top:40px;">
        <div class="step"><div class="stepnum">{icon('chat')}01</div><h3>Aanvraag</h3><p>U laat weten wat u nodig heeft; wij denken direct mee over de aanpak.</p></div>
        <div class="step"><div class="stepnum">{icon('pin')}02</div><h3>Locatiebezoek</h3><p>Een vrijblijvend gesprek op locatie, zodat de offerte precies aansluit op uw situatie.</p></div>
        <div class="step"><div class="stepnum">{icon('doc')}03</div><h3>Offerte</h3><p>Een heldere offerte met vaste prijs en planning, zonder kleine lettertjes.</p></div>
        <div class="step"><div class="stepnum">{icon('check')}04</div><h3>Uitvoering</h3><p>Een vast team gaat aan de slag; kwaliteit wordt doorlopend gecontroleerd.</p></div>
      </div>
    </div>
  </section>

  <section style="background:var(--bg-soft);">
    <div class="wrap">
      <div class="sec-head reveal">
        <span class="eyebrow">Voor wie, en waar</span>
        <h2>Sectoren &amp; werkgebied.</h2>
      </div>
      <div class="area-tags reveal">
        {sector_tags}
      </div>
      <div class="area-tags reveal" style="margin-top:14px;">
        {kern_tags}
      </div>
      <p class="prose reveal" style="text-align:center; margin-top:20px;">Uw organisatie of locatie staat er niet bij? <a href="contact.html" style="color:var(--link); font-weight:600;">Neem contact op</a> &mdash; we denken graag mee.</p>
    </div>
  </section>

  <section id="faq" class="section-tight">
    <div class="wrap">
      <div class="sec-head reveal">
        <span class="eyebrow">Veelgestelde vragen</span>
        <h2>Nog vragen?</h2>
      </div>
      <div class="faq reveal">
        {faq_block(FAQ_ITEMS[:3])}
      </div>
    </div>
  </section>

  {trust_strip()}
"""
    write("index.html", page_shell(
        "BrabantSchoon | Schoonmaakbedrijf Helmond &amp; Peelgemeenten",
        f"BrabantSchoon verzorgt kantoorreiniging, glasbewassing en VvE-schoonmaak voor bedrijven in Helmond en de Peelgemeenten. Vraag een vrijblijvende offerte aan.",
        "", base, "index.html", body, LOCALBUSINESS_SCHEMA + "\n" + faq_schema(FAQ_ITEMS[:3]),
        preload_image="images/hero.jpg"
    ))

def page_hero(eyebrow, title, lead, base, crumb_label, image=None, image_alt=""):
    if image:
        return f"""<section class="hero-full hero-full-inner">
    <img src="{image}" alt="{image_alt}" class="hero-full-img" width="1200" height="800" decoding="async">
    <div class="hero-full-overlay"></div>
    <div class="wrap hero-full-content">
      <div class="breadcrumb" style="color:rgba(255,255,255,0.75);"><a href="{base}index.html" style="color:rgba(255,255,255,0.9);">Home</a> &nbsp;/&nbsp; {crumb_label}</div>
      <span class="eyebrow" style="color:#BFE0FF;">{eyebrow}</span>
      <h1>{title}</h1>
      <p class="lead" style="color:rgba(255,255,255,0.9);">{lead}</p>
    </div>
  </section>"""
    return f"""<section class="page-hero">
    <div class="wrap">
      <div class="breadcrumb"><a href="{base}index.html">Home</a> &nbsp;/&nbsp; {crumb_label}</div>
      <span class="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p class="lead">{lead}</p>
    </div>
  </section>"""

# =================================================================
# DIENSTEN OVERVIEW
# =================================================================
def build_diensten_overview():
    base = ""
    cards = "\n    ".join(f"""<a href="diensten/{s['slug']}.html" class="service-card">
      <div class="thumb {s['tint']}">{service_visual_from_root(s)}</div>
      <div class="body"><h3>{s['name']}</h3><p>{s['short']}</p><span class="sc-link">Meer informatie {icon('arrow','')}</span></div>
    </a>""" for s in SERVICES)
    body = f"""
  {page_hero("Diensten", "Onze diensten.", "Van dagelijks onderhoud tot specialistisch werk.", base, "Diensten")}
  <section>
    <div class="wrap">
      <div class="grid-3 reveal">{cards}</div>
    </div>
  </section>
  <section style="background:var(--bg-soft);"><div class="wrap">{cta_band(base=base)}</div></section>
"""
    write("diensten.html", page_shell(
        "Diensten | Schoonmaakbedrijf Helmond &amp; Noord-Brabant",
        f"Bekijk alle diensten van BrabantSchoon: kantoorreiniging, glasbewassing, gevelreiniging, opleveringsschoonmaak en meer in {CITY} en omgeving.",
        "diensten.html", base, "diensten.html", body, breadcrumb_schema("Diensten", "diensten.html")
    ))

# =================================================================
# SERVICE PAGES
# =================================================================
def build_service_pages():
    base = "../"
    for s in SERVICES:
        bullets_html = "\n          ".join(f"<li>{b}</li>" for b in s["bullets"])
        others = [o for o in SERVICES if o["slug"] != s["slug"]][:3]
        others_html = "\n    ".join(f"""<a href="{o['slug']}.html" class="service-card">
      <div class="thumb {o['tint']}">{service_visual(o)}</div>
      <div class="body"><h3>{o['name']}</h3><p>{o['short']}</p></div>
    </a>""" for o in others)
        faq_html = faq_block(s["faqs"])
        photo = SERVICE_PHOTOS.get(s["slug"])
        hero = page_hero("Dienst", s['name'], s['short'], base, s['name'],
                          image=f"../images/{photo}" if photo else None,
                          image_alt=f"{s['name']} door BrabantSchoon")
        body = f"""
  {hero}
  <section class="section-tight">
    <div class="wrap">
      <div class="two-col reveal">
        <div>
          <p class="prose">{s['intro']}</p>
          <ul class="prose" style="margin-top:16px;">{bullets_html}</ul>
          <div class="hero-actions" style="margin-top:24px;">
            <a href="{base}contact.html" class="btn btn-primary">Vraag offerte aan</a>
            <a href="tel:{PHONE_TEL}" class="btn btn-outline">Bel direct</a>
          </div>
        </div>
        <div>
          <p class="prose"><strong style="color:var(--ink);">Geschikt voor:</strong> {s['for']}</p>
          <div class="faq" style="margin-top:20px;">{faq_html}</div>
        </div>
      </div>
    </div>
  </section>
  <section style="background:var(--bg-soft);">
    <div class="wrap">
      <div class="sec-head reveal"><span class="eyebrow">Ook interessant</span><h2>Andere diensten</h2></div>
      <div class="grid-3 reveal">{others_html}</div>
    </div>
  </section>
  <section><div class="wrap">{cta_band(f"Interesse in {s['name']}?", "Vraag een vrijblijvende offerte aan.", base)}</div></section>
  <section class="section-tight">
    <div class="wrap-narrow" style="text-align:center;">
      <p class="prose">Actief in <a href="{base}werkgebied.html" style="color:var(--link); font-weight:600;">heel Noord-Brabant</a> &mdash; bekijk ook onze <a href="{base}diensten.html" style="color:var(--link); font-weight:600;">overige diensten</a>.</p>
    </div>
  </section>
"""
        write(f"diensten/{s['slug']}.html", page_shell(
            f"{s['name']} {CITY} | BrabantSchoon",
            f"{s['short']} BrabantSchoon verzorgt {s['name'].lower()} in {CITY} en de Peelgemeenten.",
            f"diensten/{s['slug']}.html", base, "diensten.html",
            body, service_schema(s) + "\n" + breadcrumb_schema(s['name'], f"diensten/{s['slug']}.html") + "\n" + faq_schema(s["faqs"])
        ))

# =================================================================
# OVER ONS
# =================================================================
def build_over_ons():
    base = ""
    body = f"""
  {page_hero("Over ons", "Persoonlijk en professioneel.", f"Een schoonmaakpartner uit {CITY}, met korte lijnen en heldere afspraken.", base, "Over ons", image="images/over-ons.jpg", image_alt="Medewerker van BrabantSchoon bij de receptie in Helmond")}
  <section class="section-tight">
    <div class="wrap-narrow">
      <p class="prose">BrabantSchoon is de schoonmaakpartner voor kantoren, bedrijfsverzamelgebouwen, VvE's en scholen in {CITY} en de Peelgemeenten &mdash; en we rijden verder voor de juiste opdracht. Geen callcenter: direct contact met wie uw locatie kent, en afspraken die we nakomen.</p>
      <div class="hero-actions" style="margin-top:24px;">
        <a href="{base}diensten.html" class="btn btn-outline">Onze diensten</a>
        <a href="{base}werkgebied.html" class="btn btn-outline">Ons werkgebied</a>
      </div>
    </div>
  </section>
  <section style="background:var(--bg-soft);"><div class="wrap">{cta_band(base=base)}</div></section>
"""
    write("over-ons.html", page_shell(
        "Over ons | BrabantSchoon Schoonmaakbedrijf",
        f"BrabantSchoon is een schoonmaakbedrijf uit {CITY}, met de Peelgemeenten als kerngebied en actief in heel Noord-Brabant.",
        "over-ons.html", base, "over-ons.html", body, breadcrumb_schema("Over ons", "over-ons.html")
    ))

# =================================================================
# WERKGEBIED
# =================================================================
WERKGEBIED_TEKST = {
    "Helmond": "Onze thuisbasis. Kantoren, winkels en VvE's, kort op de weg.",
    "Deurne": "Bedrijfspanden en praktijken, van centrum tot bedrijventerrein.",
    "Asten": "Goed bereikbaar vanuit Helmond, eenmalig of periodiek.",
    "Someren": "Kantoren en VvE's, persoonlijke aanpak voor lokale organisaties.",
    "Gemert-Bakel": "Gemert en Bakel, met dezelfde zorg als in Helmond zelf.",
    "Laarbeek": "Beek en Donk, Aarle-Rixtel en Mariahout, vast en betrouwbaar.",
    "Eindhoven": "Kantoorreiniging en opleveringsschoonmaak, regelmatig actief.",
    "Geldrop-Mierlo": "Op de route Helmond-Eindhoven, structureel inzetbaar.",
    "Nuenen": "Kleinere kantoren en praktijken, persoonlijk contact voorop.",
    "Mierlo": "Onderdeel van Geldrop-Mierlo, dezelfde vaste aanpak.",
}

# Steden buiten het kerngebied: eigen landingspagina, eerlijk over de afstand,
# gericht op grotere of terugkerende opdrachten in plaats van een claim van lokale aanwezigheid.
LOCATIONS = [
    {
        "slug": "tilburg", "name": "Tilburg",
        "intro": "Tilburg ligt buiten ons kerngebied in de Peel, maar we rijden geregeld uit naar de stad voor kantoorreiniging, opleveringsschoonmaak en VvE-schoonmaak. Vooral voor grotere of terugkerende opdrachten is een vaste planning vanuit Helmond goed te combineren.",
        "faq_q": "Rijden jullie ook naar Tilburg voor kleinere klussen?",
        "faq_a": "Voor kleine, eenmalige klussen in Tilburg is de reistijd vanuit Helmond niet altijd rendabel. Voor grotere of terugkerende opdrachten, zoals wekelijkse kantoorreiniging, is dit meestal wel mogelijk. Neem contact op om de mogelijkheden te bespreken.",
    },
    {
        "slug": "breda", "name": "Breda",
        "intro": "Breda ligt verder van ons kerngebied in de Peel, maar voor substanti\u00eble opdrachten \u2014 zoals een vast kantoorcontract, VvE-schoonmaak of een grote opleveringsschoonmaak \u2014 rijden we ook hiernaartoe.",
        "faq_q": "Is een eenmalige beurt in Breda mogelijk?",
        "faq_a": "Dat hangt af van de omvang van de klus. Neem contact op met de details van uw situatie, dan laten we u weten of het rendabel is in te plannen.",
    },
    {
        "slug": "den-bosch", "name": "Den Bosch",
        "intro": "'s-Hertogenbosch ligt op een goed bereikbare afstand vanuit Helmond. Voor kantoorreiniging, VvE-schoonmaak en opleveringsschoonmaak zijn we hier regelmatig inzetbaar.",
        "faq_q": "Werken jullie ook voor VvE's in Den Bosch?",
        "faq_a": "Ja, we verzorgen schoonmaak van trappenhuizen en gemeenschappelijke ruimtes voor VvE's in en rond 's-Hertogenbosch, in overleg met het bestuur.",
    },
    {
        "slug": "waalwijk", "name": "Waalwijk",
        "intro": "Waalwijk ligt tussen Tilburg en 's-Hertogenbosch in. Voor bedrijven en VvE's in Waalwijk verzorgen we schoonmaak op aanvraag, vooral bij grotere of vaste opdrachten.",
        "faq_q": "Kunnen jullie een vast schoonmaakcontract voor Waalwijk verzorgen?",
        "faq_a": "Ja, voor een vast, terugkerend contract is Waalwijk goed inpasbaar in onze planning. Neem contact op om de mogelijkheden te bespreken.",
    },
]

def build_werkgebied():
    base = ""
    all_cities = WERKGEBIED_KERN + WERKGEBIED_OVERIG
    city_cards = "\n        ".join(f'<div class="card" style="padding:20px 22px;"><h3 style="font-family:\'Inter\',sans-serif; font-size:15px; font-weight:700;">{c}</h3><p style="color:var(--ink-soft); font-size:13.5px; margin-top:6px;">{WERKGEBIED_TEKST[c]}</p></div>' for c in all_cities)
    location_links = "\n        ".join(f'<a href="{base}locaties/{loc["slug"]}.html" class="card" style="display:block; text-decoration:none; color:inherit; padding:20px 22px;"><h3 style="font-family:\'Inter\',sans-serif; font-size:15px; font-weight:700;">{loc["name"]}</h3><span class="sc-link" style="margin-top:8px;">Meer info {icon("arrow","")}</span></a>' for loc in LOCATIONS)
    body = f"""
  {page_hero("Werkgebied", "Actief in heel Noord-Brabant.", f"Gevestigd in {CITY}, met de Peelgemeenten als kerngebied \u2014 en we rijden verder voor de juiste opdracht.", base, "Werkgebied")}
  <section class="section-tight">
    <div class="wrap">
      <div class="grid-4 reveal">{city_cards}</div>
    </div>
  </section>
  <section class="section-tight" style="background:var(--bg-soft);">
    <div class="wrap">
      <div class="sec-head reveal"><span class="eyebrow">Verder in Brabant</span><h2>Ook actief hier, voor grotere opdrachten.</h2></div>
      <div class="grid-4 reveal">{location_links}</div>
    </div>
  </section>
  <section>
    <div class="wrap">
      {cta_band(base=base)}
    </div>
  </section>
"""
    write("werkgebied.html", page_shell(
        "Werkgebied | BrabantSchoon Helmond &amp; omstreken",
        f"BrabantSchoon is gevestigd in Helmond, met de Peelgemeenten als kerngebied \u2014 en actief in heel Noord-Brabant.",
        "werkgebied.html", base, "werkgebied.html", body, breadcrumb_schema("Werkgebied", "werkgebied.html")
    ))

# =================================================================
# CONTACT
# =================================================================
# =================================================================
# LOCATIEPAGINA'S (steden buiten het kerngebied)
# =================================================================
def build_location_pages():
    base = "../"
    for loc in LOCATIONS:
        others = [o for o in LOCATIONS if o["slug"] != loc["slug"]][:3]
        others_html = "\n        ".join(f'<a href="{o["slug"]}.html" class="card" style="display:block; text-decoration:none; color:inherit;"><h3 style="font-family:\'Inter\',sans-serif; font-size:16px; font-weight:700;">{o["name"]}</h3></a>' for o in others)
        service_mentions = "\n        ".join(f"""<a href="{base}diensten/{s['slug']}.html" class="service-card">
      <div class="thumb {s['tint']}">{service_visual(s)}</div>
      <div class="body"><h3>{s['name']}</h3><p>{s['short']}</p></div>
    </a>""" for s in SERVICES[:6])
        body = f"""
  {page_hero("Werkgebied", f"Schoonmaakbedrijf voor {loc['name']}.", loc['intro'], base, loc['name'])}
  <section>
    <div class="wrap">
      <div class="two-col reveal">
        <div>
          <p class="prose">Ons kerngebied is Helmond en de Peelgemeenten \u2014 vandaar rijden we uit. Voor {loc['name']} werken we vooral bij grotere of terugkerende opdrachten, zoals een vast kantoorcontract, VvE-schoonmaak of een omvangrijke opleveringsschoonmaak.</p>
          <div class="hero-actions" style="margin-top:26px;">
            <a href="{base}contact.html" class="btn btn-primary">Vraag offerte aan</a>
            <a href="tel:{PHONE_TEL}" class="btn btn-outline">Bel direct</a>
          </div>
        </div>
        <div class="illustration-panel sm">{service_illustration('building')}</div>
      </div>
    </div>
  </section>
  <section style="background:var(--bg-soft);">
    <div class="wrap">
      <div class="sec-head reveal"><span class="eyebrow">Diensten</span><h2>Wat we ook in {loc['name']} verzorgen</h2></div>
      <div class="grid-3 reveal">{service_mentions}</div>
    </div>
  </section>
  <section>
    <div class="wrap">
      <div class="sec-head reveal"><span class="eyebrow">Veelgestelde vraag</span><h2>Over {loc['name']}</h2></div>
      <div class="faq reveal">{faq_block([(loc['faq_q'], loc['faq_a'])])}</div>
    </div>
  </section>
  <section style="background:var(--bg-soft);">
    <div class="wrap">
      <div class="sec-head reveal"><span class="eyebrow">Ook interessant</span><h2>Andere regio's</h2></div>
      <div class="grid-3 reveal">{others_html}</div>
    </div>
  </section>
  <section><div class="wrap">{cta_band(f"Schoonmaak nodig in {loc['name']}?", "Vraag een vrijblijvende offerte aan.", base)}</div></section>
"""
        title = f"Schoonmaakbedrijf {loc['name']} | BrabantSchoon"
        desc = f"BrabantSchoon verzorgt kantoorreiniging en VvE-schoonmaak voor grotere opdrachten in {loc['name']}. Gevestigd in Helmond."
        write(f"locaties/{loc['slug']}.html", page_shell(
            title, desc, f"locaties/{loc['slug']}.html", base, "werkgebied.html", body,
            breadcrumb_schema(loc['name'], f"locaties/{loc['slug']}.html") + "\n" + faq_schema([(loc['faq_q'], loc['faq_a'])])
        ))

def build_contact():
    base = ""
    body = f"""
  {page_hero("Contact", "Neem contact op.", "We reageren binnen \u00e9\u00e9n werkdag.", base, "Contact")}
  <section>
    <div class="wrap">
      {reviews_widget_block()}
      <div class="benefits-strip reveal">
        <span>{icon('check')}Vrijblijvende offerte</span>
        <span>{icon('clock')}Reactie binnen \u00e9\u00e9n werkdag</span>
        <span>{icon('doc')}Geen verborgen kosten</span>
        <span>{icon('pin')}Actief in heel Noord-Brabant</span>
      </div>
      <div class="contact-grid reveal">
        {contact_info_block(base, show_heading=False)}
        {contact_form()}
      </div>
    </div>
  </section>
"""
    write("contact.html", page_shell(
        "Contact | BrabantSchoon Schoonmaakbedrijf Noord-Brabant",
        "Neem contact op met BrabantSchoon of vraag direct een vrijblijvende offerte aan. Kerngebied Helmond en de Peelgemeenten, actief in heel Noord-Brabant.",
        "contact.html", base, "contact.html", body, LOCALBUSINESS_SCHEMA + "\n" + breadcrumb_schema("Contact", "contact.html")
    ))

# =================================================================
# THANKS / LEGAL
# =================================================================
def build_thanks():
    body = f"""
  <section style="min-height:56vh; display:flex; align-items:center; justify-content:center; text-align:center;">
    <div class="wrap-narrow">
      <img src="images/logo.png" alt="BrabantSchoon" width="136" height="34" style="height:34px; width:auto; margin:0 auto 20px;">
      <h1 style="font-size:34px;">Bedankt voor uw aanvraag.</h1>
      <p class="prose" style="margin-top:12px;">We hebben uw bericht ontvangen en nemen binnen \u00e9\u00e9n werkdag contact met u op.</p>
      <a class="btn btn-primary" href="index.html" style="margin-top:24px;">Terug naar de website</a>
    </div>
  </section>
"""
    write("thanks.html", page_shell("Bedankt | BrabantSchoon", "Bedankt voor uw offerteaanvraag bij BrabantSchoon. We nemen binnen \u00e9\u00e9n werkdag contact met u op.", "thanks.html", "", "", body))

def build_legal():
    base = ""
    privacy = f"""
  {page_hero("Juridisch", "Privacyverklaring.", "Hoe BrabantSchoon omgaat met uw persoonsgegevens.", base, "Privacyverklaring")}
  <section><div class="wrap-narrow prose reveal">
    <p><em>Dit is een voorbeeldtekst. Laat deze controleren door een jurist voordat u ze publiceert.</em></p>
    <h2>Welke gegevens verzamelen wij</h2>
    <p>Via het offerteformulier verzamelen we naam, telefoonnummer, e-mailadres, plaats en uw bericht, uitsluitend om contact met u op te nemen.</p>
    <h2>Gebruik van gegevens</h2>
    <p>Wij gebruiken uw gegevens uitsluitend om uw aanvraag te behandelen en, indien u klant wordt, de dienstverlening uit te voeren.</p>
    <h2>Uw rechten</h2>
    <p>U heeft recht op inzage, correctie en verwijdering van uw gegevens. Neem hiervoor contact op via {EMAIL}.</p>
  </div></section>
"""
    write("privacy.html", page_shell("Privacyverklaring | BrabantSchoon", "Lees hoe BrabantSchoon omgaat met uw persoonsgegevens bij een offerteaanvraag of samenwerking.", "privacy.html", base, "", privacy))

    voorwaarden = f"""
  {page_hero("Juridisch", "Algemene voorwaarden.", "De voorwaarden die van toepassing zijn op onze dienstverlening.", base, "Algemene voorwaarden")}
  <section><div class="wrap-narrow prose reveal">
    <p><em>Dit is een voorbeeldtekst. Laat deze opstellen of controleren door een jurist voordat u ze publiceert.</em></p>
    <h2>Toepasselijkheid</h2>
    <p>Deze voorwaarden zijn van toepassing op alle offertes en overeenkomsten tussen BrabantSchoon en haar klanten.</p>
    <h2>Offertes</h2>
    <p>Offertes zijn vrijblijvend en gebaseerd op de informatie die tijdens het contact is verstrekt.</p>
    <h2>Contact</h2>
    <p>Vragen? Neem contact op via {EMAIL}.</p>
  </div></section>
"""
    write("voorwaarden.html", page_shell("Algemene voorwaarden | BrabantSchoon", "De algemene voorwaarden die gelden voor offertes en opdrachten bij BrabantSchoon.", "voorwaarden.html", base, "", voorwaarden))

    cookies = f"""
  {page_hero("Juridisch", "Cookiebeleid.", "Welke cookies en externe diensten deze website gebruikt.", base, "Cookiebeleid")}
  <section><div class="wrap-narrow prose reveal">
    <p><em>Dit is een voorbeeldtekst. Laat deze controleren door een jurist voordat u ze publiceert.</em></p>
    <h2>Gebruikt deze website cookies?</h2>
    <p>Deze website plaatst geen advertentie- of trackingcookies. Er wordt alleen gebruikgemaakt van functionele onderdelen die nodig zijn om de site goed te laten werken.</p>
    <h2>Google Maps</h2>
    <p>Op de contactpagina tonen we een kaart via Google Maps. Google kan hierbij gegevens verzamelen conform het eigen privacybeleid van Google.</p>
    <h2>Offerteformulier</h2>
    <p>Het offerteformulier wordt verwerkt via een externe formulierdienst. Zie onze <a href="{base}privacy.html" style="color:var(--link); font-weight:600;">privacyverklaring</a> voor meer informatie over hoe wij met uw gegevens omgaan.</p>
    <h2>Vragen</h2>
    <p>Vragen over dit cookiebeleid? Neem contact op via {EMAIL}.</p>
  </div></section>
"""
    write("cookiebeleid.html", page_shell("Cookiebeleid | BrabantSchoon", "Lees welke cookies en externe diensten, zoals Google Maps, BrabantSchoon.nl gebruikt en waarom.", "cookiebeleid.html", base, "", cookies))

# =================================================================
# SEO FILES
# =================================================================
def build_seo_files():
    import datetime
    today = datetime.date.today().isoformat()
    urls = [
        ("", "1.0"), ("diensten.html", "0.9"), ("werkgebied.html", "0.9"),
        ("over-ons.html", "0.7"), ("contact.html", "0.8"),
        ("privacy.html", "0.3"), ("voorwaarden.html", "0.3"), ("cookiebeleid.html", "0.3"),
    ]
    urls += [(f"diensten/{s['slug']}.html", "0.8") for s in SERVICES]
    urls += [(f"locaties/{loc['slug']}.html", "0.8") for loc in LOCATIONS]
    entries = "\n  ".join(
        f"<url><loc>{SITE_URL}/{u}</loc><lastmod>{today}</lastmod><changefreq>monthly</changefreq><priority>{p}</priority></url>"
        for u, p in urls
    )
    write("sitemap.xml", f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  {entries}\n</urlset>\n')
    write("robots.txt", f"User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}/sitemap.xml\n")
    write(".htaccess", """# Forceer HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301,NE]

# Forceer www (pas aan als je zonder www wilt)
RewriteCond %{HTTP_HOST} !^www\\. [NC]
RewriteRule ^(.*)$ https://www.%{HTTP_HOST}/$1 [L,R=301]

# Nette 404 zonder mapoverzicht
Options -Indexes

# Cache statische bestanden
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpeg "access plus 1 month"
  ExpiresByType image/png "access plus 1 month"
  ExpiresByType text/css "access plus 1 week"
  ExpiresByType application/javascript "access plus 1 week"
</IfModule>
""")

# =================================================================
if __name__ == "__main__":
    build_home()
    build_diensten_overview()
    build_service_pages()
    build_over_ons()
    build_werkgebied()
    build_location_pages()
    build_contact()
    build_thanks()
    build_legal()
    build_seo_files()
    print("\nKlaar.")
