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
ASSET_VERSION = "100"

# ---------------------------------------------------------------
# ICONS
# ---------------------------------------------------------------
ICONS = {
    "check": '<path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/>',
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
    "whatsapp-fill": '<path fill="currentColor" stroke="none" d="M12.02 2C6.5 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l5.08-1.33A9.96 9.96 0 0 0 12.02 22C17.55 22 22 17.52 22 12S17.55 2 12.02 2Zm5.84 14.14c-.24.68-1.4 1.3-1.94 1.35-.5.05-1.13.07-1.82-.12-.42-.11-.96-.31-1.65-.6-2.9-1.25-4.8-4.17-4.94-4.36-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.02-2.42.27-.29.58-.36.78-.36l.55.01c.18.01.42-.07.65.5.24.58.82 2.01.89 2.15.07.15.12.32.02.51-.1.19-.15.31-.3.48-.15.17-.31.38-.44.51-.15.14-.3.3-.13.6.17.29.76 1.26 1.64 2.04 1.13 1 2.08 1.32 2.37 1.47.29.15.46.12.63-.07.17-.19.72-.84.92-1.13.19-.29.38-.24.63-.14.26.1 1.65.78 1.93.92.29.14.48.21.55.33.07.12.07.68-.17 1.36Z"/>',
    "chevron": '<path d="M6 9l6 6 6-6"/>',
    "doc": '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h5"/>',
    "arrow": '<path d="M5 12h14M13 6l6 6-6 6"/>',
    "shop": '<path d="M3 9l1-5h16l1 5"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/>',
    "practice": '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    "school": '<path d="M12 3 2 8l10 5 10-5-10-5Z"/><path d="M6 10.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5"/>',
    "close": '<path d="M18 6 6 18M6 6l12 12"/>',
    "stairs": '<path d="M4 20h4v-4h4v-4h4V8h4"/><path d="M4 20V8h4"/>',
}

ICON_VIEWBOX = {
    "whatsapp-fill": "-0.54 -0.60 25.08 25.20",
}

def icon(name, cls="icon"):
    vb = ICON_VIEWBOX.get(name, "0 0 24 24")
    return f'<svg class="{cls}" viewBox="{vb}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">{ICONS[name]}</svg>'

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

# Plaatsenlijst voor de doorzoekbare locatie-invoer in de calculator.
# Losstaand van WERKGEBIED_KERN/OVERIG omdat dit een bredere, servicegerichte
# lijst is (ook plaatsen buiten het kerngebied), niet het officiele werkgebied.
# Belangrijkste/grootste plaatsen: worden standaard getoond zodra het veld opent (nog niets getypt)
CALCULATOR_CITIES_PRIORITY = [
    "Eindhoven", "Tilburg", "Breda", "Den Bosch", "Helmond", "Best", "Veldhoven", "Oss",
]

# Volledige lijst, doorzoekbaar tijdens typen (grote steden + alle genoemde kleinere plaatsen)
CALCULATOR_CITIES = [
    "Eindhoven", "Tilburg", "Breda", "Den Bosch", "Helmond", "Oss", "Roosendaal",
    "Bergen op Zoom", "Oosterhout", "Waalwijk", "Etten-Leur", "Best", "Veldhoven",
    "Valkenswaard", "Oirschot", "Bladel", "Eersel", "Reusel", "Son en Breugel",
    "Geldrop", "Mierlo", "Nuenen", "Deurne", "Gemert", "Bakel", "Milheeze", "Handel",
    "Someren", "Asten", "Laarbeek", "Beek en Donk", "Lieshout", "Erp", "Veghel",
    "Uden", "Boekel",
    "Overige plaats in Noord-Brabant",
]

FORM_SERVICE_OPTIONS = [
    "Kantoorreiniging", "Glasbewassing", "Gevelreiniging", "VvE-schoonmaak",
    "Opleveringsschoonmaak", "Specialistische reiniging", "Winkelreiniging",
    "Praktijkreiniging", "Trappenhuisreiniging", "Periodieke schoonmaak",
    "Eenmalige schoonmaak", "Anders...",
]

NAV_LINKS = [
    ("Home", "/"),
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
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
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
    def resolve(href):
        return href if href.startswith("/") else f"{base}{href}"
    links = []
    for label, href in NAV_LINKS:
        full_href = resolve(href)
        cls = " active" if href == active else ""
        links.append(f'<a href="{full_href}" class="{cls.strip()}">{label}</a>')
    links_html = "\n      ".join(links)
    mobile_links = "\n      ".join(f'<a href="{resolve(href)}">{label}</a>' for label, href in NAV_LINKS)
    return f"""<a href="#main-content" class="skip-link">Ga direct naar inhoud</a>
<input type="checkbox" id="menuCheckbox" class="menu-checkbox">
<header class="site-header">
  <div class="wrap nav">
    <a href="/" class="logo"><img src="{base}images/logo.png" alt="BrabantSchoon" width="130" height="32"></a>
    <nav class="links">
      {links_html}
    </nav>
    <div class="nav-actions">
      <a href="tel:{PHONE_TEL}" class="phone-link">{PHONE_DISPLAY}</a>
      <a href="{base}contact.html#offerteWizard" class="btn btn-primary btn-sm">Offerte aanvragen</a>
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
    <a href="tel:{PHONE_TEL}" class="mobile-phone-link">{icon('phone')}{PHONE_DISPLAY}</a>
  </div>
  <div class="mobile-menu-cta-wrap">
    <a href="{base}contact.html#offerteWizard" class="btn btn-primary mobile-cta">Offerte aanvragen</a>
  </div>
</aside>"""

def render_footer(base):
    return f"""<footer class="site-footer">
  <div class="wrap">
    <div class="footer-top footer-top-3col">
      <div class="footer-col footer-brand-col">
        <img src="{base}images/logo.png" alt="BrabantSchoon" width="130" height="32">
        <p class="footer-tagline">Professionele schoonmaakpartner voor kantoren, VvE's en organisaties in heel Noord-Brabant.</p>
        <div class="footer-meta">KvK {KVK} &bull; BTW NL005380198B12</div>
      </div>

      <div class="footer-col">
        <h4>Snelle links</h4>
        <a href="/">Home</a>
        <a href="{base}diensten.html">Diensten</a>
        <a href="{base}over-ons.html">Over ons</a>
        <a href="{base}werkgebied.html">Werkgebied</a>
        <a href="{base}bereken-schoonmaakkosten.html">Prijscalculator</a>
        <a href="{base}contact.html">Contact</a>
        <a href="{base}contact.html#offerteWizard">Offerte aanvragen</a>
      </div>

      <div class="footer-col footer-form-col">
        <h4>Vrijblijvend kennismaken?</h4>
        <p class="footer-form-intro">Laat uw gegevens achter, wij nemen doorgaans binnen \u00e9\u00e9n werkdag contact op.</p>
        <form name="footer-offerte" method="POST" action="https://api.web3forms.com/submit" class="footer-form">
          <input type="hidden" name="access_key" value="abc98c0d-af16-42b0-ae5c-3337f35e5299">
          <input type="hidden" name="subject" value="Nieuwe offerteaanvraag via de footer">
          <input type="hidden" name="redirect" value="{SITE_URL}/thanks.html">
          <input type="checkbox" name="botcheck" class="hidden-field" tabindex="-1" autocomplete="off">
          <div class="footer-form-row">
            <input type="text" name="naam" placeholder="Naam" required>
            <input type="tel" name="telefoon" placeholder="Telefoonnummer" required>
          </div>
          <div class="footer-form-row">
            <input type="email" name="email" placeholder="E-mailadres" required>
            <input type="text" name="bedrijfsnaam" placeholder="Bedrijfsnaam (optioneel)">
          </div>
          <textarea name="bericht" placeholder="Bericht" rows="2"></textarea>
          <button type="submit" class="btn btn-primary footer-form-submit">Neem contact met ons op</button>
        </form>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="footer-copy">
        <span>&copy; 2026 BrabantSchoon. Alle rechten voorbehouden.</span>
      </div>
      <div class="footer-legal-links">
        <a href="{base}privacy.html">Privacybeleid</a>
        <a href="{base}cookiebeleid.html">Cookiebeleid</a>
        <a href="{base}voorwaarden.html">Algemene voorwaarden</a>
        <a href="{base}sitemap.xml">Sitemap</a>
      </div>
    </div>
  </div>
</footer>
<a href="{WA_LINK}" target="_blank" rel="noopener" class="whatsapp-float" aria-label="Chat direct via WhatsApp">
  {icon('whatsapp-fill')}
  <span class="whatsapp-tooltip">Chat direct via WhatsApp</span>
</a>"""

# ---------------------------------------------------------------
# SHARED BLOCKS
# ---------------------------------------------------------------
def trust_strip():
    items = [("doc", f"KvK {KVK}"), ("pin", "Actief in heel Noord-Brabant"), ("chat", "Persoonlijk contact, geen callcenter"), ("clock", "Ook buiten kantooruren bereikbaar")]
    spans = "\n      ".join(f'<span>{icon(n)}{t}</span>' for n, t in items)
    return f'<div class="trust"><div class="wrap trust-inner">{spans}</div></div>'

# Kaart van Noord-Brabant: zowel de provinciecontour als de 13 relevante gemeentegrenzen
# zijn gedecodeerd uit echte, open geodata (CBS-gemeentegrenzen 2026, aangeleverd door de klant,
# en elaval/topojson voor de provinciecontour). Geografisch correct, geen schematische vorm.
WERKGEBIED_GEMEENTEN = {
    "asten": {"naam": "Asten", "cx": 320.8, "cy": 171.4, "d": "M308.56,157.26 L303.81,157.26 L305.59,165.53 L312.12,173.16 L318.85,190.65 L332.7,186.52 L338.64,184.61 L336.06,184.29 L335.47,177.29 L331.12,169.98 L322.41,165.53 L316.08,158.85 L308.56,157.26 Z"},
    "breda": {"naam": "Breda", "cx": 117.9, "cy": 112.8, "d": "M124.53,94.28 L120.97,96.51 L114.83,92.37 L106.92,93.96 L100.19,95.24 L98.8,99.69 L99.99,104.78 L103.55,106.37 L105.93,116.23 L105.93,123.54 L107.91,121.95 L115.43,128.0 L115.43,135.95 L113.84,142.31 L118.99,137.22 L116.42,133.08 L120.97,129.27 L133.04,121.95 L139.37,119.73 L139.57,112.73 L135.41,110.5 L135.41,100.64 L130.47,95.87 L124.53,94.28 Z"},
    "deurne": {"naam": "Deurne", "cx": 326.3, "cy": 157.4, "d": "M335.27,136.58 L319.64,141.35 L309.35,142.63 L312.12,146.76 L308.36,148.67 L310.93,155.67 L308.56,157.26 L316.08,158.85 L322.41,165.53 L331.12,169.98 L335.47,177.29 L336.06,184.29 L338.64,184.61 L350.71,174.43 L339.63,154.71 L336.86,140.4 L335.27,136.58 Z"},
    "eindhoven": {"naam": "Eindhoven", "cx": 256.1, "cy": 154.3, "d": "M267.6,138.81 L254.14,139.76 L248.01,142.63 L243.85,142.31 L243.85,146.76 L239.5,148.99 L237.12,152.49 L237.12,157.57 L243.06,157.57 L250.78,160.12 L250.98,168.71 L252.76,168.07 L265.42,168.39 L266.41,169.66 L270.57,168.07 L270.37,160.75 L274.72,158.85 L271.36,150.9 L267.2,147.71 L267.6,138.81 Z"},
    "helmond": {"naam": "Helmond", "cx": 297.5, "cy": 145.4, "d": "M301.83,135.31 L296.29,135.63 L292.13,139.45 L287.19,134.99 L280.66,138.17 L282.44,144.53 L286.2,147.08 L282.24,150.26 L286.79,153.76 L296.29,151.53 L299.46,151.21 L303.81,157.26 L308.56,157.26 L310.93,155.67 L308.36,148.67 L312.12,146.76 L309.35,142.63 L306.58,137.22 L301.83,135.31 Z"},
    "den-bosch": {"naam": "\'s-Hertogenbosch", "cx": 234.0, "cy": 69.3, "d": "M260.28,65.02 L258.1,65.98 L254.34,58.03 L253.35,53.57 L243.85,55.16 L240.49,57.39 L236.53,56.75 L225.05,62.48 L222.48,61.52 L214.96,63.43 L212.19,61.21 L207.24,61.21 L212.19,66.61 L211.99,70.75 L215.55,75.84 L211.2,77.43 L215.36,79.65 L223.67,79.97 L225.65,84.74 L229.6,83.79 L233.56,85.7 L240.09,80.61 L238.9,75.2 L251.57,73.93 L256.91,78.06 L263.84,72.34 L260.28,65.02 Z"},
    "nuenen": {"naam": "Nuenen, Gerwen en Nederwetten", "cx": 276.4, "cy": 142.5, "d": "M280.66,138.17 L276.9,134.99 L274.72,125.77 L271.55,129.9 L274.52,133.72 L267.6,138.81 L267.2,147.71 L271.36,150.9 L274.72,158.85 L278.48,156.62 L282.24,150.26 L286.2,147.08 L282.44,144.53 L280.66,138.17 Z"},
    "someren": {"naam": "Someren", "cx": 303.3, "cy": 172.4, "d": "M318.85,190.65 L312.12,173.16 L305.59,165.53 L303.81,157.26 L299.46,151.21 L296.29,151.53 L292.93,162.66 L292.93,173.16 L296.09,184.29 L299.46,196.69 L318.85,190.65 Z"},
    "tilburg": {"naam": "Tilburg", "cx": 180.8, "cy": 112.9, "d": "M208.23,100.96 L204.47,93.65 L198.14,93.33 L187.46,94.6 L185.08,102.55 L175.38,102.55 L167.27,103.51 L156.19,102.55 L160.35,105.41 L160.35,115.27 L156.78,118.45 L157.18,121.63 L161.53,125.13 L170.83,125.77 L172.61,128.31 L178.35,125.77 L185.48,126.72 L188.25,125.45 L192.2,128.31 L194.58,124.5 L193.79,117.82 L196.36,112.41 L208.23,100.96 Z"},
    "waalwijk": {"naam": "Waalwijk", "cx": 169.8, "cy": 77.2, "d": "M182.71,67.25 L177.17,70.43 L168.26,70.11 L158.17,66.93 L150.25,67.88 L153.22,81.56 L157.38,83.47 L158.17,89.51 L163.91,88.56 L164.9,81.88 L176.18,86.33 L178.55,83.47 L186.66,81.56 L188.05,71.38 L182.71,67.25 Z"},
    "gemert-bakel": {"naam": "Gemert-Bakel", "cx": 315.1, "cy": 122.5, "d": "M332.3,116.86 L324.98,112.73 L322.21,106.69 L316.67,107.96 L304.8,111.14 L295.3,111.78 L295.5,115.59 L301.83,135.31 L306.58,137.22 L309.35,142.63 L319.64,141.35 L335.27,136.58 L332.3,116.86 Z"},
    "laarbeek": {"naam": "Laarbeek", "cx": 287.6, "cy": 129.5, "d": "M301.83,135.31 L295.5,115.59 L289.56,121.0 L282.04,117.82 L271.95,119.41 L274.72,125.77 L276.9,134.99 L280.66,138.17 L287.19,134.99 L292.13,139.45 L296.29,135.63 L301.83,135.31 Z"},
    "geldrop-mierlo": {"naam": "Geldrop-Mierlo", "cx": 281.6, "cy": 158.6, "d": "M282.24,150.26 L278.48,156.62 L274.72,158.85 L270.37,160.75 L270.57,168.07 L278.48,167.75 L285.01,163.94 L292.93,162.66 L296.29,151.53 L286.79,153.76 L282.24,150.26 Z"},
}

def werkgebied_kaart(highlight_slug, base=""):
    shapes = []
    active = WERKGEBIED_GEMEENTEN[highlight_slug]
    for slug, g in WERKGEBIED_GEMEENTEN.items():
        if slug == highlight_slug:
            shapes.append(f'''<g class="wg-shape wg-shape-active">
        <path d="{g["d"]}" />
      </g>''')
        else:
            tt_x, tt_y = g["cx"] - 55, g["cy"] - 30
            shapes.append(f'''<a href="{base}schoonmaakbedrijf-{slug}.html" class="wg-shape" aria-label="Werkgebied {g['naam']}">
        <path d="{g["d"]}" />
        <foreignObject x="{tt_x}" y="{tt_y}" width="110" height="30" class="wg-tooltip-fo">
          <div xmlns="http://www.w3.org/1999/xhtml" style="display:flex; justify-content:center; background:transparent; margin:0; padding:0;">
            <span class="wg-tooltip">{g['naam']}</span>
          </div>
        </foreignObject>
      </a>''')
    shapes_html = "\n      ".join(shapes)

    anchor_x, anchor_y = active["cx"], active["cy"]
    place_right = anchor_x < 300
    label_x = anchor_x + (60 if place_right else -60)
    line_end_x = label_x + (-4 if place_right else 4)
    box_x = label_x if place_right else label_x - 110
    justify = 'flex-start' if place_right else 'flex-end'
    callout = f'''<g class="wg-callout">
        <line x1="{anchor_x}" y1="{anchor_y}" x2="{line_end_x}" y2="{anchor_y}" class="wg-callout-line"/>
        <circle cx="{anchor_x}" cy="{anchor_y}" r="2.5" class="wg-callout-dot"/>
        <foreignObject x="{box_x}" y="{anchor_y - 14}" width="110" height="30" style="overflow:visible;">
          <div xmlns="http://www.w3.org/1999/xhtml" style="display:flex; justify-content:{justify}; background:transparent; margin:0; padding:0;">
            <span class="wg-callout-label">{active['naam']}</span>
          </div>
        </foreignObject>
      </g>'''
    return f'''<div class="wg-map-wrap">
      <svg viewBox="0 0 380 260" class="wg-map" role="img" aria-label="Kaart van Noord-Brabant met het werkgebied uitgelicht">
        <path d="M336.7,55.4 L341.1,56.7 L341.1,60.6 L342.6,64.6 L345.6,67.2 L353.1,67.2 L356.1,69.9 L359.1,81.8 L362.1,85.7 L360.6,88.4 L362.1,89.7 L363.6,91.0 L365.1,92.3 L369.6,99.0 L369.6,100.3 L371.1,101.6 L372.6,110.8 L374.1,114.8 L374.1,116.1 L371.1,120.1 L366.6,116.1 L363.6,116.1 L354.6,118.8 L348.6,120.1 L347.1,120.1 L339.6,117.4 L332.2,116.1 L335.2,135.9 L339.6,154.4 L347.1,163.7 L351.6,174.3 L344.1,180.9 L339.6,184.8 L333.7,186.1 L320.2,190.1 L300.7,196.7 L296.2,202.0 L294.8,203.3 L291.8,209.9 L288.8,220.5 L288.8,223.1 L287.3,224.5 L285.8,225.8 L284.3,225.8 L278.3,227.1 L275.3,228.4 L275.3,228.4 L273.8,227.1 L273.8,219.2 L272.3,213.9 L269.3,208.6 L264.8,206.0 L260.3,204.6 L255.8,207.3 L246.9,212.6 L243.9,215.2 L219.9,213.9 L213.9,215.2 L212.4,215.2 L209.5,215.2 L209.5,203.3 L205.0,199.4 L202.0,198.0 L194.5,199.4 L191.5,196.7 L190.0,195.4 L188.5,187.5 L187.0,184.8 L179.5,178.2 L178.0,174.3 L179.5,167.7 L181.0,162.4 L182.5,157.1 L178.0,150.5 L172.0,146.5 L172.0,145.2 L169.0,146.5 L167.6,147.8 L167.6,150.5 L166.1,154.4 L163.1,159.7 L158.6,166.3 L152.6,171.6 L148.1,171.6 L140.6,169.0 L137.6,167.7 L124.2,167.7 L119.7,165.0 L121.2,161.0 L122.7,161.0 L131.6,165.0 L130.1,159.7 L130.1,154.4 L131.6,150.5 L131.6,145.2 L130.1,142.6 L125.7,141.2 L122.7,139.9 L119.7,138.6 L113.7,142.6 L98.7,161.0 L95.7,162.4 L92.7,163.7 L89.7,163.7 L83.8,162.4 L77.8,163.7 L76.3,163.7 L71.8,161.0 L71.8,157.1 L73.3,153.1 L74.8,147.8 L73.3,145.2 L70.3,145.2 L64.3,146.5 L53.8,150.5 L43.3,155.8 L46.3,158.4 L44.8,161.0 L43.3,163.7 L43.3,166.3 L44.8,169.0 L49.3,174.3 L50.8,178.2 L49.3,183.5 L46.3,184.8 L37.4,184.8 L32.9,183.5 L25.4,179.5 L23.9,179.5 L23.9,179.5 L23.9,176.9 L23.9,175.6 L20.9,172.9 L20.9,167.7 L20.9,163.7 L20.9,162.4 L20.9,161.0 L22.4,159.7 L20.9,155.8 L20.9,155.8 L23.9,154.4 L26.9,147.8 L25.4,139.9 L20.9,134.6 L16.4,132.0 L14.9,132.0 L14.9,132.0 L16.4,125.4 L16.4,124.1 L16.4,120.1 L14.9,116.1 L14.9,114.8 L8.9,109.5 L8.9,109.5 L8.9,102.9 L5.9,100.3 L5.9,100.3 L7.4,93.7 L7.4,93.7 L16.4,91.0 L23.9,91.0 L34.4,88.4 L41.9,83.1 L47.8,71.2 L68.8,75.2 L76.3,75.2 L83.8,73.9 L91.2,69.9 L95.7,68.6 L101.7,68.6 L112.2,56.7 L115.2,50.1 L119.7,46.1 L125.7,42.1 L136.1,40.8 L140.6,39.5 L148.1,32.9 L154.1,32.9 L163.1,34.2 L169.0,34.2 L169.0,34.2 L169.0,36.9 L169.0,38.2 L172.0,42.1 L179.5,47.4 L184.0,47.4 L187.0,47.4 L193.0,52.7 L193.0,58.0 L191.5,62.0 L193.0,63.3 L228.9,59.3 L233.4,56.7 L236.4,54.0 L239.4,50.1 L240.9,44.8 L242.4,38.2 L245.4,36.9 L254.3,36.9 L257.3,35.5 L261.8,32.9 L266.3,31.6 L269.3,34.2 L272.3,34.2 L284.3,32.9 L293.3,34.2 L294.8,36.9 L297.7,42.1 L299.2,43.5 L303.7,44.8 L317.2,54.0 L336.7,55.4 Z"
          fill="var(--bg-soft)" stroke="var(--line)" stroke-width="1.5"/>
        {shapes_html}
        {callout}
      </svg>
    </div>'''

def cta_band(heading="Interesse in onze diensten?", sub="Vraag een vrijblijvende offerte aan of neem direct contact op.", base=""):
    return f"""<div class="cta-band reveal">
    <h2>{heading}</h2>
    <p>{sub}</p>
    <div class="hero-actions">
      <a href="{base}contact.html#offerteWizard" class="btn btn-primary">Vrijblijvende offerte</a>
      <a href="tel:{PHONE_TEL}" class="btn btn-outline">Neem contact op</a>
    </div>
  </div>"""

def faq_block(items):
    return "\n      ".join(f'<details><summary>{q}<span class="chev">{icon("chevron")}</span></summary><div class="faq-a-wrap"><p class="faq-a">{a}</p></div></details>' for q, a in items)

FAQ_ITEMS = [
    ("Wat kost een schoonmaakdienst van BrabantSchoon?", "Dat hangt af van de ruimte, frequentie en het type dienst. Na een kort, vrijblijvend gesprek ontvangt u een offerte op maat \u2014 zonder verplichtingen."),
    ("In welke regio\u2019s is BrabantSchoon actief?", f"We zijn voornamelijk actief in {CITY} en de Peelgemeenten: Deurne, Asten, Someren, Gemert-Bakel en Laarbeek, en verder in Eindhoven, Geldrop-Mierlo, Nuenen en Mierlo. Voor grotere opdrachten rijden we graag verder, in heel Noord-Brabant."),
    ("Werk ik steeds met dezelfde persoon of hetzelfde team?", "Ja, u krijgt een vast aanspreekpunt en een vast team dat uw locatie kent \u2014 zodat u niet steeds opnieuw hoeft uit te leggen hoe u het wilt."),
    ("Kan ik ook een eenmalige schoonmaakbeurt aanvragen?", "Ja, naast vaste afspraken verzorgen we ook maatwerk voor eenmalige beurten, bijvoorbeeld bij een oplevering of verhuizing."),
    ("Hoe snel kunnen jullie starten?", "Dat verschilt per situatie, maar we plannen doorgaans snel een kennismaking in. Bij spoed zijn we ook buiten kantooruren bereikbaar via telefoon of WhatsApp."),
    ("Is een offerte altijd vrijblijvend?", "Ja, elke offerte is geheel vrijblijvend en kosteloos. U beslist zelf of en hoe u verdergaat."),
]

def reviews_widget_block():
    return """<div class="reviews-compact reveal">
      <div class="reviews-compact-label">
        <span>Beoordeeld op Google Reviews</span>
      </div>
      <div class="trustindex-widget-wrap">
        <script defer async src='https://cdn.trustindex.io/loader.js?f96010677d3c4441ed1605368d0'></script>
      </div>
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
    ("Weet ik niet", "Overleg liever tijdens een kennismaking"),
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
  <a href="{base}contact.html#offerteWizard" class="btn btn-primary">Vrijblijvende offerte</a>
</div>
<script src="{base}js/pricing-engine.js?v={ASSET_VERSION}" defer></script>
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
def calculator_block():
    import json as _json
    kern_cities = WERKGEBIED_KERN + WERKGEBIED_OVERIG
    cities_data = _json.dumps({
        "all": CALCULATOR_CITIES,
        "kern": kern_cities,
        "priority": CALCULATOR_CITIES_PRIORITY
    }, ensure_ascii=False)
    return f"""
  <script>window.CALC_CITIES_DATA = {cities_data};</script>
  <section id="calculator" style="background:var(--bg-soft);">
    <div class="wrap">
      <div class="sec-head reveal">
        <span class="eyebrow">Prijsindicatie</span>
        <h2>Bereken direct uw richtprijs.</h2>
        <p>Een eerste indicatie in 30 seconden \u2014 de exacte prijs bepalen we samen tijdens een kort kennismakingsgesprek.</p>
      </div>
      <div class="calc-grid reveal">
        <div class="calc-form">

          <div class="calc-block">
            <h3>1. Wat voor opdracht wilt u laten uitvoeren?</h3>
            <div class="calc-type-grid calc-jobtype-grid" id="calcJobType">
              <button type="button" class="calc-card active" data-job="periodiek"><span class="calc-emoji">\U0001F5D3\uFE0F</span><span>Periodieke schoonmaak</span></button>
              <button type="button" class="calc-card" data-job="oplevering"><span class="calc-emoji">\U0001F3D7\uFE0F</span><span>Opleveringsschoonmaak</span></button>
              <button type="button" class="calc-card" data-job="verhuis"><span class="calc-emoji">\U0001F69A</span><span>Verhuisschoonmaak</span></button>
              <button type="button" class="calc-card" data-job="dieptereiniging"><span class="calc-emoji">\U0001F9FC</span><span>Eenmalige dieptereiniging</span></button>
            </div>
          </div>

          <div class="calc-block" data-job-group="periodiek oplevering dieptereiniging" id="calcTypeBlock">
            <h3>2. Wat wilt u laten schoonmaken?</h3>
            <div class="calc-type-grid" id="calcType">
              <button type="button" class="calc-card active" data-type-key="office" data-label="Kantoor">{icon('office')}<span>Kantoor</span></button>
              <button type="button" class="calc-card" data-type-key="vve" data-label="VvE">{icon('building')}<span>VvE</span></button>
              <button type="button" class="calc-card" data-type-key="practice" data-label="Praktijk">{icon('practice')}<span>Praktijk</span></button>
              <button type="button" class="calc-card" data-type-key="school" data-label="School">{icon('school')}<span>School</span></button>
              <button type="button" class="calc-card" data-type-key="retail" data-label="Winkel">{icon('shop')}<span>Winkel</span></button>
              <button type="button" class="calc-card" data-type-key="warehouse" data-label="Bedrijfshal / Magazijn">{icon('building')}<span>Bedrijfshal</span></button>
              <button type="button" class="calc-card" data-type-key="other" data-label="Anders">{icon('doc')}<span>Anders</span></button>
            </div>
          </div>

          <div class="calc-block" data-job-group="verhuis" hidden>
            <h3>2. Type pand</h3>
            <div class="calc-type-grid" id="calcVerhuisType">
              <button type="button" class="calc-card active" data-label="Woning">{icon('building')}<span>Woning</span></button>
              <button type="button" class="calc-card" data-label="Bedrijfspand">{icon('office')}<span>Bedrijfspand</span></button>
            </div>
          </div>

          <div class="calc-block">
            <h3>3. Oppervlakte (m&sup2;)</h3>
            <div class="calc-slider-row">
              <input type="range" id="calcM2Range" min="50" max="2000" step="10" value="250">
              <input type="number" id="calcM2Number" min="10" max="20000" value="250">
            </div>
            <div class="calc-slider-labels"><span>50 m&sup2;</span><span>1.000 m&sup2;</span><span>2.000+ m&sup2;</span></div>
          </div>

          <div class="calc-block" data-job-group="periodiek" id="calcFreqBlock">
            <h3>4. Hoe vaak wilt u dat wij schoonmaken?</h3>
            <div class="calc-freq-grid" id="calcFreq">
              <button type="button" class="calc-card" data-freq-key="weekly1" data-label="1x per week"><span>1x</span><small>per week</small></button>
              <button type="button" class="calc-card" data-freq-key="weekly2" data-label="2x per week"><span>2x</span><small>per week</small></button>
              <button type="button" class="calc-card" data-freq-key="weekly3" data-label="3x per week"><span>3x</span><small>per week</small></button>
              <button type="button" class="calc-card" data-freq-key="weekly5" data-label="5x per week"><span>5x</span><small>per week</small></button>
              <button type="button" class="calc-card" data-freq-key="daily" data-label="Dagelijks"><span>Dagelijks</span></button>
            </div>
            <p class="calc-note calc-freq-explain" id="calcFreqExplain">{icon('check')}<span>Advies wordt automatisch berekend op basis van pandtype en oppervlakte.</span></p>
          </div>

          <div class="calc-block" data-job-group="periodiek" id="calcExtraBlock">
            <h3>5. Extra diensten <span class="calc-optional">(optioneel)</span></h3>
            <div class="calc-extra-grid" id="calcExtra">
              <label class="calc-check"><input type="checkbox" data-pct="15"><span>{icon('check')}</span>Glasbewassing</label>
              <label class="calc-check"><input type="checkbox" data-pct="10"><span>{icon('check')}</span>Vloeronderhoud</label>
              <label class="calc-check"><input type="checkbox" data-pct="8"><span>{icon('check')}</span>Sanitaire reiniging</label>
              <label class="calc-check"><input type="checkbox" data-pct="20"><span>{icon('check')}</span>Gevelreiniging</label>
              <label class="calc-check"><input type="checkbox" data-pct="12"><span>{icon('check')}</span>Tapijtreiniging</label>
              <label class="calc-check"><input type="checkbox" data-pct="10"><span>{icon('check')}</span>Desinfectie</label>
              <label class="calc-check"><input type="checkbox" data-pct="5"><span>{icon('check')}</span>Afvalbeheer</label>
            </div>
          </div>

          <div class="calc-block" data-job-group="oplevering" hidden>
            <h3>4. Nieuwbouw of renovatie?</h3>
            <div class="calc-type-grid" id="calcOpleveringType">
              <button type="button" class="calc-card active" data-value="nieuwbouw">{icon('building')}<span>Nieuwbouw</span></button>
              <button type="button" class="calc-card" data-value="renovatie">{icon('doc')}<span>Renovatie</span></button>
            </div>
          </div>
          <div class="calc-block" data-job-group="oplevering" hidden>
            <h3>5. Gewenste opleverdatum <span class="calc-optional">(optioneel)</span></h3>
            <input type="date" id="calcOpleverDatum">
          </div>

          <div class="calc-block" data-job-group="verhuis" hidden>
            <h3>4. Is het pand al leeg?</h3>
            <div class="calc-type-grid" id="calcPandLeeg">
              <button type="button" class="calc-card active" data-value="ja">{icon('check')}<span>Ja, pand is leeg</span></button>
              <button type="button" class="calc-card" data-value="nee">{icon('doc')}<span>Nee, nog vol</span></button>
            </div>
          </div>
          <div class="calc-block" data-job-group="verhuis" hidden>
            <h3>5. Extra werkzaamheden <span class="calc-optional">(optioneel)</span></h3>
            <div class="calc-extra-grid" id="calcVerhuisExtra">
              <label class="calc-check"><input type="checkbox" data-pct="10"><span>{icon('check')}</span>Binnenkant kasten</label>
              <label class="calc-check"><input type="checkbox" data-pct="8"><span>{icon('check')}</span>Ramen en kozijnen</label>
              <label class="calc-check"><input type="checkbox" data-pct="12"><span>{icon('check')}</span>Balkon of tuin opruimen</label>
            </div>
          </div>

          <div class="calc-block">
            <h3>6. Waar bevindt het pand zich?</h3>
            <div class="calc-autocomplete" id="calcPlaatsWrap">
              <input type="text" id="calcPlaats" placeholder="Typ een plaatsnaam..." autocomplete="off" role="combobox" aria-expanded="false" aria-autocomplete="list" aria-controls="calcPlaatsListbox" value="Helmond">
              <ul class="calc-autocomplete-list" id="calcPlaatsListbox" role="listbox" hidden></ul>
            </div>
            <p class="calc-note" id="calcPlaatsNote">{icon('check')}<span>Wij zijn actief in heel Noord-Brabant.</span></p>
          </div>

        </div>

        <div class="calc-price-wrap">
          <div class="calc-price-card" id="calcPriceCard">
            <div class="calc-price-header" id="calcPriceHeader">Uw prijsindicatie</div>
            <div class="calc-price-range"><span id="calcPriceLow">&euro;400</span> &ndash; <span id="calcPriceHigh">&euro;550</span></div>
            <div class="calc-price-sub" id="calcPriceSub">per maand, excl. btw</div>
            <p class="calc-price-disclaimer">Gebaseerd op uw invoer. De definitieve offerte bepalen we tijdens een korte inventarisatie.</p>
            <div class="calc-price-hours" id="calcPriceHours">
              <div><span id="calcHoursVisit">2,0</span><small>uur per bezoek</small></div>
              <div><span id="calcHoursMonth">16</span><small>uur per maand</small></div>
            </div>
            <div class="calc-summary" id="calcSummary">
              <div class="calc-summary-title">Uw selectie</div>
              <div class="calc-summary-grid">
                <span>{icon('doc')}<b id="calcSumJobType">Periodieke schoonmaak</b></span>
                <span>{icon('office')}<b id="calcSumType">Kantoor</b></span>
                <span>{icon('doc')}<b id="calcSumM2">250 m&sup2;</b></span>
                <span>{icon('pin')}<b id="calcSumPlaats">Helmond</b></span>
                <span id="calcSumFreqWrap">{icon('clock')}<b id="calcSumFreq">2x per week</b></span>
              </div>
              <div class="calc-summary-extras" id="calcSumExtras"></div>
            </div>
            <ul class="calc-price-includes">
              <li>{icon('check')}Vast contactpersoon</li>
              <li>{icon('check')}Professioneel personeel</li>
              <li>{icon('check')}Kwaliteitscontrole</li>
              <li>{icon('check')}Milieuvriendelijke producten</li>
              <li>{icon('check')}Flexibel op- en afschalen</li>
              <li>{icon('check')}Planning op maat</li>
            </ul>
            <button type="button" class="btn btn-primary calc-price-cta" id="calcOpenModal">Vraag definitieve offerte aan</button>
            <p class="calc-price-footnote">{icon('check')}Reactie binnen \u00e9\u00e9n werkdag</p>
          </div>
        </div>
      </div>
    </div>
    <div class="calc-mobile-bar" id="calcMobileBar">
      <span id="calcMobilePrice">&euro;400 &ndash; &euro;550 / mnd</span>
      <button type="button" id="calcMobileBtn">Bekijk uw prijs {icon('arrow')}</button>
    </div>
  </section>

  <div class="calc-modal-overlay" id="calcModalOverlay">
    <div class="calc-modal" role="dialog" aria-modal="true" aria-labelledby="calcModalTitle">
      <div class="calc-modal-header">
        <div>
          <h3 id="calcModalTitle">Vraag uw definitieve offerte aan</h3>
          <p class="calc-modal-sub">Uw indicatie: <strong id="calcModalPrice">&euro;400 &ndash; &euro;550</strong><span id="calcModalPriceSuffix"> per maand</span></p>
        </div>
        <button type="button" class="calc-modal-close" id="calcModalClose" aria-label="Sluiten">{icon('close')}</button>
      </div>
      <form name="calculator-offerte" method="POST" action="https://api.web3forms.com/submit" enctype="multipart/form-data" class="calc-modal-form">
        <div class="calc-modal-body">
          <input type="hidden" name="access_key" value="abc98c0d-af16-42b0-ae5c-3337f35e5299">
          <input type="hidden" name="subject" value="Nieuwe offerteaanvraag via de prijscalculator">
          <input type="hidden" name="redirect" value="{SITE_URL}/thanks.html">
          <input type="hidden" name="prijsindicatie" id="calcModalPriceField" value="">
          <input type="hidden" name="calculator_details" id="calcModalDetailsField" value="">
          <input type="hidden" name="interne_kostprijs_uitsplitsing" id="calcModalInternalField" value="">
          <input type="checkbox" name="botcheck" class="hidden-field" tabindex="-1" autocomplete="off">
          <div class="calc-modal-row">
            <input type="text" name="naam" placeholder="Naam" required>
            <input type="text" name="bedrijfsnaam" placeholder="Bedrijfsnaam">
          </div>
          <div class="calc-modal-row">
            <input type="email" name="email" placeholder="E-mailadres" required>
            <input type="tel" name="telefoon" placeholder="Telefoonnummer" required>
          </div>
          <input type="text" name="adres" placeholder="Adres">
          <div class="calc-modal-block">
            <label class="calc-modal-label">Voorkeur schoonmaaktijd</label>
            <div class="calc-time-grid" id="calcModalTime">
              <button type="button" class="calc-card" data-label="Ochtend"><span>Ochtend</span><small>06:00 - 12:00</small></button>
              <button type="button" class="calc-card" data-label="Middag"><span>Middag</span><small>12:00 - 17:00</small></button>
              <button type="button" class="calc-card" data-label="Avond"><span>Avond</span><small>17:00 - 22:00</small></button>
              <button type="button" class="calc-card" data-label="Nacht"><span>Nacht</span><small>22:00 - 06:00</small></button>
              <button type="button" class="calc-card active" data-label="Geen voorkeur"><span>Geen voorkeur</span><small>Flexibel</small></button>
            </div>
            <input type="hidden" name="voorkeur_tijdstip" id="calcModalTimeField" value="Geen voorkeur">
          </div>
          <textarea name="opmerkingen" placeholder="Opmerkingen (optioneel)" rows="3"></textarea>
          <label class="calc-modal-upload">
            <input type="file" name="fotos" accept="image/*" multiple>
            {icon('doc')}<span>Foto's toevoegen <em>(optioneel)</em></span>
          </label>
        </div>
        <div class="calc-modal-footer">
          <button type="submit" class="btn btn-primary calc-modal-submit">Verstuur offerteaanvraag</button>
          <p class="calc-price-footnote">{icon('check')}Vrijblijvend &middot; Reactie binnen \u00e9\u00e9n werkdag</p>
        </div>
      </form>
    </div>
  </div>
"""

def build_calculator_page():
    base = ""
    body = f"""
  {page_hero("Prijscalculator", "Bereken uw schoonmaakkosten.", "Ontvang binnen 30 seconden een vrijblijvende prijsindicatie voor professionele schoonmaak in Noord-Brabant. Geen verplichtingen.", base, "Prijscalculator")}
  {calculator_block()}
  <section class="section-tight">
    <div class="wrap">
      <div class="sec-head reveal">
        <span class="eyebrow">Veelgestelde vragen</span>
        <h2>Over de prijscalculator</h2>
      </div>
      <div class="faq reveal">{faq_block([
        ("Hoe wordt de prijs berekend?", "We rekenen met de oppervlakte, het pandtype en de gekozen frequentie om de benodigde schoonmaaktijd te schatten. Daarop baseren we een prijsindicatie, inclusief materiaal- en reiskosten."),
        ("Waarom is dit een indicatie en geen vaste prijs?", "Elk pand is anders: indeling, vloersoort en specifieke wensen be\u00efnvloeden de uiteindelijke prijs. Daarom bepalen we het definitieve bedrag pas na een korte kennismaking."),
        ("Hoe snel ontvang ik een offerte?", "Na het invullen van het formulier nemen we binnen \u00e9\u00e9n werkdag contact met u op voor een definitieve offerte."),
        ("Werken jullie in heel Noord-Brabant?", "Ons kerngebied is Helmond en de Peelgemeenten. Voor grotere of terugkerende opdrachten zijn we ook actief in de rest van Noord-Brabant."),
        ("Zijn er verborgen kosten?", "Nee. De prijsindicatie is exclusief btw, verder rekenen we geen extra kosten die niet in de berekening zijn meegenomen. Eventuele extra diensten kiest u zelf, vooraf zichtbaar in de calculator."),
        ("Kan ik eerst kennismaken voordat ik een contract afsluit?", "Ja, een vrijblijvend kennismakingsgesprek gaat altijd vooraf aan een definitieve offerte of contract."),
      ])}</div>
    </div>
  </section>
  <section class="section-tight" style="background:var(--bg-soft);">
    <div class="wrap">
      <div class="sec-head reveal">
        <span class="eyebrow">Achtergrond</span>
        <h2>Hoe wij onze schoonmaakprijzen bepalen</h2>
      </div>
      <div class="grid-3 reveal">
        <div class="wg-card" style="cursor:default;">
          <div class="wg-icon">{icon('doc')}</div>
          <h3>Waaruit bestaat een schoonmaakprijs?</h3>
          <p>De prijs is opgebouwd uit de benodigde schoonmaaktijd, materiaalkosten, reiskosten en een redelijke marge. Meer oppervlakte of een hogere frequentie betekent meer uren, en dus een hogere prijs.</p>
        </div>
        <div class="wg-card" style="cursor:default;">
          <div class="wg-icon">{icon('pin')}</div>
          <h3>Waarom verschilt de prijs per locatie?</h3>
          <p>Reistijd en -kosten spelen mee in de prijsopbouw. Panden dichter bij ons kerngebied in de Peel zijn doorgaans iets voordeliger dan locaties verder weg in Noord-Brabant.</p>
        </div>
        <div class="wg-card" style="cursor:default;">
          <div class="wg-icon">{icon('check')}</div>
          <h3>Voordelen van periodieke schoonmaak</h3>
          <p>Een vast schema zorgt voor een consistent schone werkomgeving, voorkomt achterstallig onderhoud en is per beurt vaak voordeliger dan losse, eenmalige schoonmaakopdrachten.</p>
        </div>
      </div>
    </div>
  </section>
  <section><div class="wrap">{cta_band("Liever direct persoonlijk contact?", "Bel of mail ons voor een vrijblijvend gesprek.", base)}</div></section>
"""
    write("bereken-schoonmaakkosten.html", page_shell(
        "Schoonmaak Calculator | Bereken Schoonmaakkosten",
        "Bereken direct uw schoonmaakkosten met de gratis prijscalculator van BrabantSchoon. Prijsindicatie voor kantoor, VvE, praktijk en bedrijfspand in 30 seconden.",
        "bereken-schoonmaakkosten.html", base, "bereken-schoonmaakkosten.html", body,
        breadcrumb_schema("Prijscalculator", "bereken-schoonmaakkosten.html")
    ))

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
        ("spark", "Kwaliteitscontrole", "Resultaat en afspraken worden steekproefsgewijs nagelopen, niet alleen bij de eerste beurt."),
    ]
    usp_html = "\n    ".join(f'<div class="usp"><div class="icon-circle">{icon(n)}</div><h3>{t}</h3><p>{d}</p></div>' for n, t, d in usp_items)

    sector_tags = "\n      ".join(f'<span class="area-tag primary">{s}</span>' for s in
        ["Kantoren", "Bedrijfsverzamelgebouwen", "VvE's", "Scholen", "Vastgoedbeheerders", "Winkels &amp; praktijken"])
    kern_tags = "\n      ".join(f'<span class="area-tag">{c}</span>' for c in WERKGEBIED_KERN + WERKGEBIED_OVERIG)

    body = f"""
  <section class="hero-full hero-full-compact">
    <img src="images/hero.jpg" alt="Bedrijfswagens en medewerker van BrabantSchoon bij een klant in Zuidoost-Brabant" class="hero-full-img" width="1600" height="1067" fetchpriority="high" decoding="async">
    <div class="hero-full-overlay"></div>
    <div class="wrap hero-full-content">
      <span class="eyebrow" style="color:#BFE0FF;">Professionele schoonmaak voor bedrijven</span>
      <h1>Professionele schoonmaak. Altijd geregeld.</h1>
      <p class="lead" style="color:rgba(255,255,255,0.9);">Periodieke, eenmalige en specialistische schoonmaak voor kantoren, VvE's, scholen en organisaties in heel Noord-Brabant.</p>
      <div class="hero-actions">
        <a href="contact.html#offerteWizard" class="btn btn-primary">Gratis offerte aanvragen</a>
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

  <section class="reviews-strip">
    <div class="wrap">
      {reviews_widget_block()}
    </div>
  </section>

  <section id="calculator-cta" style="background:var(--bg-soft);">
    <div class="wrap">
      <div class="calc-cta-band reveal">
        <div class="calc-cta-icon">{icon('doc')}</div>
        <div class="calc-cta-text">
          <h2>Bereken uw schoonmaakkosten in 30 seconden.</h2>
          <p>Direct een indicatie voor uw kantoor, VvE, praktijk of bedrijfspand \u2014 zonder verplichtingen.</p>
        </div>
        <a href="bereken-schoonmaakkosten.html" class="btn btn-primary calc-cta-btn">Start de calculator {icon('arrow')}</a>
      </div>
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

  <section id="contact">
    <div class="wrap">
      <div class="benefits-strip reveal">
        <span>{icon('check')}Vrijblijvende offerte</span>
        <span>{icon('clock')}Reactie binnen \u00e9\u00e9n werkdag</span>
        <span>{icon('doc')}Geen verborgen kosten</span>
        <span>{icon('pin')}Actief in heel Noord-Brabant</span>
      </div>
      <div class="contact-grid reveal">
        {contact_info_block(base)}
        {contact_form()}
      </div>
    </div>
  </section>

  <section id="faq" class="section-tight" style="background:var(--bg-soft);">
    <div class="wrap">
      <div class="sec-head reveal">
        <span class="eyebrow">Veelgestelde vragen</span>
        <h2>Heeft u nog vragen?</h2>
      </div>
      <div class="faq reveal">
        {faq_block(FAQ_ITEMS[:5])}
      </div>
      <div class="faq-cta reveal">
        <p>Staat uw vraag er niet tussen? Bel, mail of stuur ons een WhatsApp.</p>
        <a href="contact.html" class="btn btn-outline btn-sm">Neem contact op</a>
      </div>
    </div>
  </section>

  {trust_strip()}
"""
    write("index.html", page_shell(
        "BrabantSchoon | Schoonmaakbedrijf Helmond &amp; Peelgemeenten",
        f"BrabantSchoon verzorgt kantoorreiniging, glasbewassing en VvE-schoonmaak voor bedrijven in Helmond en de Peelgemeenten. Vraag een vrijblijvende offerte aan.",
        "", base, "/", body, LOCALBUSINESS_SCHEMA + "\n" + faq_schema(FAQ_ITEMS[:5]),
        preload_image="images/hero.jpg"
    ))

def page_hero(eyebrow, title, lead, base, crumb_label, image=None, image_alt=""):
    if image:
        return f"""<section class="hero-full hero-full-inner">
    <img src="{image}" alt="{image_alt}" class="hero-full-img" width="1200" height="800" decoding="async">
    <div class="hero-full-overlay"></div>
    <div class="wrap hero-full-content">
      <div class="breadcrumb" style="color:rgba(255,255,255,0.75);"><a href="/" style="color:rgba(255,255,255,0.9);">Home</a> &nbsp;/&nbsp; {crumb_label}</div>
      <span class="eyebrow" style="color:#BFE0FF;">{eyebrow}</span>
      <h1>{title}</h1>
      <p class="lead" style="color:rgba(255,255,255,0.9);">{lead}</p>
    </div>
  </section>"""
    return f"""<section class="page-hero">
    <div class="wrap">
      <div class="breadcrumb"><a href="/">Home</a> &nbsp;/&nbsp; {crumb_label}</div>
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
      <div class="body"><h3>{s['name']}</h3><p>{s['short']}</p><span class="sc-link">Meer informatie {icon('arrow')}</span></div>
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
            <a href="{base}contact.html#offerteWizard" class="btn btn-primary">Vraag offerte aan</a>
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
        "kaart_tekst": "Voor grotere en terugkerende opdrachten verzorgt BrabantSchoon in Tilburg kantoorreiniging, opleveringsschoonmaak en VvE-schoonmaak.",
        "faq_a": "Voor kleine, eenmalige klussen in Tilburg is de reistijd vanuit Helmond niet altijd rendabel. Voor grotere of terugkerende opdrachten, zoals wekelijkse kantoorreiniging, is dit meestal wel mogelijk. Neem contact op om de mogelijkheden te bespreken.",
    },
    {
        "slug": "breda", "name": "Breda",
        "intro": "Breda ligt verder van ons kerngebied in de Peel, maar voor substanti\u00eble opdrachten \u2014 zoals een vast kantoorcontract, VvE-schoonmaak of een grote opleveringsschoonmaak \u2014 rijden we ook hiernaartoe.",
        "faq_q": "Is een eenmalige beurt in Breda mogelijk?",
        "kaart_tekst": "In Breda richten we ons op substantiële, structurele schoonmaakopdrachten voor kantoren en VvE's.",
        "faq_a": "Dat hangt af van de omvang van de klus. Neem contact op met de details van uw situatie, dan laten we u weten of het rendabel is in te plannen.",
    },
    {
        "slug": "den-bosch", "name": "Den Bosch",
        "intro": "'s-Hertogenbosch ligt op een goed bereikbare afstand vanuit Helmond. Voor kantoorreiniging, VvE-schoonmaak en opleveringsschoonmaak zijn we hier regelmatig inzetbaar.",
        "faq_q": "Werken jullie ook voor VvE's in Den Bosch?",
        "kaart_tekst": "Voor kantoren, VvE's en bedrijfsverzamelgebouwen in 's-Hertogenbosch verzorgen we periodieke en facilitaire schoonmaak.",
        "faq_a": "Ja, we verzorgen schoonmaak van trappenhuizen en gemeenschappelijke ruimtes voor VvE's in en rond 's-Hertogenbosch, in overleg met het bestuur.",
    },
    {
        "slug": "waalwijk", "name": "Waalwijk",
        "intro": "Waalwijk ligt tussen Tilburg en 's-Hertogenbosch in. Voor bedrijven en VvE's in Waalwijk verzorgen we schoonmaak op aanvraag, vooral bij grotere of vaste opdrachten.",
        "faq_q": "Kunnen jullie een vast schoonmaakcontract voor Waalwijk verzorgen?",
        "kaart_tekst": "In Waalwijk verzorgen we vaste schoonmaakcontracten en grotere eenmalige opdrachten voor bedrijven en VvE's.",
        "faq_a": "Ja, voor een vast, terugkerend contract is Waalwijk goed inpasbaar in onze planning. Neem contact op om de mogelijkheden te bespreken.",
    },
]

def build_werkgebied():
    base = ""
    all_cities = WERKGEBIED_KERN + WERKGEBIED_OVERIG
    city_slug_map = {"Helmond":"helmond","Deurne":"deurne","Asten":"asten","Someren":"someren",
                      "Gemert-Bakel":"gemert-bakel","Laarbeek":"laarbeek","Eindhoven":"eindhoven",
                      "Geldrop-Mierlo":"geldrop-mierlo","Nuenen":"nuenen","Mierlo":"geldrop-mierlo"}
    city_cards = "\n        ".join(
        f'<a href="{base}schoonmaakbedrijf-{city_slug_map[c]}.html" class="wg-card" style="text-decoration:none; color:inherit;">'
        f'<div class="wg-icon">{icon("pin")}</div><h3>{c}</h3><p>{WERKGEBIED_TEKST[c]}</p>'
        f'<span class="wg-btn">Bekijk {c} {icon("arrow")}</span></a>'
        for c in all_cities
    )
    location_cards = "\n        ".join(
        f'<a href="{base}schoonmaakbedrijf-{loc["slug"]}.html" class="wg-card" style="text-decoration:none; color:inherit;">'
        f'<div class="wg-icon">{icon("pin")}</div><h3>{loc["name"]}</h3><p>{loc["intro"][:100]}&hellip;</p>'
        f'<span class="wg-btn">Bekijk werkgebied {icon("arrow")}</span></a>'
        for loc in LOCATIONS if loc["slug"] != "eindhoven"
    )
    body = f"""
  {page_hero("Werkgebied", "Actief in heel Noord-Brabant.", f"Gevestigd in {CITY}, met de Peelgemeenten als kerngebied \u2014 en we rijden verder voor de juiste opdracht.", base, "Werkgebied")}
  <section class="section-tight">
    <div class="wrap">
      <div class="sec-head reveal"><span class="eyebrow">Kerngebied</span><h2>Onze vaste regio.</h2></div>
      <div class="grid-4 reveal">{city_cards}</div>
    </div>
  </section>
""" + f"""
  <section class="section-tight" style="background:var(--bg-soft);">
    <div class="wrap">
      <div class="sec-head reveal"><span class="eyebrow">Verder in Brabant</span><h2>Ook actief hier, voor grotere opdrachten.</h2></div>
      <div class="grid-3 reveal">{location_cards}</div>
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
def seo_service_paragraphs(stad):
    """Genereert 4 keyword-rijke paragrafen (kantoorreiniging, VvE, oplevering, glasbewassing)
    per stad. Gebruikt geroteerde formuleringsvarianten (op basis van de plaatsnaam) zodat
    elke pagina tekstueel verschilt, ook al is de onderliggende informatie hetzelfde."""
    idx = sum(ord(c) for c in stad) % 3

    kantoor = [
        f"Voor kantoorreiniging in {stad} werken we met een vast team dat uw pand kent en op een vaste dag en tijd langskomt. Denk aan het legen van prullenbakken, stofzuigen, het reinigen van bureaus en gemeenschappelijke ruimtes, en sanitair.",
        f"Bedrijven in {stad} kiezen voor onze kantoorreiniging omdat u altijd hetzelfde, vertrouwde team over de vloer krijgt. We plannen buiten kantoortijden, zodat uw medewerkers nergens last van hebben.",
        f"Kantoorreiniging in {stad} verzorgen we volgens een vast schema dat u zelf mede bepaalt: van dagelijks tot wekelijks, afgestemd op de grootte en het gebruik van uw pand.",
    ][idx]

    vve = [
        f"Voor VvE-schoonmaak in {stad} verzorgen we gemeenschappelijke ruimtes zoals trappenhuizen, entrees, liften en bergingen. We stemmen de frequentie af met het bestuur en werken met een vast contactpersoon namens de VvE.",
        f"VvE's in {stad} vertrouwen op ons voor de schoonmaak van hun gemeenschappelijke ruimtes. We overleggen rechtstreeks met het bestuur of de beheerder over frequentie en aandachtspunten.",
        f"De schoonmaak van uw VvE in {stad} pakken we planmatig aan: trappenhuis, entree en overige gedeelde ruimtes op een vast ritme, met korte lijnen naar het bestuur.",
    ][idx]

    oplevering = [
        f"Bij opleveringsschoonmaak in {stad} zorgen we dat een pand grondig schoon is voor de sleuteloverdracht \u2014 of het nu gaat om nieuwbouw, renovatie of een verhuizing. We stemmen de opleverdatum met u af.",
        f"Voor opleveringsschoonmaak in {stad} plannen we rondom uw opleverdatum, zodat het pand op het juiste moment brandschoon wordt overgedragen. Zowel nieuwbouw als renovatie behoort tot de mogelijkheden.",
        f"Opleveringsschoonmaak in {stad} vraagt om precisie en planning. We werken toe naar uw opleverdatum en zorgen dat er niets over het hoofd wordt gezien.",
    ][idx]

    glas = [
        f"Glasbewassing en specialistische reiniging in {stad} bieden we aan als aanvulling op periodieke schoonmaak \u2014 denk aan ramen, kozijnen, vloeronderhoud of gevelreiniging, naar wens in te plannen.",
        f"Naast reguliere schoonmaak verzorgen we in {stad} ook glasbewassing en specialistische reiniging, zoals vloeronderhoud en gevelreiniging, als losse toevoeging op uw contract.",
        f"Voor glasbewassing en specialistische reiniging in {stad} \u2014 ramen, kozijnen, vloeren of gevels \u2014 kunt u bij ons terecht als aanvullende dienst naast uw vaste schoonmaakcontract.",
    ][idx]

    return f"""<p class="prose">{kantoor}</p>
      <p class="prose" style="margin-top:14px;">{vve}</p>
      <p class="prose" style="margin-top:14px;">{oplevering}</p>
      <p class="prose" style="margin-top:14px;">{glas}</p>"""

def seo_trust_paragraphs(stad):
    """Extra, geroteerde content over werkwijze en vertrouwen, per stad."""
    idx = sum(ord(c) for c in stad) % 3

    werkwijze = [
        f"Onze werkwijze in {stad} begint altijd met een kort kennismakingsgesprek. We bekijken samen met u welke ruimtes schoongemaakt moeten worden, welke frequentie logisch is en of er specifieke aandachtspunten zijn. Op basis daarvan stellen we een vrijblijvende offerte op, zonder verrassingen achteraf.",
        f"In {stad} starten we ieder nieuw contract met een rondleiding door het pand. Zo weten we precies wat er nodig is en kunnen we een realistische inschatting maken van de benodigde tijd per bezoek. Pas daarna ontvangt u een offerte op maat.",
        f"Voordat we in {stad} beginnen, plannen we een kennismaking op locatie. Dat geeft ons de kans om uw pand en wensen goed in kaart te brengen, en u de kans om te zien met wie u in zee gaat.",
    ][idx]

    team = [
        f"U krijgt in {stad} een vast schoonmaakteam toegewezen dat uw pand na een paar bezoeken door en door kent. Wisselende gezichten en steeds opnieuw uitleggen hoe u het wilt hebben, doen we liever niet \u2014 vaste mensen werken nu eenmaal prettiger en efficiënter.",
        f"Bij ons in {stad} werkt u niet met wisselende invalkrachten, maar met een vast team. Dat scheelt in de kwaliteit: mensen die uw pand kennen, weten ook waar extra aandacht nodig is.",
        f"Continuïteit is voor ons belangrijk, ook in {stad}: hetzelfde team komt telkens terug, zodat de kwaliteit gelijk blijft en u niet steeds opnieuw hoeft uit te leggen hoe u het wilt.",
    ][idx]

    flexibiliteit = [
        f"Werkzaamheden of drukte veranderen weleens. Daarom kunt u in {stad} de frequentie of omvang van de schoonmaak tussentijds aanpassen, zonder dat u vastzit aan een star contract.",
        f"Uw situatie in {stad} kan veranderen \u2014 een verbouwing, meer of minder gebruik van het pand. We denken graag mee en passen de planning waar nodig aan.",
        f"Een vast contract hoeft niet star te zijn. In {stad} schalen we desgewenst op of af, afhankelijk van wat uw pand op dat moment nodig heeft.",
    ][idx]

    duurzaam = [
        f"Waar mogelijk werken we in {stad} met milieuvriendelijke schoonmaakmiddelen, zonder dat dit ten koste gaat van het resultaat. Een schone werkomgeving hoeft niet zwaar te wegen op het milieu.",
        f"In {stad} letten we bewust op de producten die we gebruiken: effectief, maar met oog voor het milieu waar dat kan.",
        f"Duurzaamheid speelt ook in {stad} een rol in onze keuzes: we gebruiken milieuvriendelijke middelen zonder concessies te doen aan hygiëne.",
    ][idx]

    return f"""<p class="prose">{werkwijze}</p>
      <p class="prose" style="margin-top:14px;">{team}</p>
      <p class="prose" style="margin-top:14px;">{flexibiliteit}</p>
      <p class="prose" style="margin-top:14px;">{duurzaam}</p>"""

def seo_context_paragraphs(stad, klanten):
    """Derde geroteerde sectie: gaat in op de doelgroep en praktische afspraken per stad."""
    idx = sum(ord(c) for c in stad) % 3

    doelgroep = [
        f"In {stad} werken we voor uiteenlopende organisaties: {klanten}. Elk pand heeft zijn eigen indeling en gebruik, en daar stemmen we de schoonmaak op af \u2014 geen standaardpakket, maar maatwerk per situatie.",
        f"De opdrachtgevers waarvoor we in {stad} actief zijn, lopen uiteen van {klanten}. Voor elk van deze groepen geldt hetzelfde uitgangspunt: een schone, representatieve omgeving zonder gedoe.",
        f"Van {klanten} \u2014 in {stad} verzorgen we schoonmaak voor een brede groep opdrachtgevers, telkens met dezelfde persoonlijke aanpak en een vast aanspreekpunt.",
    ][idx]

    planning = [
        f"De planning stemmen we in {stad} af op uw openingstijden of gebruik van het pand. Vaak plannen we buiten de reguliere uren, zodat de dagelijkse werkzaamheden geen hinder ondervinden van de schoonmaak.",
        f"Timing is belangrijk: in {stad} plannen we schoonmaak bij voorkeur vroeg, laat of in het weekend, afhankelijk van wat het beste past bij uw organisatie.",
        f"We houden in {stad} rekening met uw dagelijkse gang van zaken. De schoonmaak plannen we zoveel mogelijk buiten piekmomenten, in overleg met u.",
    ][idx]

    contact = [
        f"Vragen of een aanpassing nodig? In {stad} heeft u altijd één vast aanspreekpunt bij BrabantSchoon, rechtstreeks bereikbaar \u2014 geen callcenter of wisselende contactpersonen.",
        f"Mocht er iets zijn, dan belt of appt u in {stad} rechtstreeks met uw vaste contactpersoon bij BrabantSchoon. Korte lijnen, snel geregeld.",
        f"Communicatie verloopt in {stad} via één vast aanspreekpunt, zodat u nooit hoeft uit te leggen wie u bent of wat de afspraken ook alweer waren.",
    ][idx]

    return f"""<p class="prose">{doelgroep}</p>
      <p class="prose" style="margin-top:14px;">{planning}</p>
      <p class="prose" style="margin-top:14px;">{contact}</p>"""

KERNGEBIED = [
    {
        "slug": "helmond", "name": "Helmond",
        "intro": "Als thuisbasis van BrabantSchoon kennen we Helmond het beste. Van dagelijkse en wekelijkse schoonmaak tot bredere facilitaire dienstverlening \u2014 we zijn hier voor kantoren, bedrijfsverzamelgebouwen en winkelpanden dagelijks onderweg.",
        "waarom": "Doordat we in Helmond zelf gevestigd zijn, is de reistijd naar elke locatie kort. Dat betekent snel kunnen schakelen bij een spoedklus, en een vast team dat uw pand door en door kent.",
        "klanten": "kantoren, bedrijfsverzamelgebouwen, VvE's, winkels, praktijken en andere zakelijke organisaties",
        "kaart_tekst": "BrabantSchoon verzorgt vanuit Helmond periodieke, dagelijkse en eenmalige schoonmaak voor kantoren, VvE's en winkels in de hele regio.",
        "faqs": [
            ("Werken jullie ook 's avonds of in het weekend in Helmond?", "Ja, voor veel kantoren en winkels plannen we de schoonmaak juist buiten openingstijden, zodat het uw bedrijfsvoering niet verstoort."),
            ("Kunnen jullie snel starten met een nieuwe klant in Helmond?", "Vaak wel \u2014 omdat we hier gevestigd zijn, is een kennismaking op locatie meestal al binnen enkele dagen te plannen."),
        ],
        "neighbors": ["deurne", "gemert-bakel"],
    },
    {
        "slug": "deurne", "name": "Deurne",
        "intro": "Deurne kennen we goed: van bedrijfspanden op de bedrijventerreinen tot praktijken in het centrum. We verzorgen hier zowel reguliere kantoorreiniging als opleveringsschoonmaak en specialistische reiniging.",
        "waarom": "Deurne ligt op korte afstand van ons kerngebied Helmond, waardoor we hier net zo snel kunnen schakelen als in onze thuisstad.",
        "klanten": "bedrijfspanden, praktijken, logistieke bedrijven en productiebedrijven",
        "kaart_tekst": "Vanuit ons kerngebied verzorgen we in Deurne periodieke schoonmaak, opleveringsschoonmaak en specialistische reiniging voor bedrijven en praktijken.",
        "faqs": [
            ("Verzorgen jullie ook praktijken in Deurne?", "Ja, we reinigen regelmatig praktijkruimtes zoals huisartsenposten en fysiotherapiepraktijken, buiten de openingstijden."),
            ("Is eenmalige schoonmaak in Deurne mogelijk?", "Zeker, bijvoorbeeld bij een verhuizing of oplevering. Neem contact op voor de mogelijkheden."),
        ],
        "neighbors": ["helmond", "asten"],
    },
    {
        "slug": "asten", "name": "Asten",
        "intro": "Asten en de kern Heusden liggen goed bereikbaar vanuit Helmond. We verzorgen hier zowel eenmalige als periodieke schoonmaak, op een ritme dat bij uw organisatie past.",
        "waarom": "De korte afstand vanuit Helmond maakt het voor ons eenvoudig om ook kleinere opdrachten in Asten rendabel in te plannen.",
        "klanten": "kantoren, bedrijfsruimtes, VvE's en productiebedrijven",
        "kaart_tekst": "BrabantSchoon verzorgt in Asten zowel eenmalige als terugkerende schoonmaak voor kantoren, bedrijfsruimtes en VvE's.",
        "faqs": [
            ("Rijden jullie ook naar Heusden?", "Ja, Heusden valt binnen ons werkgebied rond Asten."),
            ("Wat kost schoonmaak in Asten?", "Dat hangt af van de ruimte en frequentie. Na een kort gesprek ontvangt u een vrijblijvende offerte op maat."),
        ],
        "neighbors": ["deurne", "someren"],
    },
    {
        "slug": "someren", "name": "Someren",
        "intro": "In Someren werken we voor kantoren, VvE's en scholen die op zoek zijn naar een persoonlijke, vaste schoonmaakpartner \u2014 van wekelijkse onderhoudsbeurten tot eenmalige klussen.",
        "waarom": "Someren heeft veel lokale organisaties die op zoek zijn naar een vaste, betrokken schoonmaakpartner \u2014 daar sluit onze aanpak van \u00e9\u00e9n vast team en korte lijnen goed op aan.",
        "klanten": "kantoren, VvE's, bedrijfspanden en scholen",
        "kaart_tekst": "In Someren bieden we periodieke en wekelijkse schoonmaak voor kantoren, VvE's en scholen in de regio.",
        "faqs": [
            ("Werken jullie met een vast team in Someren?", "Ja, u krijgt een vast aanspreekpunt dat uw locatie kent."),
            ("Is een offerte vrijblijvend?", "Altijd, en zonder verplichtingen."),
        ],
        "neighbors": ["asten", "gemert-bakel"],
    },
    {
        "slug": "gemert-bakel", "name": "Gemert-Bakel",
        "intro": "Gemert en Bakel behoren tot ons kerngebied. Of het nu gaat om facilitaire schoonmaak voor een bedrijfspand in Gemert of een opleveringsschoonmaak in Bakel, we plannen dit met dezelfde zorg als in Helmond zelf.",
        "waarom": "Als vaste partij in de Peelregio kennen we de lokale bedrijven en hun specifieke wensen.",
        "klanten": "bedrijfspanden, VvE's, logistieke bedrijven en organisaties met een opleveringsklus",
        "kaart_tekst": "BrabantSchoon verzorgt in Gemert-Bakel facilitaire schoonmaak, opleveringsschoonmaak en periodiek onderhoud voor bedrijven en VvE's.",
        "faqs": [
            ("Doen jullie ook opleveringsschoonmaak in Gemert-Bakel?", "Ja, dat is een van onze kernactiviteiten in deze regio."),
            ("Hoe snel kunnen jullie starten?", "Meestal binnen enkele dagen na een kort kennismakingsgesprek."),
        ],
        "neighbors": ["helmond", "laarbeek"],
    },
    {
        "slug": "laarbeek", "name": "Laarbeek",
        "intro": "In Laarbeek, met de kernen Beek en Donk, Aarle-Rixtel en Mariahout, verzorgen we periodieke en dagelijkse schoonmaak voor kantoren, winkels en VvE's die op zoek zijn naar een vast en betrouwbaar schoonmaakteam.",
        "waarom": "De verschillende kernen van Laarbeek liggen dicht bij elkaar, waardoor we hier efficient kunnen plannen \u2014 dat voordeel geven we door in scherpe tarieven.",
        "klanten": "kantoren, VvE's, winkels en bedrijfsverzamelgebouwen in Beek en Donk, Aarle-Rixtel en Mariahout",
        "kaart_tekst": "In Laarbeek verzorgen we periodieke en dagelijkse schoonmaak voor kantoren, winkels en bedrijfsverzamelgebouwen.",
        "faqs": [
            ("Werken jullie in alle kernen van Laarbeek?", "Ja, in Beek en Donk, Aarle-Rixtel en Mariahout."),
            ("Bieden jullie ook periodieke schoonmaak?", "Ja, naast vaste contracten ook periodieke beurten op afspraak."),
        ],
        "neighbors": ["gemert-bakel", "helmond"],
    },
    {
        "slug": "nuenen", "name": "Nuenen",
        "intro": "In Nuenen verzorgen we zowel periodieke als eenmalige schoonmaak voor kantoren, praktijken en scholen, waarbij persoonlijk contact en een vast aanspreekpunt voorop staan.",
        "waarom": "Nuenen heeft veel zelfstandige ondernemers en professionele praktijken \u2014 juist daar telt een schoonmaakpartner die meedenkt in plaats van alleen uitvoert.",
        "klanten": "kantoren, praktijken, scholen en organisaties met een eigen bedrijfspand",
        "kaart_tekst": "BrabantSchoon verzorgt in Nuenen periodieke en eenmalige schoonmaak voor kantoren, praktijken en scholen.",
        "faqs": [
            ("Werken jullie voor organisaties van elke omvang in Nuenen?", "Zeker, van eenmanszaak tot grotere praktijk maken we een passende offerte."),
            ("Is de eerste afspraak vrijblijvend?", "Ja, een kennismaking en offerte zijn altijd kosteloos en vrijblijvend."),
        ],
        "neighbors": ["eindhoven", "geldrop-mierlo"],
    },
    {
        "slug": "geldrop-mierlo", "name": "Geldrop-Mierlo",
        "intro": "Geldrop en Mierlo, samen de gemeente Geldrop-Mierlo, liggen op de route tussen Helmond en Eindhoven. Dat maakt het voor ons goed mogelijk om hier structurele en facilitaire schoonmaak te verzorgen, van dagelijks onderhoud tot vaste contracten.",
        "waarom": "De ligging tussen onze twee belangrijkste werkgebieden in maakt Geldrop-Mierlo makkelijk te combineren met andere afspraken \u2014 dat scheelt in de planning en dus in de prijs.",
        "klanten": "kantoren, bedrijfsverzamelgebouwen, VvE's en productiebedrijven",
        "kaart_tekst": "In Geldrop-Mierlo bieden we structurele en facilitaire schoonmaak voor kantoren, bedrijfsverzamelgebouwen en VvE's.",
        "faqs": [
            ("Ook actief in Mierlo zelf?", "Ja, Mierlo valt onder dezelfde vaste aanpak als Geldrop."),
            ("Kunnen jullie een vast wekelijks contract verzorgen?", "Ja, dat is een groot deel van ons werk in deze regio."),
        ],
        "neighbors": ["nuenen", "eindhoven"],
    },
    {
        "slug": "eindhoven", "name": "Eindhoven",
        "intro": "Eindhoven ligt op korte afstand van ons kerngebied in de Peel. We zijn hier regelmatig actief met kantoorreiniging, facilitaire schoonmaak, VvE-schoonmaak en specialistische reiniging \u2014 van eenmalige klussen tot vaste contracten.",
        "waarom": "Eindhoven is de grootste stad in onze regio, met veel kantoren, bedrijfsverzamelgebouwen en VvE's. We investeren daarom bewust in structurele aanwezigheid hier, niet alleen incidentele ritjes.",
        "klanten": "kantoren, bedrijfsverzamelgebouwen, VvE's, zorginstellingen en gemeentelijke instellingen",
        "kaart_tekst": "BrabantSchoon verzorgt in Eindhoven periodieke, eenmalige en specialistische schoonmaak voor kantoren, VvE's, zorginstellingen en gemeentelijke instellingen.",
        "faqs": [
            ("Is een vast schoonmaakcontract in Eindhoven mogelijk?", "Ja, Eindhoven ligt goed bereikbaar vanuit Helmond en we verzorgen hier regelmatig vaste, terugkerende schoonmaak."),
            ("Werken jullie ook voor bedrijfsverzamelgebouwen in Eindhoven?", "Ja, met meerdere huurders onder \u00e9\u00e9n dak werken we met \u00e9\u00e9n vast aanspreekpunt voor het hele pand."),
        ],
        "neighbors": ["geldrop-mierlo", "nuenen"],
    },
]

def build_kerngebied_pages():
    base = ""
    by_slug = {k["slug"]: k for k in KERNGEBIED}
    for k in KERNGEBIED:
        neighbor_cards = "\n        ".join(
            f'<a href="schoonmaakbedrijf-{by_slug[n]["slug"]}.html" class="wg-card" style="text-decoration:none; color:inherit;">'
            f'<div class="wg-icon">{icon("pin")}</div><h3>{by_slug[n]["name"]}</h3>'
            f'<span class="wg-btn">Bekijk {by_slug[n]["name"]} {icon("arrow")}</span></a>'
            for n in k["neighbors"]
        )
        service_mentions = "\n        ".join(f"""<a href="{base}diensten/{s['slug']}.html" class="service-card">
      <div class="thumb {s['tint']}">{service_visual(s)}</div>
      <div class="body"><h3>{s['name']}</h3><p>{s['short']}</p></div>
    </a>""" for s in SERVICES[:6])
        faq_html = faq_block(k["faqs"])
        body = f"""
  {page_hero("Werkgebied", f"Schoonmaakbedrijf {k['name']}", k['intro'], base, k['name'])}
  <section class="section-tight">
    <div class="wrap">
      <div class="two-col reveal">
        <div>
          <span class="eyebrow">Waarom BrabantSchoon in {k['name']}</span>
          <h2 style="font-size:24px; margin-top:8px;">Lokaal betrokken, professioneel uitgevoerd.</h2>
          <p class="prose" style="margin-top:14px;">{k['waarom']}</p>
          <p class="prose" style="margin-top:12px;"><strong style="color:var(--ink);">Voor wie:</strong> {k['klanten']}.</p>
          <div class="hero-actions" style="margin-top:24px;">
            <a href="{base}contact.html#offerteWizard" class="btn btn-primary">Vraag offerte aan</a>
            <a href="tel:{PHONE_TEL}" class="btn btn-outline">Bel direct</a>
          </div>
        </div>
        <div>
          <div class="wg-map-panel wg-map-panel-lg">{werkgebied_kaart(k['slug'], base)}</div>
          <p class="prose" style="text-align:center; margin-top:14px; font-size:13.5px;">{k['kaart_tekst']}</p>
        </div>
      </div>
    </div>
  </section>
  <section style="background:var(--bg-soft);">
    <div class="wrap">
      <div class="sec-head reveal"><span class="eyebrow">Diensten</span><h2>Wat we in {k['name']} verzorgen</h2></div>
      <div class="grid-3 reveal">{service_mentions}</div>
    </div>
  </section>
  <section class="section-tight">
    <div class="wrap">
      <div class="sec-head reveal"><span class="eyebrow">Uitgelicht</span><h2>Onze diensten in {k['name']} nader toegelicht</h2></div>
      <div style="max-width:760px; margin:0 auto;">{seo_service_paragraphs(k['name'])}</div>
    </div>
  </section>
  <section class="section-tight" style="background:var(--bg-soft);">
    <div class="wrap">
      <div class="sec-head reveal"><span class="eyebrow">Werkwijze</span><h2>Zo werken wij in {k['name']}</h2></div>
      <div style="max-width:760px; margin:0 auto;">{seo_trust_paragraphs(k['name'])}</div>
    </div>
  </section>
  <section class="section-tight">
    <div class="wrap">
      <div class="sec-head reveal"><span class="eyebrow">Voor wie</span><h2>Onze opdrachtgevers in {k['name']}</h2></div>
      <div style="max-width:760px; margin:0 auto;">{seo_context_paragraphs(k['name'], k['klanten'])}</div>
    </div>
  </section>
  <section class="section-tight" style="background:var(--bg-soft);">
    <div class="wrap">
      <div class="sec-head reveal"><span class="eyebrow">Veelgestelde vragen</span><h2>Over {k['name']}</h2></div>
      <div class="faq reveal">{faq_html}</div>
    </div>
  </section>
  <section class="section-tight">
    <div class="wrap">
      <div class="sec-head reveal"><span class="eyebrow">Ook interessant</span><h2>Andere gemeenten in de buurt</h2></div>
      <div class="grid-3 reveal">{neighbor_cards}</div>
    </div>
  </section>
  <section><div class="wrap">{cta_band(f"Schoonmaak nodig in {k['name']}?", "Vraag een vrijblijvende offerte aan.", base)}</div></section>
"""
        title = f"Schoonmaakbedrijf {k['name']} | BrabantSchoon"
        desc = f"Schoonmaakbedrijf in {k['name']}? BrabantSchoon verzorgt kantoorreiniging, VvE-schoonmaak en opleveringsschoonmaak. Vrijblijvende offerte binnen 1 werkdag."
        url = f"schoonmaakbedrijf-{k['slug']}.html"
        write(url, page_shell(
            title, desc, url, base, url, body,
            breadcrumb_schema(k['name'], url) + "\n" + faq_schema(k['faqs']) + "\n" + LOCALBUSINESS_SCHEMA
        ))


def build_location_pages():
    base = ""
    for loc in LOCATIONS:
        others = [o for o in LOCATIONS if o["slug"] != loc["slug"]][:3]
        others_html = "\n        ".join(f'<a href="schoonmaakbedrijf-{o["slug"]}.html" class="card" style="display:block; text-decoration:none; color:inherit;"><h3 style="font-family:\'Inter\',sans-serif; font-size:16px; font-weight:700;">{o["name"]}</h3></a>' for o in others)
        service_mentions = "\n        ".join(f"""<a href="{base}diensten/{s['slug']}.html" class="service-card">
      <div class="thumb {s['tint']}">{service_visual(s)}</div>
      <div class="body"><h3>{s['name']}</h3><p>{s['short']}</p></div>
    </a>""" for s in SERVICES[:6])
        body = f"""
  {page_hero("Werkgebied", f"Schoonmaakbedrijf {loc['name']}", loc['intro'], base, loc['name'])}
  <section>
    <div class="wrap">
      <div class="two-col reveal">
        <div>
          <p class="prose">Ons kerngebied is Helmond en de Peelgemeenten \u2014 vandaar rijden we uit. Voor {loc['name']} werken we vooral bij grotere of terugkerende opdrachten, zoals een vast kantoorcontract, VvE-schoonmaak of een omvangrijke opleveringsschoonmaak.</p>
          <div class="hero-actions" style="margin-top:26px;">
            <a href="{base}contact.html#offerteWizard" class="btn btn-primary">Vraag offerte aan</a>
            <a href="tel:{PHONE_TEL}" class="btn btn-outline">Bel direct</a>
          </div>
        </div>
        <div>
          <div class="wg-map-panel wg-map-panel-lg">{werkgebied_kaart(loc['slug'], base)}</div>
          <p class="prose" style="text-align:center; margin-top:14px; font-size:13.5px;">{loc['kaart_tekst']}</p>
        </div>
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
      <div class="sec-head reveal"><span class="eyebrow">Uitgelicht</span><h2>Onze diensten in {loc['name']} nader toegelicht</h2></div>
      <div style="max-width:760px; margin:0 auto;">{seo_service_paragraphs(loc['name'])}</div>
    </div>
  </section>
  <section style="background:var(--bg-soft);">
    <div class="wrap">
      <div class="sec-head reveal"><span class="eyebrow">Werkwijze</span><h2>Zo werken wij in {loc['name']}</h2></div>
      <div style="max-width:760px; margin:0 auto;">{seo_trust_paragraphs(loc['name'])}</div>
    </div>
  </section>
  <section>
    <div class="wrap">
      <div class="sec-head reveal"><span class="eyebrow">Voor wie</span><h2>Onze opdrachtgevers in {loc['name']}</h2></div>
      <div style="max-width:760px; margin:0 auto;">{seo_context_paragraphs(loc['name'], "kantoren, VvE's en bedrijfspanden")}</div>
    </div>
  </section>
  <section style="background:var(--bg-soft);">
    <div class="wrap">
      <div class="sec-head reveal"><span class="eyebrow">Veelgestelde vraag</span><h2>Over {loc['name']}</h2></div>
      <div class="faq reveal">{faq_block([(loc['faq_q'], loc['faq_a'])])}</div>
    </div>
  </section>
  <section>
    <div class="wrap">
      <div class="sec-head reveal"><span class="eyebrow">Ook interessant</span><h2>Andere regio's</h2></div>
      <div class="grid-3 reveal">{others_html}</div>
    </div>
  </section>
  <section><div class="wrap">{cta_band(f"Schoonmaak nodig in {loc['name']}?", "Vraag een vrijblijvende offerte aan.", base)}</div></section>
"""
        title = f"Schoonmaakbedrijf {loc['name']} | BrabantSchoon"
        desc = f"Schoonmaakbedrijf voor {loc['name']}? BrabantSchoon verzorgt kantoorreiniging en VvE-schoonmaak voor grotere opdrachten, vanuit Helmond. Vrijblijvende offerte."
        url = f"schoonmaakbedrijf-{loc['slug']}.html"
        write(url, page_shell(
            title, desc, url, base, url, body,
            breadcrumb_schema(loc['name'], url) + "\n" + faq_schema([(loc['faq_q'], loc['faq_a'])]) + "\n" + LOCALBUSINESS_SCHEMA
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
      <a class="btn btn-primary" href="/" style="margin-top:24px;">Terug naar de website</a>
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
        ("bereken-schoonmaakkosten.html", "0.9"),
        ("over-ons.html", "0.7"), ("contact.html", "0.8"),
        ("privacy.html", "0.3"), ("voorwaarden.html", "0.3"), ("cookiebeleid.html", "0.3"),
    ]
    urls += [(f"diensten/{s['slug']}.html", "0.8") for s in SERVICES]
    urls += [(f"schoonmaakbedrijf-{loc['slug']}.html", "0.8") for loc in LOCATIONS]
    urls += [(f"schoonmaakbedrijf-{k['slug']}.html", "0.85") for k in KERNGEBIED]
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
    build_calculator_page()
    build_kerngebied_pages()
    build_location_pages()
    build_contact()
    build_thanks()
    build_legal()
    build_seo_files()
    print("\nKlaar.")
