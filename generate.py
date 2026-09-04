#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import re
import json

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE_URL = "https://www.brabantschoon.nl"
PHONE_DISPLAY = "0492 - 31 30 50"
PHONE_TEL = "+31492313050"
GA_MEASUREMENT_ID = "G-DXH4VEW9TV"

def consent_script_inline():
    # Bewust INLINE (niet als los .js-bestand) geladen: veel adblockers en
    # privacybrowsers (uBlock Origin, Brave, Firefox met strikte bescherming)
    # blokkeren standaard bestanden met namen als 'consent.js' of 'cookie-banner.js',
    # omdat dat patroon op bekende blokkeerlijsten (EasyList/EasyPrivacy) staat.
    # Een los bestand zou daardoor voor een deel van de bezoekers stil falen,
    # zonder dat daar een foutmelding van te zien is. Inline in de HTML is dat
    # risico er niet, omdat er geen apart, blokkeerbaar netwerkverzoek is.
    return f"""<script>
(function () {{
  var STORAGE_KEY = 'brabantschoon_cookie_consent';
  var gaId = '{GA_MEASUREMENT_ID}';
  var banner = document.getElementById('cookieBanner');
  var acceptBtn = document.getElementById('cookieAccept');
  var rejectBtn = document.getElementById('cookieReject');

  function loadGoogleAnalytics() {{
    if (!gaId || window.__gaLoaded) return;
    window.__gaLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + gaId;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() {{ window.dataLayer.push(arguments); }}
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', gaId, {{ anonymize_ip: true }});
  }}

  function removeAnalyticsCookies() {{
    document.cookie.split(';').forEach(function (c) {{
      var name = c.split('=')[0].trim();
      if (name.indexOf('_ga') === 0) {{
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + location.hostname + ';';
      }}
    }});
  }}

  function hideBanner() {{ if (banner) banner.hidden = true; }}
  function showBanner() {{ if (banner) banner.hidden = false; }}
  function getConsent() {{ try {{ return localStorage.getItem(STORAGE_KEY); }} catch (e) {{ return null; }} }}
  function setConsent(v) {{ try {{ localStorage.setItem(STORAGE_KEY, v); }} catch (e) {{}} }}

  function applyStoredConsent() {{
    var consent = getConsent();
    if (consent === 'accepted') {{ loadGoogleAnalytics(); hideBanner(); }}
    else if (consent === 'rejected') {{ hideBanner(); }}
    else {{ showBanner(); }}
  }}

  if (acceptBtn) acceptBtn.addEventListener('click', function () {{
    setConsent('accepted'); loadGoogleAnalytics(); hideBanner();
  }});
  if (rejectBtn) rejectBtn.addEventListener('click', function () {{
    setConsent('rejected'); removeAnalyticsCookies(); hideBanner();
  }});

  window.reopenCookieBanner = function () {{ showBanner(); }};
  applyStoredConsent();
}})();
</script>"""
EMAIL = "info@brabantschoon.nl"
WA_LINK = "https://wa.me/31492313050?text=Hoi%2C%20ik%20wil%20graag%20een%20offerte%20aanvragen"
KVK = "99274175"
CITY = "Helmond"
ASSET_VERSION = "183"

# ---------------------------------------------------------------
# ICONS
# ---------------------------------------------------------------
ICONS = {
    "check": '<path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/>',
    "tick": '<path d="M5 13l4 4L19 7"/>',
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
        return f'<img src="../images/{photo}" alt="{svc["name"]} door Brabantschoon in Brabant" class="{css_class}" width="1200" height="800" loading="lazy" decoding="async" style="width:100%; height:100%; object-fit:cover;">'
    return service_illustration(svc["icon"])

def service_visual_from_root(svc, css_class=""):
    """Zelfde als service_visual, maar met pad relatief vanaf de hoofdmap (voor home/diensten.html)."""
    photo = SERVICE_PHOTOS.get(svc["slug"])
    if photo:
        return f'<img src="images/{photo}" alt="{svc["name"]} door Brabantschoon in Brabant" class="{css_class}" width="1200" height="800" loading="lazy" decoding="async" style="width:100%; height:100%; object-fit:cover;">'
    return service_illustration(svc["icon"])

def hero_illustration():
    return f"""<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <circle cx="320" cy="90" r="70" fill="#0B3D73" opacity="0.08"/>
  <circle cx="70" cy="330" r="50" fill="#007A33" opacity="0.08"/>
  <rect x="70" y="80" width="220" height="220" rx="18" fill="#FFFFFF" stroke="#002B5C" stroke-width="3"/>
  <line x1="180" y1="80" x2="180" y2="300" stroke="#002B5C" stroke-width="3"/>
  <line x1="70" y1="190" x2="290" y2="190" stroke="#002B5C" stroke-width="3"/>
  <g transform="rotate(-32 200 190)">
    <rect x="150" y="176" width="120" height="28" rx="14" fill="#007A33"/>
    <rect x="255" y="184" width="70" height="12" rx="6" fill="#0B3D73"/>
  </g>
  {sparkle(320, 250, 14, '#0B3D73')}
  {sparkle(60, 100, 10, '#007A33')}
  {sparkle(300, 60, 8, '#F0A93B')}
  <g transform="translate(300,230)">
    <rect x="0" y="26" width="46" height="80" rx="8" fill="#002B5C"/>
    <rect x="10" y="4" width="26" height="24" rx="5" fill="#0B3D73"/>
    <rect x="30" y="0" width="22" height="9" rx="4" fill="#565E72"/>
  </g>
</svg>"""

def service_illustration(icon_name, tint_stroke="#002B5C"):
    body = ICONS[icon_name]
    return f"""<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="164" cy="40" r="20" fill="#0B3D73" opacity="0.10"/>
  <circle cx="30" cy="164" r="16" fill="#007A33" opacity="0.10"/>
  <g transform="translate(40,40) scale(5)" fill="none" stroke="{tint_stroke}" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">{body}</g>
  {sparkle(168, 156, 9, '#F0A93B')}
  {sparkle(28, 32, 7, '#0B3D73')}
</svg>"""

# ---------------------------------------------------------------
# SERVICES (volgorde per brief)
# ---------------------------------------------------------------
SERVICES = [
    {"slug": "kantoorreiniging", "icon": "office", "tint": "tint-1",
     "name": "Kantoorreiniging",
     "short": "Vaste of periodieke reiniging van uw kantoorpand, buiten werktijd.",
     "intro": "Een schone werkomgeving draagt bij aan hoe medewerkers en bezoekers uw bedrijf ervaren. We verzorgen de reiniging van uw kantoor op een vast, betrouwbaar ritme.",
     "bullets": ["Werkplekken, bureaus en vloeren", "Sanitair en pantry/kantine", "Algemene ruimtes en gangen", "Afvalverwerking", "Optioneel: periodieke dieptereiniging", "Optioneel: glasbewassing"],
     "for": "Kantoren en praktijken in Brabant.", "faqs": [("Hoe vaak kan kantoorreiniging plaatsvinden?", "Dat bepaalt u zelf: van dagelijks tot wekelijks, afhankelijk van de grootte en het gebruik van uw kantoor."), ("Werkt u buiten kantoortijden?", "Ja, we plannen de reiniging doorgaans buiten werktijd, zodat uw bedrijfsvoering geen hinder ondervindt.")]},
    {"slug": "glasbewassing", "icon": "window", "tint": "tint-2",
     "name": "Glasbewassing",
     "short": "Ramen en kozijnen streeploos schoon, binnen en buiten.",
     "intro": "Helder glaswerk maakt direct verschil in de uitstraling van een pand. We reinigen ramen en kozijnen zorgvuldig, eenmalig of op een vast interval.",
     "bullets": ["Binnen- en buitenzijde", "Kozijnen en sponningen", "Op aanvraag of vast interval"],
     "for": "Kantoren, winkels en woningen.", "faqs": [("Hoe vaak is glasbewassing nodig?", "Dat hangt af van de locatie; een vast interval van enkele weken tot maandelijks is gebruikelijk."), ("Kunt u ook hoger gelegen ramen laten reinigen?", "Ja, met de juiste hulpmiddelen reinigen we ramen op verschillende hoogtes.")]},
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
     "for": "Verhuurders, aannemers en particulieren.", "faqs": [("Hoe snel kan opleveringsschoonmaak worden ingepland?", "We bespreken de mogelijkheden snel, afhankelijk van de planning en de grootte van het pand."), ("Is opleveringsschoonmaak ook geschikt na een verbouwing?", "Ja, we verwijderen bouwstof en resten zodat het pand klaar is voor gebruik of oplevering.")]},
    {"slug": "vve-schoonmaak", "icon": "building", "tint": "tint-5",
     "name": "VvE-schoonmaak",
     "short": "Onderhoud van trappenhuizen en gemeenschappelijke ruimtes.",
     "intro": "Gemeenschappelijke ruimtes verdienen structureel onderhoud. Van trappenhuis en entree tot gangen, vloeren, glazen deuren en veelgebruikte contactpunten zoals deurklinken en lichtschakelaars \u2014 we werken met een vaste schoonmaakplanning op een frequentie die past bij uw gebouw, van wekelijks tot periodiek. Heeft het complex een lift? Ook die nemen we desgewenst mee in de ronde. We stemmen een vast schema af met VvE-besturen en beheerders, en resultaat en afspraken worden steekproefsgewijs gecontroleerd zodat de afgesproken kwaliteit ook op langere termijn geborgd blijft. Elke VvE is anders, dus werkzaamheden en frequentie zijn altijd maatwerk.",
     "bullets": ["Trappenhuizen en entrees", "Liften en gangen, indien van toepassing", "Vloeren, glas en deuren", "Veelgebruikte contactpunten", "Vaste schoonmaakplanning", "Direct contact met het bestuur"],
     "for": "VvE-besturen en beheerders.",
     "seo_title": "VvE-schoonmaak Brabant | Trappenhuis &amp; ruimtes | Brabantschoon",
     "seo_meta": "VvE-schoonmaak in Brabant: trappenhuis, entree en gemeenschappelijke ruimtes structureel schoon. Vanuit Helmond actief voor VvE's in heel Brabant.",
     "extra_link_html": '<p class="prose" style="margin-top:16px;">Op zoek naar VvE-schoonmaak in Helmond zelf? Bekijk onze <a href="{base}schoonmaakbedrijf-helmond.html" style="color:var(--link); font-weight:600;">schoonmaakdiensten in Helmond</a>.</p>',
     "faqs": [("Hoe wordt de frequentie van VvE-schoonmaak bepaald?", "In overleg met het bestuur stellen we een schema op dat past bij het gebruik van de gemeenschappelijke ruimtes."), ("Kan de VvE één vast aanspreekpunt krijgen?", "Ja, u krijgt een vast contact voor afstemming en eventuele bijzonderheden."), ("Wordt ook de lift meegenomen in de schoonmaak?", "Als het gebouw een lift heeft, kan die op verzoek worden meegenomen in de vaste ronde."), ("Werkt Brabantschoon ook voor VvE's buiten Helmond?", "Ja, we verzorgen VvE-schoonmaak voor besturen en beheerders in heel Brabant, vanuit onze thuisbasis in Helmond.")]},
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
     "for": "Bedrijven met specifieke reinigingsvragen.",
     "seo_title": "Tapijtreiniging &amp; specialistische reiniging | Brabantschoon",
     "seo_meta": "Tapijtreiniging en specialistische reiniging van vloeren en bijzondere oppervlakken door Brabantschoon, vanuit Helmond actief in Brabant.",
     "faqs": [("Welke oppervlakken kunt u specialistisch laten reinigen?", "Onder andere tapijt, stoffering en diverse vloertypen, afhankelijk van de vraag."), ("Is specialistische reiniging ook eenmalig mogelijk?", "Ja, dit is vaak maatwerk en prima als eenmalige beurt aan te vragen.")]},
]

# Ronde 44: koppelt elke zakelijke dienstpagina (SERVICES, hierboven) aan de
# bijbehorende wizard-dienst-slug (MASTER_DIENSTEN, verderop in dit bestand) en
# het klanttype waarmee de offertewizard-CTA moet voorselecteren — zodat een
# bezoeker die vanaf een SPECIFIEKE dienstpagina op "Offerte aanvragen" klikt de
# vraag "Waar wilt u een offerte voor aanvragen?" nooit nogmaals hoeft te
# beantwoorden (zie CHANGELOG-44.md). "periodieke-schoonmaak" hergebruikt bewust
# de bestaande, gedeelde slug "periodiek-zakelijk" (zie MASTER_DIENSTEN) in
# plaats van een nieuwe slug te introduceren voor exact dezelfde dienst.
# vve-schoonmaak is de enige dienst die uitsluitend bij klanttype "vve" hoort
# (zie MASTER_DIENSTEN); de overige 6 zijn beschikbaar voor zowel bedrijf als
# vve, en gebruiken daarom net als de rest van de site het generieke
# "type=zakelijk" (komt in de wizard overeen met klanttype "Bedrijf" — zie
# QUERY_TYPE_MAP in js/main.js; de bezoeker kan dit altijd corrigeren via
# "Terug").
SERVICE_TO_WIZARD_DIENST_SLUG = {
    "kantoorreiniging": "kantoorreiniging",
    "glasbewassing": "glasbewassing-zakelijk",
    "gevelreiniging": "gevelreiniging",
    "opleveringsschoonmaak": "opleveringsschoonmaak",
    "vve-schoonmaak": "vve-schoonmaak",
    "periodieke-schoonmaak": "periodiek-zakelijk",
    "specialistische-reiniging": "specialistische-reiniging",
}
SERVICE_TO_WIZARD_TYPE = {
    "vve-schoonmaak": "vve",
}

WERKGEBIED_KERN = ["Helmond", "Deurne", "Asten", "Someren", "Gemert-Bakel", "Laarbeek"]
WERKGEBIED_OVERIG = ["Eindhoven", "Geldrop-Mierlo", "Nuenen", "Mierlo"]

NAV_LINKS = [
    ("Home", "/"),
    ("Diensten", "diensten.html"),
    ("Zakelijk", "zakelijke-schoonmaak.html"),
    ("Particulier", "schoonmaak-particulieren.html"),
    ("Werkgebied", "werkgebied.html"),
    ("Over ons", "over-ons.html"),
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
<meta name="theme-color" content="#002B5C">
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
  "name": "Brabantschoon",
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
  "name": "Brabantschoon",
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
  "name": "{svc['name']} | Brabantschoon",
  "description": "{svc['short']}",
  "provider": {{"@type": "LocalBusiness", "name": "Brabantschoon", "url": "{SITE_URL}/"}},
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
    <a href="/" class="logo"><img src="{base}images/logo.png" alt="Brabantschoon" width="242" height="28"></a>
    <nav class="links">
      {links_html}
    </nav>
    <div class="nav-actions">
      <a href="tel:{PHONE_TEL}" class="phone-link">{PHONE_DISPLAY}</a>
      <a href="{base}offerte.html#offerteWizard" class="btn btn-primary btn-sm">Offerte<span class="cta-full-text"> aanvragen</span></a>
      <label for="menuCheckbox" class="menu-toggle" aria-label="Menu openen">{icon('list')}</label>
    </div>
  </div>
</header>
<label for="menuCheckbox" class="menu-overlay"></label>
<aside class="mobile-sidebar">
  <div class="mobile-menu-top">
    <img src="{base}images/logo.png" alt="Brabantschoon" width="225" height="26">
    <label for="menuCheckbox" class="mobile-menu-close" aria-label="Menu sluiten">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </label>
  </div>
  <div class="mobile-menu-links">
    {mobile_links}
    <a href="tel:{PHONE_TEL}" class="mobile-phone-link">{PHONE_DISPLAY}</a>
  </div>
  <div class="mobile-menu-cta-wrap">
    <a href="{base}offerte.html#offerteWizard" class="btn btn-primary mobile-cta">Offerte aanvragen</a>
  </div>
</aside>"""

def render_footer(base):
    return f"""<footer class="site-footer">
  <div class="wrap">
    <div class="footer-top footer-top-3col">
      <div class="footer-col footer-brand-col">
        <img src="{base}images/logo.png" alt="Brabantschoon" width="260" height="30">
        <p class="footer-tagline">Professionele schoonmaakpartner voor bedrijven, VvE's, organisaties en particulieren in Brabant.</p>
        <div class="footer-meta">KvK {KVK} &bull; BTW NL005380198B12</div>
      </div>

      <div class="footer-col">
        <h4>Snelle links</h4>
        <a href="/">Home</a>
        <a href="{base}diensten.html">Diensten</a>
        <a href="{base}zakelijke-schoonmaak.html">Zakelijke schoonmaak</a>
        <a href="{base}schoonmaak-particulieren.html">Particuliere schoonmaak</a>
        <a href="{base}over-ons.html">Over ons</a>
        <a href="{base}werkgebied.html">Werkgebied</a>
        <a href="{base}contact.html">Contact</a>
        <a href="{base}offerte.html#offerteWizard">Offerte aanvragen</a>
      </div>

      <div class="footer-col footer-form-col">
        <h4>Snel contact aanvragen</h4>
        <p class="footer-form-intro">Laat uw naam en telefoonnummer achter. Wij nemen doorgaans binnen \u00e9\u00e9n werkdag contact met u op.</p>
        <noscript><p class="prose" style="background:#FFF7E6; border:1px solid #F0D9A0; border-radius:12px; padding:12px 16px; margin-bottom:12px; font-size:13px;">Dit formulier werkt het best met JavaScript ingeschakeld. Lukt dat niet? Bel of mail ons gerust rechtstreeks: <a href="tel:{PHONE_TEL}" style="color:var(--link); font-weight:600;">{PHONE_DISPLAY}</a> of <a href="mailto:{EMAIL}" style="color:var(--link); font-weight:600;">{EMAIL}</a>.</p></noscript>
        <form name="footer-terugbel" method="POST" action="/api/contact-aanvraag" class="footer-form" id="footerTerugbelForm">
          <input type="checkbox" name="botcheck" class="hidden-field" tabindex="-1" autocomplete="off">
          <input type="hidden" name="form_rendered_at" id="footerFormRenderedAtField" value="">
          <div class="footer-form-row">
            <input type="text" name="naam" placeholder="Naam" required>
            <input type="tel" name="telefoon" placeholder="Telefoonnummer" required pattern="[0-9+\\-\\s()]{{6,}}" title="Gebruik alleen cijfers, spaties en +/-/()">
          </div>
          <div class="footer-form-row">
            <input type="email" name="email" placeholder="E-mailadres" required>
            <input type="text" name="bedrijfsnaam" placeholder="Bedrijfsnaam (optioneel)">
          </div>
          <textarea name="bericht" placeholder="Bericht (optioneel)" rows="2"></textarea>
          <button type="submit" class="btn btn-primary footer-form-submit">Laat mij terugbellen</button>
          <p class="wizard-status" id="footerFormStatus" aria-live="polite"></p>
        </form>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="footer-copy">
        <span>&copy; 2026 Brabantschoon. Alle rechten voorbehouden.</span>
      </div>
      <div class="footer-legal-links">
        <a href="{base}privacy.html">Privacybeleid</a>
        <a href="{base}cookiebeleid.html">Cookiebeleid</a>
        <a href="{base}voorwaarden.html">Algemene voorwaarden</a>
        <a href="{base}sitemap.xml">Sitemap</a>
        <a href="#" onclick="window.reopenCookieBanner && window.reopenCookieBanner(); return false;">Cookievoorkeuren wijzigen</a>
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
    items = [("doc", f"KvK {KVK}"), ("pin", "Actief in Brabant"), ("chat", "Persoonlijk contact, geen callcenter"), ("clock", "Ook buiten kantooruren bereikbaar")]
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

def cta_band(heading="Interesse in onze diensten?", sub="Vraag een vrijblijvende offerte aan of neem direct contact op.", base="", type_param="", dienst_param=""):
    # dienst_param mag alleen gevuld zijn als type_param ook gevuld is (de wizard
    # negeert een dienst-parameter sowieso als het type niet eerst bekend is, zie
    # js/main.js) — hier expliciet zo gebouwd zodat een aanroep nooit per ongeluk
    # alleen &dienst= zonder ?type= oplevert.
    qs_parts = []
    if type_param:
        qs_parts.append(f"type={type_param}")
        if dienst_param:
            qs_parts.append(f"dienst={dienst_param}")
    type_qs = ("?" + "&amp;".join(qs_parts)) if qs_parts else ""
    return f"""<div class="cta-band reveal">
    <h2>{heading}</h2>
    <p>{sub}</p>
    <div class="hero-actions">
      <a href="{base}offerte.html{type_qs}#offerteWizard" class="btn btn-primary">Vrijblijvende offerte</a>
      <a href="tel:{PHONE_TEL}" class="btn btn-outline">Neem contact op</a>
    </div>
  </div>"""

def faq_block(items):
    return "\n      ".join(f'<details><summary>{q}<span class="chev">{icon("chevron")}</span></summary><div class="faq-a-wrap"><p class="faq-a">{a}</p></div></details>' for q, a in items)

FAQ_ITEMS = [
    ("Wat kost een schoonmaakdienst van Brabantschoon?", "De prijs is afhankelijk van onder andere de locatie, werkzaamheden en frequentie. Voor periodieke zakelijke schoonmaak plannen we waar nodig eerst een korte, vrijblijvende locatieopname \u2014 zo maken we een offerte die aansluit op de daadwerkelijke werkzaamheden."),
    ("In welke regio\u2019s is Brabantschoon actief?", f"Brabantschoon is actief in heel Noord-Brabant, vanuit onze thuisbasis in {CITY}. Rond {CITY} en de Peelgemeenten \u2014 Deurne, Asten, Someren, Gemert-Bakel en Laarbeek \u2014 zijn we het snelst ter plaatse; voor opdrachten elders in de provincie rijden we graag mee."),
    ("Werk ik steeds met dezelfde persoon of hetzelfde team?", "Ja, u krijgt een vast aanspreekpunt en een vast team dat uw locatie kent \u2014 zodat u niet steeds opnieuw hoeft uit te leggen hoe u het wilt."),
    ("Kan ik ook een eenmalige schoonmaakbeurt aanvragen?", "Ja, naast vaste afspraken verzorgen we ook maatwerk voor eenmalige beurten, bijvoorbeeld bij een oplevering of verhuizing."),
    ("Hoe snel kunt u starten?", "Dat verschilt per situatie, maar we plannen doorgaans snel een kennismaking in. Bij spoed zijn we ook buiten kantooruren bereikbaar via telefoon of WhatsApp."),
    ("Is een offerte altijd vrijblijvend?", "Ja, elke offerte is geheel vrijblijvend en kosteloos. U beslist zelf of en hoe u verdergaat."),
]

def choice_cards_block(base=""):
    zakelijk_tags = "".join(f"<li>{icon('check')}{t}</li>" for t in [
        "Kantoren en bedrijfsruimtes", "VvE's en trappenhallen", "Scholen en organisaties",
        "Zorglocaties", "Periodieke schoonmaak", "Specialistische reiniging",
    ])
    particulier_tags = "".join(f"<li>{icon('check')}{t}</li>" for t in [
        "Grote schoonmaak", "Verhuisschoonmaak", "Schoonmaak na verbouwing",
        "Opleveringsschoonmaak", "Periodieke schoonmaak",
    ])
    return f"""<div class="choice-grid reveal">
      <a href="{base}zakelijke-schoonmaak.html" class="choice-card">
        <div class="choice-media">
          <img src="{base}images/diensten/kantoorreiniging.jpg" alt="Zakelijke schoonmaak door Brabantschoon" width="1200" height="800" loading="lazy" decoding="async">
        </div>
        <div class="choice-body">
          <span class="choice-label">Voor bedrijven</span>
          <h3>Zakelijke schoonmaak</h3>
          <p>Een representatieve en schone werkomgeving, met duidelijke afspraken en een vast aanspreekpunt.</p>
          <ul class="choice-tags">{zakelijk_tags}</ul>
          <span class="btn btn-primary">Bekijk zakelijke schoonmaak</span>
        </div>
      </a>
      <a href="{base}schoonmaak-particulieren.html" class="choice-card">
        <div class="choice-media">
          <img src="{base}images/diensten/particuliere-schoonmaak-brabantschoon.webp" alt="Particuliere schoonmaak door Brabantschoon" width="1200" height="800" loading="lazy" decoding="async">
        </div>
        <div class="choice-body">
          <span class="choice-label">Voor particulieren</span>
          <h3>Particuliere schoonmaak</h3>
          <p>Professionele schoonmaak voor uw woning, wanneer het echt grondig en goed moet gebeuren.</p>
          <ul class="choice-tags">{particulier_tags}</ul>
          <span class="btn btn-primary">Bekijk particuliere schoonmaak</span>
        </div>
      </a>
    </div>"""

def reviews_widget_block():
    return """<div class="reviews-compact reveal">
      <div class="reviews-compact-label">
        <span>Benieuwd naar onze beoordelingen?</span>
      </div>
      <a href="https://www.google.com/search?q=Brabantschoon+Helmond" target="_blank" rel="noopener" class="btn btn-outline">Bekijk onze reviews op Google</a>
    </div>"""

WIZARD_KLANTTYPE = [
    ("Bedrijf", "office", "Kantoor, winkel of ander bedrijfspand"),
    ("VvE / organisatie", "building", "Vereniging van eigenaars of instelling"),
    ("Particulier", "key", "Schoonmaak voor uw eigen woning"),
]

# Centrale dienstenlijst. Elke dienst hoort bij 1 of meer klanttypes ("bedrijf",
# "vve", "particulier"). De wizard rendert alle opties EENMAAL in de HTML (met
# data-customer-types), en JavaScript toont/verbergt per klanttype — zo blijft de
# lijst 1 onderhoudbare bron in plaats van 3 losse, uit de pas lopende lijsten.
# Het 5e veld (slug) is alleen gevuld bij particuliere diensten: hiermee filtert
# de wizard automatisch de bijbehorende pakketten en extra werkzaamheden
# (zie PARTICULIER_WIZARD_PAKKETTEN / PARTICULIER_WIZARD_EXTRAS hieronder).
MASTER_DIENSTEN = [
    # Ronde 44: Kantoorreiniging krijgt als tweede zakelijke dienst een eigen slug
    # ("kantoorreiniging", zelfde string als de website-slug diensten/kantoorreiniging.html)
    # \u2014 hiermee kan zowel de dienstpagina-CTA de wizard voorselecteren (zie
    # build_service_pages()/SERVICE_TO_WIZARD_DIENST_SLUG) als de interne calculator
    # (api/offerte-aanvraag.js) hem gericht aanroepen: dezelfde vraagset (oppervlakte/
    # ruimtes/vervuiling/frequentie) als periodieke bedrijfsschoonmaak is hier
    # inhoudelijk toepasbaar (zie CHANGELOG-44.md \u00a7 calculatorbereik-analyse).
    ("Kantoorreiniging", "office", "Kantoor, praktijk of bedrijfspand", ["bedrijf"], "kantoorreiniging"),
    # "Periodieke bedrijfsschoonmaak" en "Periodieke schoonmaak" (vve) delen bewust
    # dezelfde slug "periodiek-zakelijk": hierop wordt de wizard-stap "Welke
    # ruimtes/vervuiling/moment" (zie contact_form(), stap 9) en de interne
    # calculatiemotor (zie api/offerte-aanvraag.js) gericht. Andere zakelijke
    # diensten hieronder kregen in ronde 44 ALLEEN een slug voor CTA-voorselectie
    # (zie SERVICE_TO_WIZARD_DIENST_SLUG) \u2014 g\u00e9\u00e9n interne calculatie, omdat daar
    # geen betrouwbaar tijdmodel/kenmerkenset voor bestaat (zie CHANGELOG-44.md).
    ("Periodieke bedrijfsschoonmaak", "clock", "Vast ritme, wekelijks of maandelijks", ["bedrijf"], "periodiek-zakelijk"),
    ("Winkel- of showroomreiniging", "shop", "Winkel of showroom", ["bedrijf"], ""),
    ("Praktijk- of zorglocatiereiniging", "practice", "Zorg- of behandelpraktijk", ["bedrijf"], ""),
    ("Industri\u00eble schoonmaak", "building", "Bedrijfshal of productieruimte", ["bedrijf"], ""),
    ("Evenementenreiniging", "check", "Voor of na een evenement", ["bedrijf"], ""),
    # VvE-schoonmaak krijgt slug "vve-schoonmaak" (zelfde string als de
    # website-slug diensten/vve-schoonmaak.html) voor CTA-voorselectie.
    ("VvE-schoonmaak", "building", "Trappenhuis of gemeenschappelijke ruimte", ["vve"], "vve-schoonmaak"),
    ("Trappenhuisreiniging", "stairs", "Gemeenschappelijk trappenhuis", ["vve"], ""),
    ("Schoonmaak van gemeenschappelijke ruimtes", "building", "Entree, gangen en bergingen", ["vve"], ""),
    ("Periodieke schoonmaak", "clock", "Vast ritme, wekelijks of maandelijks", ["vve"], "periodiek-zakelijk"),
    ("Schoonmaak van scholen of instellingen", "school", "Onderwijs- of instellingslocatie", ["vve"], ""),
    ("Zorglocaties", "practice", "Zorginstelling of behandellocatie", ["vve"], ""),
    # Glasbewassing (zakelijk/VvE) krijgt bewust een ANDERE slug dan de
    # particuliere "glasbewassing-particulier" hierbeneden, zodat beide nooit met
    # elkaar te verwarren zijn in logs/tests/e-mails.
    ("Glasbewassing", "window", "Ramen en kozijnen binnen en buiten", ["bedrijf", "vve"], "glasbewassing-zakelijk"),
    ("Gevelreiniging", "facade", "Buitengevel of buitenmuur", ["bedrijf", "vve"], "gevelreiniging"),
    ("Opleveringsschoonmaak", "key", "Verhuizing, oplevering of verbouwing", ["bedrijf", "vve"], "opleveringsschoonmaak"),
    ("Specialistische reiniging", "spark", "Tapijt, vloer of maatwerk", ["bedrijf", "vve"], "specialistische-reiniging"),
    ("Verhuisschoonmaak", "key", "Woning schoon voor of na de verhuizing", ["particulier"], "verhuisschoonmaak"),
    ("Eenmalige grote schoonmaak", "spark", "Grondige beurt zonder vast contract", ["particulier"], "grote-schoonmaak"),
    ("Schoonmaak na verbouwing", "check", "Bouwstof en normaal schoonmaakvuil verwijderen", ["particulier"], "na-verbouwing"),
    ("Periodieke schoonmaak", "clock", "Vaste, terugkerende schoonmaak van uw woning", ["particulier"], "periodiek"),
    ("Bij verkoop, verhuur of oplevering", "doc", "Woning schoon voor bezichtiging of oplevering", ["particulier"], "oplevering"),
    ("Glasbewassing", "window", "Ramen streeploos schoon, eenmalig of periodiek", ["particulier"], "glasbewassing-particulier"),
    ("Ik weet het nog niet / graag advies", "chat", "We denken graag met u mee", ["particulier"], "weet-niet"),
    ("Anders / eigen omschrijving", "chat", "Vertel ons uw situatie", ["bedrijf", "vve"], ""),
]

PARTICULIER_FREQUENTIE = [
    ("Wekelijks", "Elke week hetzelfde ritme"),
    ("Iedere 2 weken", "Elke twee weken"),
    ("Iedere 4 weken", "Eens per maand"),
]

PARTICULIER_VERVUILING = [
    ("Normaal vervuild", "Reguliere staat van onderhoud"),
    ("Sterk vervuild", "+20% op de pakketprijs"),
    ("Zeer sterk vervuild / bijzondere situatie", "Prijs op maat, na beoordeling"),
]

PARTICULIER_BEWOOND = [
    ("Ja, volledig leeg", "De woning staat helemaal leeg"),
    ("Grotendeels leeg", "Op enkele spullen na leeg"),
    ("Nee, nog ingericht", "De woning wordt nog gebruikt/bewoond"),
]

# Alleen relevant bij "Schoonmaak na verbouwing" (wizard-subsection data-requires-dienst)
PARTICULIER_VERBOUWING_OPTIES = [
    ("Keuken", ""), ("Badkamer", ""), ("E\u00e9n kamer", ""),
    ("Meerdere kamers", ""), ("Gehele woning", ""), ("Anders", ""),
]
PARTICULIER_BOUWRESTEN_OPTIES = [
    ("Nee, geen hardnekkige bouwresten", "Normale hoeveelheid bouwstof"),
    ("Ja, er zijn hardnekkige bouwresten", "Bijv. verf-, kit-, lijm- of cementresten \u2014 prijs op maat"),
]

# Alleen relevant bij particuliere glasbewassing (wizard-subsection
# data-requires-dienst="glasbewassing-particulier"). Nog geen vaste
# tarieven/staffels (zie brief) — uitsluitend intake-informatie voor een
# prijsindicatie op maat.
GLAS_TYPE_OPTIES = [
    ("Alleen buitenzijde", "Buitenkant van de ramen"),
    ("Binnen- en buitenzijde", "Beide zijden"),
    ("Graag advies / weet ik nog niet", "We denken graag met u mee"),
]
GLAS_FREQUENTIE_OPTIES = [
    ("Eenmalig", "E\u00e9n keer"),
    ("Periodiek", "Vast terugkerend ritme"),
    ("Weet ik nog niet", "In overleg te bepalen"),
]
GLAS_VERDIEPING_OPTIES = [
    ("Begane grond", ""), ("Eerste verdieping", ""),
    ("Tweede verdieping of hoger", ""), ("Verschillende verdiepingen", ""),
]
GLAS_BEREIKBAARHEID_OPTIES = [
    ("Ja, normaal bereikbaar", "Met een gewone ladder of vanaf de grond"),
    ("Nee, moeilijk bereikbaar", "Bijzondere situatie \u2014 prijs op maat"),
    ("Weet ik niet", "We beoordelen dit graag met u"),
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

# ---------------------------------------------------------------
# ZAKELIJKE WIZARD-UITBREIDING (periodieke bedrijfs-/VvE-schoonmaak)
# ---------------------------------------------------------------
# Relevant bij de dienst-slugs in CALC_DIENST_SLUGS (js/main.js /
# lib/calculator.js — sinds ronde 44 ook "kantoorreiniging", niet meer
# uitsluitend "periodiek-zakelijk"; zie MASTER_DIENSTEN) — ingezet via
# wizard-stap 9 in contact_form(). Doel: genoeg informatie verzamelen om een
# interne tijd-/prijsindicatie te kunnen berekenen (Calculator v2, zie
# lib/calculator.js), zonder de klant losse standaardwerkzaamheden
# (stofzuigen, prullenbak legen, etc.) te laten aanvinken.
ZAKELIJK_RUIMTE_OPTIES = [
    ("ruimte_kantoor", "Kantoorruimte"),
    ("ruimte_kantine", "Kantine / pantry"),
    ("ruimte_toiletten", "Toiletten / sanitair"),
    ("ruimte_entree", "Entree / receptie"),
    ("ruimte_gangen", "Gangen / algemene ruimtes"),
    ("ruimte_vergaderruimte", "Vergader-/spreekruimtes"),
    ("ruimte_kleedruimte", "Kleedruimte"),
    ("ruimte_werkplaats", "Werkplaats / productieruimte"),
    ("ruimte_overig", "Overige ruimte"),
]
# (waarde, label, korte toelichting) — "Anders" geeft altijd een prijs op maat
# (net als bij de particuliere vervuilingsgraad), de twee tussenliggende opties
# tellen mee als tijdsfactor in de interne calculatie.
ZAKELIJK_VERVUILING_OPTIES = [
    ("Normale kantoor-/bedrijfsvervuiling", "Reguliere staat van onderhoud"),
    ("Enige extra vervuiling", "Bijvoorbeeld door regelmatig bezoek of gebruik"),
    ("Bovengemiddelde vervuiling", "Bijvoorbeeld vuil dat vanuit een werk- of productieruimte meekomt"),
    ("Anders / toelichting", "Vertel kort waar we rekening mee moeten houden"),
]
ZAKELIJK_MOMENT_OPTIES = [
    ("Tijdens kantooruren", "Terwijl uw locatie in gebruik is"),
    ("Voor opening", "Voordat uw locatie open gaat"),
    ("Na sluiting", "Nadat uw locatie gesloten is"),
    ("Geen voorkeur / in overleg", "We bespreken dit graag samen"),
]
# Ronde 46 (Calculator v2, zie lib/calculator.js): oppervlakte alleen is
# onvoldoende om de benodigde tijd goed in te schatten -- een kantoor met 5
# medewerkers vraagt een andere aanpak dan hetzelfde kantoor met 30. Alleen
# relevant/getoond op wizardstap 9, dus bij dezelfde diensten als de
# calculator zelf (CALC_DIENST_SLUGS).
ZAKELIJK_INTENSITEIT_OPTIES = [
    ("Rustig", "Weinig mensen, weinig beweging door de ruimte"),
    ("Gemiddeld", "Normale bezetting en gebruik"),
    ("Intensief", "Veel mensen/bezoek, of intensief gebruik van de ruimte"),
]

# Vraag- en hulpteksten per stap, per klanttype. Wordt door JavaScript ingezet
# zodra een klanttype gekozen is (zie main.js), zodat bijv. "Hoe groot is de
# locatie?" voor een particulier "Hoe groot is de woning ongeveer?" wordt.
WIZARD_STEP_LABELS = {
    "bedrijf": {
        "oppervlakte_q": "Hoe groot is de locatie ongeveer?",
        "oppervlakte_sub": "Een schatting is voldoende.",
        "toelichting_q": "Nog iets toe te lichten?",
    },
    "vve": {
        "oppervlakte_q": "Hoe groot is het gebouw of de gemeenschappelijke ruimte ongeveer?",
        "oppervlakte_sub": "Een schatting is voldoende.",
        "toelichting_q": "Nog iets toe te lichten?",
    },
    "particulier": {
        "oppervlakte_q": "Hoe groot is de woning ongeveer?",
        "oppervlakte_sub": "Een schatting is voldoende.",
        "toelichting_q": "Is er iets dat we vooraf moeten weten?",
    },
}

def radio_cards(name, options, columns=3):
    cards = []
    seen_ids = {}
    for opt in options:
        types = None
        slug = None
        if len(opt) == 5:
            label, icon_name, desc, types, slug = opt
        elif len(opt) == 4:
            label, icon_name, desc, types = opt
        elif len(opt) == 3:
            label, icon_name, desc = opt
        else:
            label, desc = opt
            icon_name = None
        icon_html = f'<div class="rc-icon">{icon(icon_name)}</div>' if icon_name else ""
        base_id = f"{name}-{re.sub(r'[^a-z0-9]+', '-', label.lower())}"
        # Sommige labels komen dubbel voor binnen 1 groep (bijv. "Periodieke
        # schoonmaak" voor zowel vve als particulier) — een oplopende teller
        # voorkomt dan een dubbele HTML-id.
        seen_ids[base_id] = seen_ids.get(base_id, 0) + 1
        opt_id = base_id if seen_ids[base_id] == 1 else f"{base_id}-{seen_ids[base_id]}"
        type_attr = f' data-customer-types="{" ".join(types)}"' if types else ""
        slug_attr = f' data-dienst-slug="{slug}"' if slug else ""
        wrapper_open = f'<div class="rc-wrap"{type_attr}{slug_attr}>' if types else ""
        wrapper_close = "</div>" if types else ""
        cards.append(f"""{wrapper_open}<input type="radio" name="{name}" id="{opt_id}" value="{label}" class="rc-input" required>
      <label for="{opt_id}" class="rc-card">
        {icon_html}
        <span class="rc-label">{label}</span>
        <span class="rc-desc">{desc}</span>
      </label>{wrapper_close}""")
    return f'<div class="radio-cards cols-{columns}">' + "\n      ".join(cards) + "</div>"

def particulier_pakket_cards():
    """Pakket-radiokaarten voor alle particuliere diensten in \u00e9\u00e9n keer gerenderd
    (data-dienst-for filtert per dienst via JS), plus een altijd zichtbare
    'weet ik niet'-optie."""
    blocks = []
    for slug, pakketten in PARTICULIER_WIZARD_PAKKETTEN.items():
        meest_gekozen_id = PARTICULIER_WIZARD_MEEST_GEKOZEN.get(slug)
        for pid, naam, desc in pakketten:
            opt_id = f"pakket-{slug}-{pid}"
            badge = '<span class="rc-badge">Meest gekozen</span>' if pid == meest_gekozen_id else ""
            blocks.append(f'''<div class="rc-wrap rc-hidden" data-dienst-for="{slug}">
      <input type="radio" name="pakket" id="{opt_id}" value="{naam}" class="rc-input" data-pakket-id="{pid}" required disabled>
      <label for="{opt_id}" class="rc-card">
        {badge}<span class="rc-label">{naam}</span>
        <span class="rc-desc">{desc}</span>
      </label>
    </div>''')
    blocks.append('''<div class="rc-wrap rc-hidden" data-dienst-for="all">
      <input type="radio" name="pakket" id="pakket-weet-niet" value="Ik weet het nog niet, graag advies" class="rc-input" data-pakket-id="weet-niet" required disabled>
      <label for="pakket-weet-niet" class="rc-card">
        <span class="rc-label">Ik weet het nog niet</span>
        <span class="rc-desc">Adviseer mij graag</span>
      </label>
    </div>''')
    return '<div class="radio-cards cols-3">' + "\n      ".join(blocks) + "</div>"

def particulier_extra_checkboxes_overig():
    """Gewone (onprijsde) checkbox-extra's voor particuliere diensten die
    BUITEN het nieuwe aantalselector-systeem vallen: periodieke schoonmaak,
    oplevering en 'weet ik nog niet' \u2014 deze opdracht voegt aantalselectors
    alleen toe aan de 3 pakket-diensten (grote schoonmaak, verhuisschoonmaak,
    na verbouwing)."""
    blocks = []
    for slug, opties in PARTICULIER_WIZARD_EXTRAS.items():
        if slug in PARTICULIER_INBEGREPEN:
            continue
        for opt in opties:
            blocks.append(f'<label class="cb-card cb-hidden" data-dienst-for="{slug}"><input type="checkbox" class="extra-checkbox" value="{opt}"><span>{opt}</span></label>')
    return "\n      ".join(blocks)

def particulier_extra_counters():
    """Aantalselector-kaarten ([\u2212] N [+]) voor de telbare, geprijsde extra
    opties (EXTRA_OPTIES_CONFIG), voor elk van de 3 pakket-diensten. Elke
    kaart draagt data-extra-id/data-price/data-eenheid/data-max zodat de
    JS-calculator ze herkent; welk aantal standaard "inbegrepen" is, bepaalt
    de JS live op basis van het gekozen pakket (PARTICULIER_INBEGREPEN)."""
    blocks = []
    for slug in PARTICULIER_INBEGREPEN.keys():
        for eid, label, prijs, eenheid, maxi in EXTRA_OPTIES_CONFIG:
            blocks.append(f'''<div class="counter-card cb-hidden" data-dienst-for="{slug}" data-extra-id="{eid}" data-price="{prijs}" data-eenheid="{eenheid}" data-max="{maxi}">
      <div class="counter-info">
        <span class="counter-label">{label}</span>
        <span class="counter-included-note" hidden></span>
        <span class="counter-price-note">+ \u20ac{prijs} per extra {eenheid}</span>
      </div>
      <div class="counter-controls">
        <button type="button" class="counter-btn counter-minus" aria-label="Minder {label}">\u2212</button>
        <input type="text" inputmode="numeric" class="counter-value" name="extra_aantal_{slug}_{eid}" value="0" readonly aria-label="Aantal {label.lower()}">
        <button type="button" class="counter-btn counter-plus" aria-label="Meer {label}">+</button>
      </div>
    </div>''')
    return "\n      ".join(blocks)

def contact_form():
    klanttype_cards = radio_cards("klanttype", WIZARD_KLANTTYPE, columns=3)
    dienst_cards = radio_cards("dienst", MASTER_DIENSTEN, columns=3)
    pakket_cards = particulier_pakket_cards()
    extra_counters = particulier_extra_counters()
    extra_checkboxes_overig = particulier_extra_checkboxes_overig()
    opp_cards = radio_cards("oppervlakte", WIZARD_OPPERVLAKTE, columns=2)
    freq_cards = radio_cards("frequentie", WIZARD_FREQUENTIE, columns=2)
    freq_particulier_cards = radio_cards("frequentie_particulier", PARTICULIER_FREQUENTIE, columns=2)
    vervuiling_cards = radio_cards("vervuilingsgraad", PARTICULIER_VERVUILING, columns=2)
    bewoond_cards = radio_cards("bewoond_leeg", PARTICULIER_BEWOOND, columns=2)
    verbouwing_cards = radio_cards("verbouwing_type", PARTICULIER_VERBOUWING_OPTIES, columns=3)
    bouwresten_cards = radio_cards("bouwresten", PARTICULIER_BOUWRESTEN_OPTIES, columns=2)
    glas_type_cards = radio_cards("glas_type", GLAS_TYPE_OPTIES, columns=1)
    glas_frequentie_cards = radio_cards("glas_frequentie", GLAS_FREQUENTIE_OPTIES, columns=1)
    glas_verdieping_cards = radio_cards("glas_verdieping", GLAS_VERDIEPING_OPTIES, columns=2)
    glas_bereikbaarheid_cards = radio_cards("glas_bereikbaarheid", GLAS_BEREIKBAARHEID_OPTIES, columns=1)
    staffel_options = [(STAFFEL_LABELS[s], "") for s in STAFFEL_OPTIES]
    staffel_cards = radio_cards("woonoppervlakte_staffel", staffel_options, columns=2)
    zakelijk_ruimte_cards = "\n      ".join(
        f'<label class="cb-card" data-ruimte-id="{rid}"><input type="checkbox" data-ruimte-id="{rid}"><span>{label}</span></label>'
        for rid, label in ZAKELIJK_RUIMTE_OPTIES
    )
    zakelijk_vervuiling_cards = radio_cards("vervuilingsgraad_zakelijk", ZAKELIJK_VERVUILING_OPTIES, columns=2)
    zakelijk_moment_cards = radio_cards("schoonmaakmoment", ZAKELIJK_MOMENT_OPTIES, columns=2)
    zakelijk_intensiteit_cards = radio_cards("gebruiksintensiteit_zakelijk", ZAKELIJK_INTENSITEIT_OPTIES, columns=3)
    prijs_data_json = json.dumps({
        "eenmalig": PARTICULIER_PRIJZEN,
        "periodiek": PERIODIEK_PRIJZEN,
        "extras": {eid: {"label": label, "prijs": prijs, "eenheid": eenheid} for eid, label, prijs, eenheid, maxi in EXTRA_OPTIES_CONFIG},
        "inbegrepen": PARTICULIER_INBEGREPEN,
        "staffelLabels": STAFFEL_LABELS,
        "toeslagPercentage": VERVUILING_TOESLAG_PERCENTAGE,
    }, ensure_ascii=False)
    L = WIZARD_STEP_LABELS
    return f"""<noscript><p class="prose" style="background:#FFF7E6; border:1px solid #F0D9A0; border-radius:12px; padding:16px 20px; margin-bottom:16px;">Dit formulier werkt het best met JavaScript ingeschakeld. Lukt dat niet? Bel of mail ons gerust rechtstreeks: <a href="tel:{PHONE_TEL}" style="color:var(--link); font-weight:600;">{PHONE_DISPLAY}</a> of <a href="mailto:{EMAIL}" style="color:var(--link); font-weight:600;">{EMAIL}</a>.</p></noscript>
  <script type="application/json" id="prijsData">{prijs_data_json}</script>
  <form name="offerte" method="POST" action="/api/offerte-aanvraag" class="wizard-form" id="offerteWizard" novalidate>
    <p id="wizardLive" class="sr-only" role="status" aria-live="polite"></p>
    <nav class="wizard-phases" id="wizardPhases" hidden aria-label="Voortgang offerteaanvraag">
      <div class="wizard-phases-track">
        <span class="wizard-phase" data-phase="woning"><span class="wizard-phase-dot"></span><span class="wizard-phase-label">Woning</span></span>
        <span class="wizard-phase" data-phase="extras"><span class="wizard-phase-dot"></span><span class="wizard-phase-label">Extra's</span></span>
        <span class="wizard-phase" data-phase="gegevens"><span class="wizard-phase-dot"></span><span class="wizard-phase-label">Gegevens</span></span>
        <span class="wizard-phase" data-phase="controleren"><span class="wizard-phase-dot"></span><span class="wizard-phase-label">Controleren</span></span>
      </div>
      <div class="wizard-phases-mobile">
        <div class="wizard-phases-mobile-top">
          <strong id="wizardPhaseNow"></strong>
          <span id="wizardPhaseNext"></span>
        </div>
        <div class="wizard-phases-mobile-bar"><div class="wizard-phases-mobile-fill" id="wizardPhaseFill"></div></div>
      </div>
    </nav>
    <p id="wizardStepLabel" class="wizard-step-label"></p>
    <input type="hidden" name="subject" value="Nieuwe offerteaanvraag via de website" id="wizardSubject">
    <input type="hidden" name="pakket_naam" id="pakketNaamField" value="">
    <input type="hidden" name="extra_opties" id="extraOptiesField" value="">
    <input type="hidden" name="prijsindicatie" id="prijsIndicatieField" value="">
    <input type="hidden" name="ruimtes" id="ruimtesField" value="">
    <input type="hidden" name="form_rendered_at" id="formRenderedAtField" value="">
    <input type="checkbox" name="botcheck" class="hidden-field" tabindex="-1" autocomplete="off">

    <div class="wizard-progress" aria-hidden="true">
      <div class="wizard-progress-bar"><div class="wizard-progress-fill" id="wizardFill"></div></div>
    </div>

    <div class="wizard-preselect" id="wizardPreselect" hidden>
      <div class="wizard-preselect-info">
        <span class="wizard-preselect-label">Uw keuze</span>
        <strong id="wizardPreselectText"></strong>
        <span id="wizardPreselectExtra" class="wizard-preselect-extra"></span>
      </div>
      <button type="button" class="wizard-preselect-change" id="wizardPreselectChange">Keuze wijzigen</button>
    </div>

    <div class="wizard-step" data-step="1">
      <h3 class="wizard-q">Ik vraag een offerte aan als:</h3>
      <p class="wizard-sub">Zo tonen we alleen de vragen en diensten die voor u relevant zijn.</p>
      {klanttype_cards}
    </div>

    <div class="wizard-step" data-step="2" hidden>
      <h3 class="wizard-q">Waar wilt u een offerte voor aanvragen?</h3>
      <p class="wizard-sub">Kies de dienst die het beste bij uw situatie past.</p>
      {dienst_cards}
    </div>

    <div class="wizard-step" data-step="3" hidden data-applies-to="particulier" data-excludes-dienst="periodiek glasbewassing-particulier">
      <h3 class="wizard-q">Welke uitvoering past bij u?</h3>
      <p class="wizard-sub">Kies het pakket dat het beste aansluit \u2014 op de dienstpagina leest u precies wat elk pakket inhoudt.</p>
      {pakket_cards}
    </div>

    <div class="wizard-step" data-step="4" hidden data-applies-to="particulier">
      <h3 class="wizard-q">Informatie over uw woning</h3>
      <p class="wizard-sub">Dit helpt ons een goede inschatting te maken \u2014 en bepaalt bij eenmalige diensten uw prijsindicatie hieronder.</p>
      <div class="wizard-subsection" data-excludes-dienst="glasbewassing-particulier">
        <div class="row2">
          <div><label for="typewoning">Type woning</label><input id="typewoning" name="typewoning" type="text" placeholder="Bijv. eengezinswoning, appartement"></div>
          <div><label for="slaapkamers">Aantal slaapkamers</label><input id="slaapkamers" name="slaapkamers" type="number" min="0" placeholder="Bijv. 3"></div>
        </div>
        <div class="row2" style="margin-top:14px;">
          <div><label for="badkamers">Aantal badkamers</label><input id="badkamers" name="badkamers" type="number" min="0" placeholder="Bijv. 1"></div>
          <div><label for="toiletten">Aantal toiletten</label><input id="toiletten" name="toiletten" type="number" min="0" placeholder="Bijv. 1"></div>
        </div>
        <div style="margin-top:22px;">
          <label style="display:block; margin-bottom:10px;">Woonoppervlakte</label>
          {staffel_cards}
        </div>
      </div>
      <div class="wizard-subsection" data-requires-dienst="verhuisschoonmaak" style="margin-top:22px;">
        <label style="display:block; margin-bottom:10px;">Is de woning tijdens de schoonmaak leeg?</label>
        {bewoond_cards}
        <p class="prose" id="ingerichtNote" style="margin-top:10px; font-size:13px; background:var(--bg-soft); border-radius:10px; padding:10px 14px;" hidden>Een ingerichte woning kan extra werkzaamheden vereisen. De definitieve prijs wordt na beoordeling bevestigd.</p>
      </div>
      <div class="wizard-subsection" data-excludes-dienst="periodiek glasbewassing-particulier" style="margin-top:22px;">
        <label style="display:block; margin-bottom:10px;">Hoe zou u de huidige staat omschrijven?</label>
        {vervuiling_cards}
      </div>
      <div class="wizard-subsection" data-requires-dienst="na-verbouwing" style="margin-top:22px;">
        <label style="display:block; margin-bottom:10px;">Wat is er verbouwd?</label>
        {verbouwing_cards}
      </div>
      <div class="wizard-subsection" data-requires-dienst="na-verbouwing" style="margin-top:22px;">
        <label style="display:block; margin-bottom:10px;">Zijn er hardnekkige bouwresten aanwezig?</label>
        <p class="prose" style="margin-top:-4px; margin-bottom:10px; font-size:13px;">Bijvoorbeeld verfspatten, kitresten, lijmresten, cement/cementsluier of vergelijkbare hardnekkige bouwresten.</p>
        {bouwresten_cards}
        <p class="prose" id="bouwrestenNote" style="margin-top:10px; font-size:13px; background:var(--bg-soft); border-radius:10px; padding:10px 14px;" hidden>Verwijdering van hardnekkige verf-, kit-, lijm-, cement- en vergelijkbare bouwresten is niet standaard in het pakket inbegrepen. We beoordelen dit soort situaties eerst, voordat we een definitieve prijs kunnen geven.</p>
      </div>
      <div class="wizard-subsection" data-requires-dienst="glasbewassing-particulier">
        <label style="display:block; margin-bottom:10px;">Wat wilt u laten reinigen?</label>
        {glas_type_cards}
        <label style="display:block; margin:20px 0 10px;">Hoe wilt u de glasbewassing afnemen?</label>
        {glas_frequentie_cards}
        <div class="row2" style="margin-top:20px;">
          <div><label for="glas_aantal">Aantal ramen/glasvlakken (indicatie)</label><input id="glas_aantal" name="glas_aantal" type="text" placeholder="Bijv. 8, of 'hele woning'"></div>
        </div>
        <label style="display:block; margin:20px 0 10px;">Waar bevinden de ramen zich?</label>
        {glas_verdieping_cards}
        <label style="display:block; margin:20px 0 10px;">Zijn alle ramen normaal bereikbaar?</label>
        {glas_bereikbaarheid_cards}
        <p class="prose" id="glasBereikbaarheidNote" style="margin-top:10px; font-size:13px; background:var(--bg-soft); border-radius:10px; padding:10px 14px;" hidden>Bij moeilijk bereikbare of bijzondere situaties beoordelen we dit eerst persoonlijk, voordat we een passende offerte kunnen opstellen.</p>
      </div>
      <div id="prijsBlokWoning"></div>
    </div>

    <div class="wizard-step" data-step="5" hidden data-applies-to="particulier">
      <h3 class="wizard-q">Extra werkzaamheden</h3>
      <p class="wizard-sub" data-excludes-dienst="glasbewassing-particulier">Optioneel \u2014 kies alles wat van toepassing is. Prijzen zijn incl. btw en tellen mee in uw prijsindicatie.</p>
      <p class="wizard-sub" data-requires-dienst="glasbewassing-particulier" hidden>Optioneel \u2014 laat weten of er nog iets bij mag, of vertel kort een bijzonderheid.</p>
      <div class="wizard-subsection" data-requires-dienst="periodiek" style="margin-bottom:14px;">
        <p class="prose" style="font-size:13px; background:var(--bg-soft); border-radius:10px; padding:10px 14px; margin:0;">Deze extra prijs geldt voor de schoonmaakbeurt waarvoor u nu een offerte aanvraagt \u2014 niet automatisch voor elke toekomstige beurt. Wilt u een extra werkzaamheid vaker laten uitvoeren, geef dat dan aan bij "Omschrijving" verderop, dan bespreken we dit graag met u.</p>
      </div>
      <div class="wizard-subsection" data-excludes-dienst="glasbewassing-particulier">
        <div class="counter-cards" id="extraCounters">
          {extra_counters}
        </div>
      </div>
      <div class="checkbox-cards" id="extraCheckboxes" style="margin-top:12px;">
        {extra_checkboxes_overig}
      </div>
      <div class="checkbox-cards" style="margin-top:12px;">
        <label class="cb-card" data-dienst-for="all"><input type="checkbox" id="extraAndersCheck"><span>Anders, namelijk\u2026 <em style="font-weight:400;">(prijs op maat)</em></span></label>
      </div>
      <div id="extraAndersWrap" style="margin-top:14px;" hidden>
        <label for="extra_anders">Omschrijving / opmerkingen</label>
        <input id="extra_anders" name="extra_anders" type="text" placeholder="Vertel kort wat u bedoelt" disabled>
      </div>
      <div id="prijsBlokExtra" style="margin-top:18px;"></div>
    </div>

    <div class="wizard-step" data-step="6" hidden data-applies-to="particulier" data-requires-dienst="periodiek">
      <h3 class="wizard-q">Hoe vaak wilt u schoonmaak?</h3>
      <p class="wizard-sub">U kunt dit later altijd nog aanpassen.</p>
      {freq_particulier_cards}
      <div id="prijsBlokFrequentie" style="margin-top:22px;"></div>
    </div>

    <div class="wizard-step" data-step="7" hidden data-applies-to="bedrijf vve">
      <h3 class="wizard-q" id="oppervlakteQ"
          data-q-bedrijf="{L['bedrijf']['oppervlakte_q']}"
          data-q-vve="{L['vve']['oppervlakte_q']}">{L['bedrijf']['oppervlakte_q']}</h3>
      <p class="wizard-sub" id="oppervlakteSub"
          data-q-bedrijf="{L['bedrijf']['oppervlakte_sub']}"
          data-q-vve="{L['vve']['oppervlakte_sub']}">{L['bedrijf']['oppervlakte_sub']}</p>
      {opp_cards}
      <div style="margin-top:18px; max-width:260px;">
        <label for="oppervlakte_m2_exact">Weet u ongeveer hoeveel m² er daadwerkelijk schoongemaakt moet worden? <span style="font-weight:400;">(optioneel)</span></label>
        <input id="oppervlakte_m2_exact" name="oppervlakte_m2_exact" type="number" inputmode="numeric" min="1" max="20000" placeholder="Bijv. 85" autocomplete="off">
        <p class="wizard-sub" style="margin-top:6px; font-size:13px;">Niet zeker? U kunt dit overslaan. Het gaat nadrukkelijk om de schoon te maken oppervlakte, niet noodzakelijk het volledige bedrijfspand.</p>
      </div>
    </div>

    <div class="wizard-step" data-step="8" hidden data-applies-to="bedrijf vve">
      <h3 class="wizard-q">Hoe vaak wilt u schoonmaak?</h3>
      <p class="wizard-sub">U kunt dit later altijd nog aanpassen.</p>
      {freq_cards}
      <div id="fieldMeerderePerWeek" style="margin-top:14px;" hidden>
        <label for="meerdere_per_week_aantal">Hoeveel keer per week ongeveer?</label>
        <input id="meerdere_per_week_aantal" name="meerdere_per_week_aantal" type="number" min="2" max="14" placeholder="Bijv. 2" disabled>
      </div>
    </div>

    <div class="wizard-step" data-step="9" hidden data-applies-to="bedrijf vve" data-requires-dienst="periodiek-zakelijk kantoorreiniging">
      <h3 class="wizard-q">Welke ruimtes moeten worden schoongemaakt?</h3>
      <p class="wizard-sub">Kies alles wat van toepassing is — dit helpt ons de benodigde tijd goed in te schatten.</p>
      <div class="checkbox-cards" id="zakelijkRuimtes">
        {zakelijk_ruimte_cards}
      </div>
      <div id="ruimteOverigWrap" style="margin-top:14px;" hidden>
        <label for="ruimte_overig_toelichting">Om welke ruimte gaat het?</label>
        <input id="ruimte_overig_toelichting" name="ruimte_overig_toelichting" type="text" placeholder="Bijv. showroom, werkplaats" disabled>
      </div>
      <div style="margin-top:26px;">
        <label style="display:block; margin-bottom:10px;">Hoe intensief wordt de locatie dagelijks gebruikt?</label>
        {zakelijk_intensiteit_cards}
      </div>
      <div style="margin-top:26px;">
        <label style="display:block; margin-bottom:10px;">Is er sprake van extra vervuiling waar we rekening mee moeten houden?</label>
        {zakelijk_vervuiling_cards}
      </div>
      <div id="vervuilingZakelijkToelichtingWrap" style="margin-top:14px;" hidden>
        <label for="vervuiling_zakelijk_toelichting">Korte toelichting</label>
        <input id="vervuiling_zakelijk_toelichting" name="vervuiling_zakelijk_toelichting" type="text" placeholder="Vertel kort waar we rekening mee moeten houden" disabled>
      </div>
      <div style="margin-top:26px;">
        <label style="display:block; margin-bottom:10px;">Wanneer heeft u de schoonmaak bij voorkeur?</label>
        {zakelijk_moment_cards}
      </div>
    </div>

    <div class="wizard-step" data-step="10" hidden>
      <h3 class="wizard-q" id="toelichtingQ"
          data-q-bedrijf="{L['bedrijf']['toelichting_q']}"
          data-q-vve="{L['vve']['toelichting_q']}"
          data-q-particulier="{L['particulier']['toelichting_q']}">{L['bedrijf']['toelichting_q']}</h3>
      <p class="wizard-sub">Alle velden hieronder zijn optioneel.</p>
      <div>
        <label for="startdatum">Gewenste datum/periode <span style="font-weight:400;">(optioneel)</span></label>
        <input id="startdatum" name="startdatum" type="text" placeholder="Bijv. zo snel mogelijk">
      </div>
      <div id="fieldAantalLocaties" style="margin-top:14px;" hidden>
        <label for="aantal_locaties">Aantal locaties <span style="font-weight:400;">(indien van toepassing, optioneel)</span></label>
        <input id="aantal_locaties" name="aantal_locaties" type="text" placeholder="Bijv. 1, of 3 vestigingen" disabled>
      </div>
      <div style="margin-top:14px;">
        <label for="bericht">Omschrijving <span style="font-weight:400;">(optioneel)</span></label>
        <textarea id="bericht" name="bericht" rows="4" placeholder="Vertel kort wat er schoongemaakt moet worden en of er bijzonderheden zijn."></textarea>
      </div>
    </div>

    <div class="wizard-step" data-step="11" hidden>
      <h3 class="wizard-q">Uw gegevens</h3>
      <p class="wizard-sub">Zodat we contact met u kunnen opnemen.</p>
      <div class="row2">
        <div><label for="naam">Naam</label><input id="naam" name="naam" type="text" required placeholder="Voor- en achternaam"></div>
        <div id="fieldBedrijfsnaam"><label for="bedrijfsnaam">Bedrijfsnaam of VvE <span style="font-weight:400;">(optioneel)</span></label><input id="bedrijfsnaam" name="bedrijfsnaam" type="text" placeholder="Naam van uw bedrijf of VvE"></div>
      </div>
      <div class="row2">
        <div><label for="email">E-mailadres</label><input id="email" name="email" type="email" required placeholder="jij@voorbeeld.nl"></div>
        <div><label for="telefoon">Telefoonnummer</label><input id="telefoon" name="telefoon" type="tel" required pattern="[0-9+\\-\\s()]{{6,}}" title="Gebruik alleen cijfers, spaties en +/-/()" placeholder="06 - 12 34 56 78"></div>
      </div>
      <div><label for="plaats">Plaats / postcode</label><input id="plaats" name="plaats" type="text" required placeholder="Bijv. Helmond of 5701 AB"></div>
    </div>

    <div class="wizard-step" data-step="12" hidden>
      <h3 class="wizard-q">Controleer uw aanvraag</h3>
      <p class="wizard-sub">Klopt alles? Dan kunt u de aanvraag verzenden. Wilt u iets aanpassen, gebruik dan "Terug".</p>
      <dl class="wizard-summary" id="wizardSummary" aria-live="polite"></dl>
      <div id="prijsBlokControle" style="margin-top:16px;"></div>
    </div>

    <div class="wizard-nav">
      <button type="button" class="btn btn-outline wizard-back" id="wizardBack" hidden>Terug</button>
      <button type="button" class="btn btn-primary wizard-next" id="wizardNext">Volgende</button>
      <button type="submit" class="btn btn-primary wizard-submit" id="wizardSubmit" hidden>Vraag vrijblijvende offerte aan</button>
    </div>
    <p class="wizard-status" id="wizardStatus" aria-live="polite"></p>
  </form>"""

def contact_info_block(base="", show_heading=True, show_map=True):
    heading = '<span class="eyebrow">Contact</span>\n    <h2>Vraag uw offerte aan.</h2>\n    <p>Neem contact op via telefoon, e-mail of het formulier. We reageren doorgaans binnen \u00e9\u00e9n werkdag.</p>' if show_heading else ''
    maps_src = f"https://www.google.com/maps?q={CITY},+Noord-Brabant&output=embed"
    map_html = f"""<div class="contact-map" id="mapWrap" data-src="{maps_src}">
      <div class="map-placeholder">
        <div class="map-placeholder-visual" aria-hidden="true">
          <div class="map-pin">{icon('pin', cls='map-pin-icon')}<span>Brabantschoon</span></div>
        </div>
        <div class="map-placeholder-info">
          <p>Actief in Brabant, vanuit {CITY}. De interactieve kaart van Google Maps wordt pas geladen na uw klik, zodat er vooraf geen gegevens met Google worden gedeeld.</p>
          <button type="button" class="btn btn-outline map-load-btn" data-target="mapWrap">Kaart laden</button>
        </div>
      </div>
    </div>""" if show_map else ""
    return f"""<div class="contact-info">
    {heading}
    <div class="contact-line">{icon('phone')}<a href="tel:{PHONE_TEL}">{PHONE_DISPLAY}</a></div>
    <div class="contact-line">{icon('mail')}<a href="mailto:{EMAIL}">{EMAIL}</a></div>
    <div class="contact-line">{icon('pin')}<span style="font-weight:600; font-size:15.5px;">Actief in Brabant \u2014 vanuit {CITY}</span></div>
    <div class="contact-actions">
      <a href="{WA_LINK}" class="btn btn-outline" target="_blank" rel="noopener">WhatsApp</a>
      <a href="tel:{PHONE_TEL}" class="btn btn-outline">Bel direct</a>
    </div>
    {map_html}
  </div>"""

def page_shell(title, description, path, base, active, body, extra_schema="", preload_image=None, body_class=""):
    body_class_attr = f' class="{body_class}"' if body_class else ""
    return f"""<!DOCTYPE html>
<html lang="nl">
<head>
{render_head(title, description, path, base, extra_schema, preload_image)}
</head>
<body{body_class_attr}>
{render_header(base, active)}
<main id="main-content">
{body}
</main>
{render_footer(base)}
<div class="mobile-cta-bar">
  <a href="tel:{PHONE_TEL}" class="btn btn-outline">Bel direct</a>
  <a href="{base}offerte.html#offerteWizard" class="btn btn-primary">Vrijblijvende offerte</a>
</div>

<div class="cookie-banner" id="cookieBanner" role="dialog" aria-live="polite" aria-label="Cookiemelding" hidden>
  <div class="cookie-banner-inner">
    <p>Wij gebruiken alleen cookies die noodzakelijk zijn voor de werking van de site. Met uw toestemming gebruiken we ook Google Analytics om het gebruik van de website te meten. Lees ons <a href="{base}cookiebeleid.html">cookiebeleid</a>.</p>
    <div class="cookie-banner-actions">
      <button type="button" class="btn btn-outline" id="cookieReject">Alleen noodzakelijk</button>
      <button type="button" class="btn btn-primary" id="cookieAccept">Accepteren</button>
    </div>
  </div>
</div>

{consent_script_inline()}
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
    usp_items = [
        ("chat", "Vast aanspreekpunt", "U spreekt altijd met iemand die uw locatie en wensen kent \u2014 geen callcenter."),
        ("check", "Afspraak is afspraak", "Heldere planning die we nakomen, zonder verrassingen achteraf."),
        ("clock", "Flexibiliteit", "Frequentie en tijdstip volledig afgestemd op uw situatie."),
        ("spark", "Kwaliteitscontrole", "Resultaat en afspraken worden steekproefsgewijs nagelopen, niet alleen bij de eerste beurt."),
    ]
    usp_html = "\n    ".join(f'<div class="usp"><div class="icon-circle">{icon(n)}</div><h3>{t}</h3><p>{d}</p></div>' for n, t, d in usp_items)

    body = f"""
  <section class="hero-full hero-full-home">
    <img src="images/hero.jpg" alt="Bedrijfsbusjes van Brabantschoon bij zonsondergang voor een kantoorpand" class="hero-full-img" width="2000" height="1125" fetchpriority="high" decoding="async">
    <div class="hero-full-overlay hero-full-overlay-home"></div>
    <div class="wrap hero-full-content hero-full-content-home">
      <div class="hero-text-panel">
        <span class="eyebrow" style="color:#BFE0FF;">Professionele schoonmaak in Brabant</span>
        <h1>De schoonmaakpartner van Brabant</h1>
        <p class="lead" style="color:rgba(255,255,255,0.92);">Voor bedrijven en particulieren. Professioneel, betrouwbaar en met een vast aanspreekpunt.</p>
        <div class="hero-audience-choice">
          <a href="zakelijke-schoonmaak.html" class="btn-audience-lg btn-audience-business">Voor bedrijven <span aria-hidden="true">&rarr;</span></a>
          <a href="schoonmaak-particulieren.html" class="btn-audience-lg btn-audience-particulier">Voor particulieren <span aria-hidden="true">&rarr;</span></a>
        </div>
      </div>
    </div>
  </section>

  <section>
    <div class="wrap">
      <div class="sec-head reveal">
        <span class="eyebrow">Diensten</span>
        <h2>Waarvoor u ons kunt inschakelen.</h2>
      </div>
      <div class="area-tags reveal">
        <a href="diensten/kantoorreiniging.html" class="area-tag primary" style="text-decoration:none; display:inline-block;">Kantoorreiniging</a>
        <a href="diensten/periodieke-schoonmaak.html" class="area-tag primary" style="text-decoration:none; display:inline-block;">Periodieke bedrijfsschoonmaak</a>
        <a href="diensten/vve-schoonmaak.html" class="area-tag primary" style="text-decoration:none; display:inline-block;">VvE-schoonmaak</a>
        <a href="diensten/glasbewassing.html" class="area-tag primary" style="text-decoration:none; display:inline-block;">Glasbewassing</a>
        <a href="diensten/opleveringsschoonmaak.html" class="area-tag primary" style="text-decoration:none; display:inline-block;">Opleveringsschoonmaak</a>
        <a href="schoonmaak-particulieren.html" class="area-tag" style="text-decoration:none; display:inline-block;">Particuliere schoonmaak</a>
      </div>
      <p class="prose reveal" style="text-align:center; margin-top:18px;"><a href="diensten.html" style="color:var(--link); font-weight:600;">Bekijk alle diensten &rarr;</a></p>
    </div>
  </section>

  <section>
    <div class="wrap">
      <div class="sec-head reveal">
        <span class="eyebrow">Waarom Brabantschoon</span>
        <h2>Waarom klanten voor Brabantschoon kiezen.</h2>
      </div>
      <div class="usp-grid reveal">
        {usp_html}
      </div>
    </div>
  </section>

  <section>
    <div class="wrap">
      <div class="sec-head reveal">
        <span class="eyebrow">Werkwijze</span>
        <h2>Zo werken wij.</h2>
      </div>
      <div class="steps reveal">
        <div class="step"><div class="stepnum">1</div><h3>Vertel wat u nodig heeft</h3><p>Kies uw dienst of vraag direct een offerte aan.</p></div>
        <div class="step"><div class="stepnum">2</div><h3>Ontvang een duidelijke offerte</h3><p>U weet vooraf waar u aan toe bent.</p></div>
        <div class="step"><div class="stepnum">3</div><h3>Wij regelen de schoonmaak</h3><p>Duidelijke afspraken en professionele uitvoering.</p></div>
      </div>
    </div>
  </section>

  <section style="background:var(--bg-soft);">
    <div class="wrap">
      <div class="elfsight-wrap reveal">
        <script src="https://elfsightcdn.com/platform.js" async></script>
        <div class="elfsight-app-7ea68963-3f6d-4b24-8a1b-e38a25bac6e2" data-elfsight-app-lazy></div>
      </div>
    </div>
  </section>

  <section class="section-tight">
    <div class="wrap-narrow" style="text-align:center;">
      <span class="eyebrow">Werkgebied</span>
      <h2 style="margin-top:8px;">Actief in heel Noord-Brabant.</h2>
      <p class="prose reveal" style="margin-top:10px;">Vanuit {CITY} verzorgen we schoonmaak voor bedrijven en particulieren in heel Noord-Brabant \u2014 vraag gerust naar de mogelijkheden voor uw locatie.</p>
      <div class="area-tags reveal" style="margin-top:16px;">
        <a href="schoonmaakbedrijf-helmond.html" class="area-tag" style="text-decoration:none; display:inline-block;">Helmond</a>
        <a href="schoonmaakbedrijf-eindhoven.html" class="area-tag" style="text-decoration:none; display:inline-block;">Eindhoven</a>
        <a href="schoonmaakbedrijf-deurne.html" class="area-tag" style="text-decoration:none; display:inline-block;">Deurne</a>
        <a href="schoonmaakbedrijf-asten.html" class="area-tag" style="text-decoration:none; display:inline-block;">Asten</a>
        <a href="schoonmaakbedrijf-someren.html" class="area-tag" style="text-decoration:none; display:inline-block;">Someren</a>
        <a href="werkgebied.html" class="area-tag" style="text-decoration:none; display:inline-block; color:var(--link); font-weight:600;">Volledig werkgebied &rarr;</a>
      </div>
    </div>
  </section>

  <section id="contact">
    <div class="wrap">
      <div class="benefits-strip reveal">
        <span>{icon('check')}Vrijblijvende offerte</span>
        <span>{icon('clock')}Reactie doorgaans binnen \u00e9\u00e9n werkdag</span>
        <span>{icon('doc')}Duidelijke offerte</span>
        <span>{icon('pin')}Actief in Brabant</span>
      </div>
      <div class="two-col reveal">
        {contact_info_block(base, show_map=False)}
        <div class="quick-cta-card">
          <h3>Benieuwd wat wij voor u kunnen betekenen?</h3>
          <p>Vraag vrijblijvend een offerte aan. We nemen doorgaans binnen \u00e9\u00e9n werkdag contact met u op om uw wensen te bespreken.</p>
          <div class="hero-actions">
            <a href="{base}offerte.html#offerteWizard" class="btn btn-primary">Offerte aanvragen</a>
            <a href="{base}contact.html" class="btn btn-outline">Neem contact op</a>
          </div>
        </div>
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
        "Schoonmaakbedrijf in Brabant | Kantoren &amp; VvE&#39;s | Brabantschoon",
        f"Brabantschoon is uw schoonmaakpartner voor kantoren, VvE's, organisaties en particulieren in Brabant. Vrijblijvende offerte binnen één werkdag.",
        "", base, "/", body, LOCALBUSINESS_SCHEMA + "\n" + faq_schema(FAQ_ITEMS[:5]),
        preload_image="images/hero.jpg", body_class="home-hero"
    ))

def page_hero(eyebrow, title, lead, base, crumb_label, image=None, image_alt="", compact=False):
    if image:
        compact_class = " hero-full-compact" if compact else ""
        return f"""<section class="hero-full hero-full-inner{compact_class}">
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
    body = f"""
  {page_hero("Diensten", "Onze diensten.", "Van dagelijks onderhoud tot specialistisch werk \u2014 voor bedrijven en particulieren.", base, "Diensten")}
  <section class="section-tight" style="padding-bottom:0;">
    <div class="wrap-narrow">
      <p class="prose reveal">Elke locatie is anders. De juiste aanpak en frequentie hangen af van het type ruimte, het gebruik ervan en uw wensen \u2014 daarom stemmen we onze diensten altijd af op uw specifieke situatie. Kies hieronder de richting die bij u past voor een volledig overzicht.</p>
    </div>
  </section>
  <section>
    <div class="wrap">
      {choice_cards_block(base)}
    </div>
  </section>
  <section style="background:var(--bg-soft);"><div class="wrap">{cta_band(base=base)}</div></section>
"""
    write("diensten.html", page_shell(
        "Diensten | Zakelijk &amp; particulier | Brabantschoon",
        "Bekijk de diensten van Brabantschoon: zakelijke schoonmaak voor kantoren en VvE's, en particuliere schoonmaak voor uw woning. Vraag een offerte aan.",
        "diensten.html", base, "diensten.html", body, breadcrumb_schema("Diensten", "diensten.html")
    ))

# =================================================================
# SERVICE PAGES
# =================================================================
def build_service_pages():
    base = "../"
    for s in SERVICES:
        # Ronde 44: elke dienstpagina kent zijn eigen wizard-dienst-slug (zie
        # SERVICE_TO_WIZARD_DIENST_SLUG hierboven) — de offerte-CTA's op deze
        # pagina geven die slug altijd mee, zodat de wizard de dienstvraag kan
        # overslaan (zie contact_form()/js/main.js). Elke SERVICES-dienst heeft
        # een mapping; de lege-string-fallback is puur een vangnet mocht een
        # toekomstige nieuwe dienst per ongeluk nog niet in de mapping staan —
        # dan valt de CTA terug op het oude, generieke gedrag (dienstvraag blijft
        # gewoon verschijnen) in plaats van een kapotte link te genereren.
        wizard_slug = SERVICE_TO_WIZARD_DIENST_SLUG.get(s["slug"], "")
        wizard_type = SERVICE_TO_WIZARD_TYPE.get(s["slug"], "zakelijk")
        offerte_qs = f"?type={wizard_type}&amp;dienst={wizard_slug}" if wizard_slug else f"?type={wizard_type}"
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
                          image_alt=f"{s['name']} door Brabantschoon", compact=True)
        body = f"""
  {hero}
  <section class="section-tight">
    <div class="wrap">
      <div class="two-col reveal">
        <div>
          <p class="prose">{s['intro']}</p>
          <ul class="prose" style="margin-top:16px;">{bullets_html}</ul>
          <div class="hero-actions" style="margin-top:24px;">
            <a href="{base}offerte.html{offerte_qs}#offerteWizard" class="btn btn-primary">Vraag offerte aan</a>
            <a href="tel:{PHONE_TEL}" class="btn btn-outline">Bel direct</a>
          </div>
          {'<p class="prose" style="margin-top:14px; font-size:13.5px;">Nog niet zeker wat u nodig heeft? <a href="' + base + 'contact.html" style="color:var(--link); font-weight:600;">Plan vrijblijvend een locatieopname</a> \u2014 we bekijken de werkzaamheden samen, zodat de offerte precies aansluit.</p>' if s['slug'] == 'periodieke-schoonmaak' else ''}
          {s.get('extra_link_html', '').format(base=base)}
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
  <section><div class="wrap">{cta_band(f"Interesse in {s['name']}?", "Vraag een vrijblijvende offerte aan.", base, type_param=wizard_type, dienst_param=wizard_slug)}</div></section>
  <section class="section-tight">
    <div class="wrap-narrow" style="text-align:center;">
      <p class="prose">Actief in <a href="{base}werkgebied.html" style="color:var(--link); font-weight:600;">Brabant</a> &mdash; bekijk ook onze <a href="{base}diensten.html" style="color:var(--link); font-weight:600;">overige diensten</a>.</p>
    </div>
  </section>
"""
        SERVICE_LABEL_OVERRIDES = {"VvE-schoonmaak": "VvE-schoonmaak"}
        service_label = SERVICE_LABEL_OVERRIDES.get(s['name'], s['name'][0].lower() + s['name'][1:])
        title = s.get('seo_title', f"{s['name']} | Brabantschoon")
        meta = s.get('seo_meta', f"{s['short']} Brabantschoon verzorgt {service_label} voor bedrijven, VvE's en organisaties in Brabant.")
        write(f"diensten/{s['slug']}.html", page_shell(
            title, meta,
            f"diensten/{s['slug']}.html", base, "diensten.html",
            body, service_schema(s) + "\n" + breadcrumb_schema(s['name'], f"diensten/{s['slug']}.html") + "\n" + faq_schema(s["faqs"])
        ))

# =================================================================
# ZAKELIJKE SCHOONMAAK
# =================================================================
def build_zakelijke_pagina():
    base = ""
    service_grid_html = "\n    ".join(f"""<a href="diensten/{s['slug']}.html" class="service-card">
      <div class="thumb {s['tint']}">{service_visual_from_root(s)}</div>
      <div class="body"><h3>{s['name']}</h3><p>{s['short']}</p><span class="sc-link">Meer informatie {icon('arrow')}</span></div>
    </a>""" for s in SERVICES)
    sector_tags = "\n      ".join(f'<span class="area-tag primary">{s}</span>' for s in
        ["Kantoren", "Bedrijfsverzamelgebouwen", "VvE's", "Scholen", "Zorglocaties", "Winkels &amp; praktijken", "Bedrijfsruimtes"])
    zakelijke_faqs = [
        ("Werken jullie met een vast contract of ook eenmalig?", "Beide is mogelijk \u2014 van een vaste, periodieke schoonmaakbeurt tot een eenmalige opdracht zoals een opleveringsschoonmaak."),
        ("Wat kost zakelijke schoonmaak?", "Dat hangt af van het pand, de oppervlakte, de gewenste frequentie en de werkzaamheden. We werken met een offerte op maat in plaats van vaste tarieven."),
        ("Werken jullie ook voor scholen en zorglocaties?", "Ja, naast kantoren en VvE's zijn we ook inzetbaar voor onderwijs- en zorglocaties, met oog voor de hygiëne-eisen die daarbij horen."),
        ("Hoe snel kunnen jullie starten?", "Na een kort kennismakingsgesprek bespreken we de mogelijkheden en een realistische startdatum."),
    ]
    faq_html = faq_block(zakelijke_faqs)
    hero = page_hero("Zakelijke schoonmaak", "Schoonmaak voor bedrijven en organisaties.",
                      "Een representatieve, schone werkomgeving voor kantoren, VvE's, scholen en andere organisaties \u2014 met duidelijke afspraken en een vast aanspreekpunt.",
                      base, "Zakelijke schoonmaak")
    body = f"""
  {hero}
  <section class="section-tight">
    <div class="wrap-narrow">
      <p class="prose reveal">Brabantschoon verzorgt zakelijke schoonmaak op maat: de juiste aanpak en frequentie hangen af van uw pand, het gebruik ervan en uw wensen. Van een vast, periodiek contract tot een eenmalige opdracht \u2014 hieronder vindt u een overzicht van onze zakelijke dienstverlening.</p>
    </div>
  </section>
  <section class="section-tight" style="padding-top:0;">
    <div class="wrap">
      <div class="sec-head reveal"><span class="eyebrow">Onze diensten</span><h2>Waarvoor u ons kunt inschakelen.</h2></div>
      <div class="grid-3 reveal">{service_grid_html}</div>
    </div>
  </section>
  <section style="background:var(--bg-soft);">
    <div class="wrap">
      <div class="sec-head reveal"><span class="eyebrow">Voor wie</span><h2>Sectoren die we bedienen.</h2></div>
      <div class="area-tags reveal">
      {sector_tags}
      </div>
    </div>
  </section>
  <section class="section-tight">
    <div class="wrap">
      <div class="two-col reveal">
        <div>
          <div class="hero-actions">
            <a href="{base}offerte.html?type=zakelijk#offerteWizard" class="btn btn-primary">Vraag vrijblijvend een offerte aan</a>
            <a href="tel:{PHONE_TEL}" class="btn btn-outline">Bel direct</a>
          </div>
          <p class="prose" style="margin-top:14px; font-size:13.5px;">Nog niet zeker wat u nodig heeft? <a href="{base}contact.html" style="color:var(--link); font-weight:600;">Plan vrijblijvend een locatieopname</a> \u2014 we bekijken de werkzaamheden samen, zodat de offerte precies aansluit.</p>
        </div>
        <div>
          <div class="faq">{faq_html}</div>
        </div>
      </div>
    </div>
  </section>
  <section style="background:var(--bg-soft);"><div class="wrap">{cta_band("Interesse in zakelijke schoonmaak?", "Vraag vrijblijvend een offerte aan of neem direct contact op.", base, type_param="zakelijk")}</div></section>
  <section class="section-tight">
    <div class="wrap-narrow" style="text-align:center;">
      <p class="prose">Actief in <a href="{base}werkgebied.html" style="color:var(--link); font-weight:600;">Brabant</a>, vanuit {CITY} \u2014 op zoek naar schoonmaak voor uw eigen woning? Bekijk <a href="{base}schoonmaak-particulieren.html" style="color:var(--link); font-weight:600;">particuliere schoonmaak</a>.</p>
    </div>
  </section>
"""
    zakelijk_svc_schema = {"name": "Zakelijke schoonmaak", "short": "Professionele zakelijke schoonmaak voor kantoren, VvE's, scholen, zorglocaties en andere organisaties in Brabant."}
    write("zakelijke-schoonmaak.html", page_shell(
        "Zakelijke schoonmaak | Brabantschoon",
        "Zakelijke schoonmaak door Brabantschoon: kantoren, VvE's, scholen en zorglocaties in Brabant. Vraag vrijblijvend een offerte op maat aan.",
        "zakelijke-schoonmaak.html", base, "zakelijke-schoonmaak.html",
        body,
        service_schema(zakelijk_svc_schema) + "\n" + breadcrumb_schema("Zakelijke schoonmaak", "zakelijke-schoonmaak.html") + "\n" + faq_schema(zakelijke_faqs)
    ))

# =================================================================
# PARTICULIERE SCHOONMAAK
# =================================================================
PARTICULIER_SUBDIENSTEN = [
    ("Verhuisschoonmaak", "Uw oude woning schoon opgeleverd, of uw nieuwe woning grondig schoongemaakt v\u00f3\u00f3r de verhuizing.",
     "verhuisschoonmaak-brabantschoon.webp", "Brabantschoon-medewerker verzorgt een verhuisschoonmaak in een lege woning met verhuisdozen",
     "verhuisschoonmaak.html"),
    ("Eenmalige grote schoonmaak", "Een grondige beurt voor uw hele woning, zonder dat daar direct een vaste overeenkomst voor nodig is.",
     "eenmalige-grote-schoonmaak-brabantschoon.webp", "Brabantschoon-medewerkster verzorgt een eenmalige grote schoonmaak in de woonkamer",
     "eenmalige-grote-schoonmaak.html"),
    ("Schoonmaak na verbouwing", "Verwijderen van bouwstof en normaal schoonmaakvuil na een renovatie of verbouwing.",
     "schoonmaak-na-verbouwing-brabantschoon.webp", "Brabantschoon-medewerkster verwijdert bouwstof na een verbouwing",
     "schoonmaak-na-verbouwing.html"),
    ("Periodieke schoonmaak", "Terugkerende professionele schoonmaak van uw woning, op een ritme dat u zelf bepaalt.",
     "periodieke-schoonmaak-brabantschoon.webp", "Brabantschoon-medewerkster verzorgt periodieke schoonmaak van het keukenblok",
     "periodieke-schoonmaak-particulier.html"),
    ("Bij verkoop, verhuur of oplevering", "Uw woning schoon voor bezichtigingen, verhuur of de sleuteloverdracht.",
     "opleveringsschoonmaak-brabantschoon.webp", "Brabantschoon-medewerkster inspecteert een woning bij oplevering",
     "opleveringsschoonmaak-particulier.html"),
    ("Glasbewassing", "Streeploos schone ramen voor uw woning, eenmalig of periodiek.",
     "glasbewassing.jpg", "Streeploos schone ramen na professionele glasbewassing door Brabantschoon",
     "glasbewassing-particulier.html"),
]

# Generieke werkwijze-stappen, hergebruikt op alle 5 particuliere detailpagina's
# (zie build_particulier_detail_pages). Compact gehouden op 3 stappen.
PARTICULIER_WERKWIJZE = [
    ("1", "Offerte aanvragen", "Vertel kort wat u nodig heeft \u2014 we denken graag mee als u er nog niet uit bent."),
    ("2", "Afspraak", "We stemmen de werkzaamheden en een passende planning met u af."),
    ("3", "Schoon", "Ons team voert de afgesproken schoonmaak zorgvuldig uit."),
]

# Volledige content per particuliere detailpagina. Elk item bevat alle
# onderdelen die build_particulier_detail_pages() nodig heeft om de pagina
# op te bouwen: url/bestandsnaam, SEO-teksten, en de inhoudelijke secties.
PARTICULIER_PAGES = [
    {
        "filename": "verhuisschoonmaak.html",
        "slug": "verhuisschoonmaak",
        "title": "Verhuisschoonmaak",
        "meta_title": "Verhuisschoonmaak | Brabantschoon",
        "meta_description": "Verhuisschoonmaak door Brabantschoon: uw oude woning schoon opgeleverd of uw nieuwe woning grondig schoon v\u00f3\u00f3r de verhuizing. Vraag vrijblijvend een offerte aan.",
        "lead": "Uw oude woning schoon opgeleverd, of uw nieuwe woning grondig schoongemaakt v\u00f3\u00f3r de verhuizing.",
        "img": "verhuisschoonmaak-brabantschoon.webp",
        "alt": "Brabantschoon-medewerker verzorgt een verhuisschoonmaak in een lege woning met verhuisdozen",
        "voor_wie": [
            "U levert uw oude woning schoon op bij het einde van de huur",
            "U wilt uw nieuwe woning grondig schoon v\u00f3\u00f3r de intrek",
            "U verkoopt of koopt een woning en wilt deze netjes overdragen bij sleuteloverdracht",
            "U huurt of verhuurt een woning rond de verhuisdatum",
        ],
        "onderdelen": ["Keuken", "Badkamer", "Toilet", "Woonkamer", "Slaapkamers", "Hal", "Trap", "Deuren", "Plinten", "Kozijnen", "Vloeren", "Oppervlakken", "Binnenzijde lege kasten, indien afgesproken"],
        "pakketten": [
            ("basis", "Basis", "De woning netjes schoon achterlaten.",
             ["Stofzuigen", "Dweilen", "Vrije oppervlakken", "Keukenwerkblad en spoelbak", "Sanitair", "Spiegels", "Vensterbanken"], False),
            ("uitgebreid", "Uitgebreid", "Grondig schoon voor de verhuizing.",
             ["Alles van Basis", "Deuren en klinken", "Plinten", "Keukenfronten", "Tegelwanden badkamer", "Radiatoren buitenzijde", "Kozijnen binnenzijde", "Binnenzijde lege keukenkasten", "Binnenzijde overige lege vaste kasten", "Uitgebreidere kalk- en vetreiniging"], False),
            ("opleverklaar", "Opleverklaar", "Klaar voor de overdracht.",
             ["Alles van Uitgebreid", "Ramen binnenzijde", "Uitgebreide detailreiniging", "Volledige eindcontrole", "Bereikbare plekken achter/onder apparatuur waar praktisch mogelijk", "1x Oven binnenzijde", "1x Koelkast binnenzijde", "1x Vriezer binnenzijde", "1x Magnetron binnenzijde", "1x Afzuigkap intensief", "Extra kalkreiniging (1 badkamer)"], False),
        ],
        "extra_opties": [],
        "prijs_factoren": ["Grootte van de woning", "Aantal ruimtes", "Mate van vervuiling", "Gekozen werkzaamheden", "Extra opties", "Bereikbaarheid van de woning"],
        "note": None,
        "faqs": [
            ("Maakt u ook de oude \u00e9n de nieuwe woning schoon?", "Ja, we verzorgen verhuisschoonmaak voor zowel de woning die u verlaat als de woning waar u naartoe verhuist \u2014 dit spreken we vooraf met u af."),
            ("Maakt u ook de binnenzijde van kasten schoon?", "Dit kan, mits dit vooraf is afgesproken. Standaard richten we ons op de hoofdruimtes en oppervlakken."),
            ("Kan de schoonmaak snel na aanvraag plaatsvinden?", "We plannen de verhuisschoonmaak zo veel mogelijk rond uw verhuisdatum. Neem tijdig contact op zodat we hier rekening mee kunnen houden."),
            ("Wat gebeurt er als de woning bij aankomst nog niet leeg is?", "Voor een grondige verhuisschoonmaak is een lege of grotendeels lege woning nodig. Overleg dit vooraf met ons zodat we de planning goed kunnen afstemmen."),
        ],
    },
    {
        "filename": "eenmalige-grote-schoonmaak.html",
        "slug": "grote-schoonmaak",
        "title": "Eenmalige grote schoonmaak",
        "meta_title": "Eenmalige grote schoonmaak | Brabantschoon",
        "meta_description": "Eenmalige grote schoonmaak door Brabantschoon: een grondige beurt voor uw hele woning, zonder vast contract. Vraag vrijblijvend een offerte aan.",
        "lead": "Een grondige beurt voor uw hele woning, zonder dat daar direct een vaste overeenkomst voor nodig is.",
        "img": "eenmalige-grote-schoonmaak-brabantschoon.webp",
        "alt": "Brabantschoon-medewerkster verzorgt een eenmalige grote schoonmaak in de woonkamer",
        "voor_wie": [
            "Uw woning heeft al langere tijd geen grondige beurt gehad",
            "U wilt \u00e9\u00e9n keer flink laten schoonmaken, zonder vast contract",
            "U bereidt een speciale gelegenheid of bezoek voor",
            "U wilt een frisse start, bijvoorbeeld na een drukke periode",
        ],
        "onderdelen": ["Keuken", "Badkamer", "Toilet", "Woonkamer", "Slaapkamers", "Hal en trap", "Deuren", "Plinten", "Vloeren", "Oppervlakken", "Bereikbare kozijnen"],
        "pakketten": [
            ("basis", "Basis", "Een frisse, professionele schoonmaakbeurt.",
             ["Stofzuigen", "Dweilen", "Bereikbare/vrije oppervlakken afstoffen", "Vensterbanken", "Keukenwerkblad", "Spoelbak", "Buitenzijde bereikbare keukenapparatuur", "Toilet", "Badkamer regulier reinigen", "Spiegels"], False),
            ("uitgebreid", "Uitgebreid", "Een uitgebreide grote schoonmaak met extra aandacht voor details.",
             ["Alles van Basis", "Deuren en deurklinken", "Plinten", "Keukenfronten grondig reinigen/ontvetten", "Tegelwanden badkamer", "Radiatoren buitenzijde", "Kozijnen binnenzijde", "Hoeken en randen", "Extra aandacht voor kalk- en vetresten"], False),
            ("compleet", "Compleet", "Van boven tot onder uitgebreid aangepakt.",
             ["Alles van Uitgebreid", "Ramen binnenzijde", "Binnenzijde lege keukenkasten", "Binnenzijde overige lege vaste kasten", "Bovenkanten van bereikbare kasten/deuren", "Bereikbare plekken achter/onder meubels waar praktisch mogelijk", "Uitgebreide detailronde door de woning", "1x Oven binnenzijde", "1x Koelkast binnenzijde", "1x Vriezer binnenzijde", "1x Magnetron binnenzijde", "1x Afzuigkap intensief", "Extra kalkreiniging (1 badkamer)"], False),
        ],
        "extra_opties": [],
        "prijs_factoren": ["Grootte van de woning", "Aantal ruimtes", "Mate van vervuiling", "Gekozen werkzaamheden", "Extra opties", "Bereikbaarheid van de woning"],
        "note": "De exacte werkzaamheden blijven afhankelijk van de woning, de vervuilingsgraad en de gemaakte afspraken.",
        "faqs": [
            ("Is een eenmalige grote schoonmaak ook zonder vast contract mogelijk?", "Ja, dat is precies waar deze dienst voor bedoeld is \u2014 een grondige beurt zonder dat u een periodieke overeenkomst aangaat."),
            ("Hoe lang duurt een eenmalige grote schoonmaak?", "Dat hangt af van de grootte van uw woning en de gekozen werkzaamheden. We bespreken dit vooraf met u."),
            ("Kan ik zelf aangeven welke ruimtes extra aandacht nodig hebben?", "Ja, u geeft bij de aanvraag aan waar de nadruk op moet liggen, zodat de offerte en de uitvoering hierop worden afgestemd."),
            ("Kan deze schoonmaak later ook periodiek worden?", "Ja, na een eenmalige grote schoonmaak is het mogelijk om over te stappen op periodieke schoonmaak \u2014 neem hiervoor gerust contact met ons op."),
        ],
    },
    {
        "filename": "schoonmaak-na-verbouwing.html",
        "slug": "na-verbouwing",
        "title": "Schoonmaak na verbouwing",
        "meta_title": "Schoonmaak na verbouwing | Brabantschoon",
        "meta_description": "Schoonmaak na verbouwing door Brabantschoon: bouwstof en normaal schoonmaakvuil verwijderd na renovatie of verbouwing. Vraag vrijblijvend een offerte aan.",
        "lead": "Verwijderen van bouwstof en normaal schoonmaakvuil na een renovatie of verbouwing.",
        "img": "schoonmaak-na-verbouwing-brabantschoon.webp",
        "alt": "Brabantschoon-medewerkster verwijdert bouwstof na een verbouwing",
        "voor_wie": ["Na een renovatie of verbouwing", "Na het plaatsen van een nieuwe keuken", "Na het plaatsen van een nieuwe badkamer", "Na stucwerk- of schilderwerkzaamheden", "Na een complete woningverbouwing"],
        "onderdelen": ["Bouwstof verwijderen", "Oppervlakken stofvrij maken", "Deuren", "Kozijnen", "Plinten", "Keuken", "Sanitair", "Vloeren", "Stofzuigen", "Dweilen", "Woning gebruiksklaar maken"],
        "pakketten": [
            ("basis", "Basis", "De belangrijkste ruimtes weer bouwstofvrij.",
             ["Stofzuigen vloeren", "Dweilen vloeren", "Bouwstof verwijderen van bereikbare vrije oppervlakken", "Vensterbanken", "Plinten"], False),
            ("uitgebreid", "Uitgebreid", "Van bouwstofvrij naar grondig schoon.",
             ["Alles van Basis", "Deuren en klinken", "Kozijnen binnenzijde", "Radiatoren buitenzijde", "Keuken buitenzijde", "Sanitair", "Tegelwanden", "Bereikbare schakelaars/contactpunten buitenzijde", "Uitgebreid detailwerk rond randen en hoeken"], False),
            ("instapklaar", "Instapklaar", "Grondig gereinigd en klaar om weer te gebruiken.",
             ["Alles van Uitgebreid", "Ramen binnenzijde", "Binnenzijde lege keukenkasten", "Binnenzijde overige lege vaste kasten", "Bovenkanten van bereikbare deuren/kasten", "Uitgebreide detailreiniging", "Volledige eindronde"], False),
        ],
        "extra_opties": [],
        "prijs_factoren": ["Grootte van de woning", "Aantal ruimtes", "Mate van bouwstof en vervuiling", "Gekozen werkzaamheden", "Extra opties", "Bereikbaarheid van de woning"],
        "note": "Hardnekkige bouwresten zoals verf-, kit-, lijm- of cementresten worden vooraf beoordeeld en zijn niet standaard in de pakketten inbegrepen \u2014 verwijdering hiervan gebeurt alleen wanneer dit vooraf expliciet is afgesproken en technisch mogelijk is.",
        "faqs": [
            ("Verwijdert u ook bouwafval of grofvuil?", "Nee, wij verzorgen het verwijderen van bouwstof en normaal schoonmaakvuil. Voor grofvuil, bouwafval of gevaarlijke stoffen verwijst u naar een gespecialiseerd bedrijf."),
            ("Verwijdert u verf-, kit- of cementresten?", "Specialistische verwijdering van verf, kit, cement of lijmresten kan alleen als dit vooraf is afgesproken en technisch mogelijk is."),
            ("Wanneer kan de schoonmaak na de verbouwing plaatsvinden?", "Zodra het bouwstof grotendeels is neergedaald en de ruimte toegankelijk is. We stemmen de planning graag met u af."),
            ("Is deze dienst ook geschikt na een kleinere verbouwing?", "Ja, we stemmen de aanpak af op de omvang van de verbouwing, van een enkele ruimte tot de complete woning."),
        ],
    },
    {
        "filename": "periodieke-schoonmaak-particulier.html",
        "slug": "periodiek",
        "title": "Periodieke schoonmaak",
        "meta_title": "Periodieke schoonmaak voor particulieren | Brabantschoon",
        "meta_description": "Periodieke schoonmaak van Brabantschoon voor particulieren: terugkerende professionele schoonmaak op een ritme dat u zelf bepaalt. Vraag vrijblijvend een offerte aan.",
        "lead": "Terugkerende professionele schoonmaak van uw woning, op een ritme dat u zelf bepaalt.",
        "img": "periodieke-schoonmaak-brabantschoon.webp",
        "alt": "Brabantschoon-medewerkster verzorgt periodieke schoonmaak van het keukenblok",
        "voor_wie": ["Huishoudens die terugkerend ondersteuning willen bij het schoonhouden van hun woning", "Drukke gezinnen die structureel tijd willen besparen", "Wie liever een vast aanspreekpunt heeft dan wisselende hulp"],
        "onderdelen": ["Stofzuigen", "Dweilen", "Bereikbare oppervlakken afstoffen", "Keukenwerkblad", "Spoelbak", "Keukenoppervlakken", "Sanitair", "Spiegels", "Vensterbanken", "Afvalbakken legen, indien gewenst"],
        "pakketten": [],
        "extra_opties": [],
        "prijs_factoren": ["Grootte van de woning", "Aantal ruimtes", "Gekozen werkzaamheden", "Extra opties", "Bereikbaarheid van de woning", "Gewenste frequentie"],
        "note": "Sommige extra werkzaamheden kunnen periodiek worden ingepland (bijvoorbeeld eens per maand) in plaats van bij iedere schoonmaakbeurt \u2014 dit stemmen we samen met u af.",
        "faqs": [
            ("Hoe vaak komt u schoonmaken?", "De frequentie bepaalt u zelf, in overleg met ons \u2014 bijvoorbeeld wekelijks, om de week of iedere vier weken."),
            ("Kom ik steeds dezelfde medewerker tegen?", "We streven naar een vast aanspreekpunt en een vast team dat uw woning kent."),
            ("Kan ik de afgesproken taken later aanpassen?", "Ja, in overleg passen we de werkzaamheden of frequentie aan als uw situatie verandert."),
            ("Is een proefperiode mogelijk?", "Neem contact met ons op om de mogelijkheden te bespreken die bij uw situatie passen."),
        ],
    },
    {
        "filename": "opleveringsschoonmaak-particulier.html",
        "slug": "oplevering",
        "title": "Schoonmaak bij verkoop, verhuur of oplevering",
        "meta_title": "Schoonmaak bij verkoop, verhuur of oplevering | Brabantschoon",
        "meta_description": "Schoonmaak bij verkoop, verhuur of oplevering door Brabantschoon: uw woning schoon voor bezichtigingen of de sleuteloverdracht. Vraag vrijblijvend een offerte aan.",
        "lead": "Uw woning schoon voor bezichtigingen, verhuur of de sleuteloverdracht.",
        "img": "opleveringsschoonmaak-brabantschoon.webp",
        "alt": "Brabantschoon-medewerkster inspecteert een woning bij oplevering",
        "voor_wie": ["Woningverkoop en bezichtigingen", "Einde huurperiode", "Een nieuwe huurder die de woning betrekt", "Verhuurders die hun woning gereed willen maken", "Sleuteloverdracht bij oplevering"],
        "onderdelen": ["Keuken", "Sanitair", "Vloeren", "Deuren", "Plinten", "Kozijnen", "Oppervlakken", "Lege kasten", "Laatste controle"],
        "pakketten": [
            ("presentatieklaar", "Presentatieklaar", "Voor woningverkoop en bezichtigingen.",
             ["Nette algemene indruk", "Vloeren", "Oppervlakken", "Keuken", "Sanitair", "Spiegels", "Zichtbare details"], False),
            ("overdrachtsklaar", "Overdrachtsklaar", "Gericht op een nette overdracht aan koper, huurder of verhuurder.",
             ["Keuken", "Sanitair", "Vloeren", "Deuren", "Plinten", "Kozijnen", "Lege kasten, indien afgesproken", "Algemene eindcontrole"], False),
            ("volledige-oplevering", "Volledige oplevering", "De meest uitgebreide schoonmaak voor een lege woning v\u00f3\u00f3r overdracht.",
             ["Alle relevante ruimtes", "Keuken", "Sanitair", "Vloeren", "Kasten", "Ramen binnenzijde", "Detailwerk", "Laatste schoonmaakcontrole"], False),
        ],
        "extra_opties": ["Oven", "Koelkast", "Vriezer", "Binnenzijde kasten", "Ramen binnenzijde", "Balkon", "Berging", "Extra sanitair", "Extra controle v\u00f3\u00f3r sleuteloverdracht"],
        "prijs_factoren": ["Grootte van de woning", "Aantal ruimtes", "Mate van vervuiling", "Gekozen werkzaamheden", "Extra opties", "Bereikbaarheid van de woning"],
        "note": None,
        "faqs": [
            ("Is deze dienst geschikt voor makelaars of alleen particulieren?", "Deze dienst is bedoeld voor particuliere situaties zoals verkoop, verhuur of oplevering van uw eigen woning."),
            ("Voert u ook een laatste controle uit v\u00f3\u00f3r de sleuteloverdracht?", "Ja, desgewenst voeren we een laatste controle uit zodat de woning netjes wordt overgedragen."),
            ("Kan de schoonmaak vlak v\u00f3\u00f3r de bezichtiging of overdracht plaatsvinden?", "We plannen de schoonmaak graag rond uw gewenste datum \u2014 neem tijdig contact op voor de beste planning."),
            ("Maakt u ook de binnenzijde van kasten schoon?", "Dit kan als extra optie worden afgesproken."),
        ],
    },
    {
        "filename": "glasbewassing-particulier.html",
        "slug": "glasbewassing-particulier",
        "title": "Glasbewassing voor particulieren",
        "meta_title": "Glasbewassing voor particulieren | Brabantschoon",
        "meta_description": "Professionele glasbewassing voor particulieren door Brabantschoon: streeploos schone ramen, eenmalig of periodiek. Vraag vrijblijvend een offerte op maat aan.",
        "lead": "Streeploos schone ramen voor uw woning \u2014 eenmalig of op een vast ritme.",
        "img": "glasbewassing.jpg",
        "alt": "Streeploos schone ramen na professionele glasbewassing door Brabantschoon",
        "voor_wie": ["Woningeigenaren die hun ramen liever laten reinigen dan zelf doen", "Moeilijk bereikbare ramen, zoals een bovenverdieping", "Wie op een vast ritme schone ramen wil, zonder er zelf aan te hoeven denken", "Een eenmalige grondige beurt, bijvoorbeeld voor een speciale gelegenheid"],
        "onderdelen": ["Buitenzijde ramen", "Binnenzijde ramen, indien gewenst", "Kozijnen, indien gewenst", "Vensterbanken, indien gewenst"],
        "pakketten": [],
        "extra_opties": ["Kozijnen meenemen", "Vensterbanken meenemen"],
        "prijs_factoren": ["Hoeveelheid glas", "Formaat van de ramen", "Verdieping", "Bereikbaarheid", "Eenmalig of periodiek"],
        "note": "Er zijn nog geen vaste tarieven voor particuliere glasbewassing \u2014 u ontvangt altijd een vrijblijvende prijsindicatie op basis van uw situatie.",
        "faqs": [
            ("Wat is het verschil met 'ramen binnenzijde' in jullie schoonmaakpakketten?", "Bij 'ramen binnenzijde' in een schoonmaakpakket gaat het om een reguliere reiniging als onderdeel van de totale schoonmaakbeurt. Professionele glasbewassing is gericht op streeploos glas, ook aan de buitenzijde, en is een aparte dienst."),
            ("Kan glasbewassing ook periodiek, bijvoorbeeld iedere paar maanden?", "Ja, u kunt kiezen voor een eenmalige beurt of een vast terugkerend ritme \u2014 dat bespreken we graag met u."),
            ("Wat als mijn ramen moeilijk bereikbaar zijn?", "Geef dit aan bij uw aanvraag. Bij moeilijk bereikbare of bijzondere situaties beoordelen we dit eerst persoonlijk, voordat we een passende offerte opstellen."),
            ("Wat kost glasbewassing?", "Dat hangt af van onder meer de hoeveelheid glas, het formaat, de verdieping en de bereikbaarheid. Er zijn nog geen vaste tarieven \u2014 u ontvangt een vrijblijvende prijsindicatie op basis van uw situatie."),
        ],
    },
]

# ---------------------------------------------------------------
# PRIJSCALCULATOR — particuliere eenmalige diensten + periodieke schoonmaak
# ---------------------------------------------------------------
# Alle bedragen zijn consumentenprijzen INCLUSIEF 21% btw. Dit is de ENIGE
# plek waar bedragen hardcoded staan: de prijstabellen op de detailpagina's
# \u00e9n de live rekenlogica in de offertewizard (via een JSON-blob, zie
# contact_form()) worden hier allebei uit afgeleid. Nooit prijzen los
# dupliceren elders.
STAFFEL_OPTIES = ["tm60", "61-90", "91-120", "121-150", "boven150"]
STAFFEL_LABELS = {
    "tm60": "t/m 60 m\u00b2", "61-90": "61\u201390 m\u00b2", "91-120": "91\u2013120 m\u00b2",
    "121-150": "121\u2013150 m\u00b2", "boven150": "Boven 150 m\u00b2",
}

# dienst-slug -> of dit "vanaf"-prijzen zijn, en {staffel: {pakket-id: bedrag}}
PARTICULIER_PRIJZEN = {
    "grote-schoonmaak": {
        "vanaf": False,
        "prijzen": {
            "tm60":    {"basis": 200, "uitgebreid": 275, "compleet": 375},
            "61-90":   {"basis": 250, "uitgebreid": 350, "compleet": 475},
            "91-120":  {"basis": 300, "uitgebreid": 425, "compleet": 575},
            "121-150": {"basis": 350, "uitgebreid": 500, "compleet": 700},
        },
    },
    "verhuisschoonmaak": {
        "vanaf": False,
        "prijzen": {
            "tm60":    {"basis": 225, "uitgebreid": 300, "opleverklaar": 400},
            "61-90":   {"basis": 275, "uitgebreid": 375, "opleverklaar": 500},
            "91-120":  {"basis": 325, "uitgebreid": 450, "opleverklaar": 625},
            "121-150": {"basis": 400, "uitgebreid": 550, "opleverklaar": 750},
        },
    },
    "na-verbouwing": {
        "vanaf": False,
        "prijzen": {
            "tm60":    {"basis": 250, "uitgebreid": 325, "instapklaar": 450},
            "61-90":   {"basis": 300, "uitgebreid": 400, "instapklaar": 550},
            "91-120":  {"basis": 375, "uitgebreid": 500, "instapklaar": 675},
            "121-150": {"basis": 450, "uitgebreid": 600, "instapklaar": 825},
        },
    },
}

# Periodieke schoonmaak: prijs per beurt, staffel x frequentie (geen pakketten).
# Deze opdracht verandert deze staffels bewust NIET.
PERIODIEK_PRIJZEN = {
    "tm60":    {"wekelijks": 90,  "2weken": 100, "4weken": 115},
    "61-90":   {"wekelijks": 110, "2weken": 125, "4weken": 145},
    "91-120":  {"wekelijks": 135, "2weken": 155, "4weken": 180},
    "121-150": {"wekelijks": 160, "2weken": 185, "4weken": 215},
}

# Centrale configuratie voor telbare, geprijsde extra opties \u2014 1 bron voor
# de aantalselectors in de wizard, de prijsberekening en de "inbegrepen"
# hoeveelheden per pakket. (id, label, prijs incl. btw, eenheid, max aantal)
EXTRA_OPTIES_CONFIG = [
    ("oven", "Oven binnenzijde", 35, "stuk", 5),
    ("koelkast", "Koelkast binnenzijde", 25, "stuk", 5),
    ("vriezer", "Vriezer binnenzijde", 20, "stuk", 5),
    ("magnetron", "Magnetron binnenzijde", 15, "stuk", 5),
    ("afzuigkap", "Afzuigkap intensief", 25, "stuk", 5),
    ("kalkbadkamer", "Extra kalkreiniging badkamer", 30, "badkamer", 5),
    ("balkon", "Balkon", 30, "stuk", 5),
    ("berging", "Berging", 25, "stuk", 5),
    ("ruimte_extra", "Specifieke ruimte extra grondig", 35, "ruimte", 5),
]
EXTRA_OPTIES_MAP = {eid: (label, prijs, eenheid, maxi) for eid, label, prijs, eenheid, maxi in EXTRA_OPTIES_CONFIG}

# Welke extra opties standaard bij welk pakket zijn inbegrepen (aantal), per
# dienst-slug. Balkon/berging/specifieke ruimte staan hier bewust nooit in:
# die blijven altijd losse betaalde opties, ook bij Compleet/Opleverklaar
# (de omvang hiervan kan te sterk verschillen om standaard toe te voegen).
PARTICULIER_INBEGREPEN = {
    "grote-schoonmaak": {
        "compleet": {"oven": 1, "koelkast": 1, "vriezer": 1, "magnetron": 1, "afzuigkap": 1, "kalkbadkamer": 1},
    },
    "verhuisschoonmaak": {
        "opleverklaar": {"oven": 1, "koelkast": 1, "vriezer": 1, "magnetron": 1, "afzuigkap": 1, "kalkbadkamer": 1},
    },
    "na-verbouwing": {
        # Instapklaar bevat bewust GEEN standaard apparatuur \u2014 bij schoonmaak
        # na verbouwing ligt de nadruk op bouwstof en de woning zelf.
    },
    "periodiek": {
        # Periodieke schoonmaak heeft geen pakketten en dus ook geen
        # standaard-inbegrepen aantallen \u2014 elke gekozen extra bij een
        # periodieke beurt wordt volledig los in rekening gebracht.
    },
}

VERVUILING_TOESLAG_PERCENTAGE = 20  # bij "Sterk vervuild", over de pakketprijs (niet over extra's)

# Pakketten per particuliere dienst-slug, hergebruikt van PARTICULIER_PAGES
# (1 bron voor detailpagina's \u00e9n offertewizard, zodat ze nooit uit de pas
# lopen). Elk pakket: (id, naam, korte beschrijving voor in de wizard).
PARTICULIER_WIZARD_PAKKETTEN = {
    page["slug"]: [(pid, naam, desc) for pid, naam, desc, items, meest_gekozen in page["pakketten"]]
    for page in PARTICULIER_PAGES
}
PARTICULIER_WIZARD_MEEST_GEKOZEN = {
    page["slug"]: next((pid for pid, naam, desc, items, mg in page["pakketten"] if mg), None)
    for page in PARTICULIER_PAGES
}
# Extra werkzaamheden per particuliere dienst-slug, eveneens hergebruikt van
# PARTICULIER_PAGES (dezelfde lijst als op de detailpagina's).
PARTICULIER_WIZARD_EXTRAS = {page["slug"]: page["extra_opties"] for page in PARTICULIER_PAGES}

PARTICULIER_FAQS = [
    ("Werkt u ook voor particulieren, niet alleen voor bedrijven?", "Ja, naast bedrijven, VvE's en organisaties zijn we ook inzetbaar voor particuliere woningen \u2014 van een eenmalige grote schoonmaak tot periodiek onderhoud."),
    ("Wat kost particuliere schoonmaak?", "Voor verschillende diensten tonen we vooraf een duidelijke prijsindicatie, met pakketten en staffelprijzen per woonoppervlakte. De definitieve prijs is afhankelijk van uw situatie en gekozen opties \u2014 vraag vrijblijvend een offerte aan."),
    ("Werkt u ook buiten Helmond voor particulieren?", "Particuliere schoonmaak bieden we vanuit Helmond en in omliggende plaatsen. Voor grotere opdrachten zijn ook werkzaamheden elders in Brabant bespreekbaar."),
    ("Verwijdert u ook bouwafval of gevaarlijke stoffen na een verbouwing?", "Nee, wij verzorgen het verwijderen van bouwstof en normaal schoonmaakvuil na een verbouwing. Voor grofvuil, bouwafval of gevaarlijke stoffen verwijst u naar een gespecialiseerd bedrijf."),
]

def build_particulieren_page():
    base = ""
    cards_html = "\n      ".join(
        f'''<a href="{base}{href}" class="service-card">
      <div class="thumb"><img src="{base}images/diensten/{img}" alt="{alt}" width="1200" height="800" loading="lazy" decoding="async" style="width:100%; height:100%; object-fit:cover;"></div>
      <div class="body"><h3>{t}</h3><p>{d}</p><span class="sc-link">Meer informatie {icon('arrow')}</span></div>
    </a>'''
        for t, d, img, alt, href in PARTICULIER_SUBDIENSTEN
    )
    faq_html = faq_block(PARTICULIER_FAQS)
    related = [s for s in SERVICES if s["slug"] in ("glasbewassing", "opleveringsschoonmaak")]
    related_html = "\n    ".join(f"""<a href="diensten/{r['slug']}.html" class="service-card">
      <div class="thumb {r['tint']}">{service_visual_from_root(r)}</div>
      <div class="body"><h3>{r['name']}</h3><p>{r['short']}</p></div>
    </a>""" for r in related)
    hero = page_hero("Particuliere schoonmaak", "Schoonmaak voor particulieren.",
                      "Professionele schoonmaak voor uw woning \u2014 dezelfde zorgvuldige aanpak die bedrijven en VvE's van Brabantschoon gewend zijn.",
                      base, "Schoonmaak voor particulieren")
    body = f"""
  {hero}
  <section class="section-tight">
    <div class="wrap-narrow">
      <p class="prose reveal">Naast bedrijven, VvE's en organisaties is Brabantschoon ook inzetbaar voor particuliere woningen. Van een eenmalige grote schoonmaak tot periodieke ondersteuning: dezelfde professionele aanpak, heldere afspraken en een vast aanspreekpunt dat u van onze zakelijke dienstverlening kent.</p>
    </div>
  </section>
  <section class="section-tight" style="padding-top:0;">
    <div class="wrap">
      <div class="sec-head reveal"><span class="eyebrow">Onze diensten</span><h2>Waarvoor u ons kunt inschakelen.</h2></div>
      <div class="grid-3 reveal">{cards_html}</div>
    </div>
  </section>
  <section class="section-tight" style="background:var(--bg-soft);">
    <div class="wrap">
      <div class="two-col reveal">
        <div>
          <p class="prose"><strong style="color:var(--ink);">Geschikt voor:</strong> particulieren met een verhuizing, een grote schoonmaakklus, een woning na verbouwing, of behoefte aan periodieke ondersteuning bij het schoonhouden van hun woning.</p>
          <div class="hero-actions" style="margin-top:24px;">
            <a href="{base}offerte.html?type=particulier#offerteWizard" class="btn btn-primary">Vraag vrijblijvend een offerte aan</a>
            <a href="tel:{PHONE_TEL}" class="btn btn-outline">Bel direct</a>
          </div>
        </div>
        <div>
          <div class="faq">{faq_html}</div>
        </div>
      </div>
    </div>
  </section>
  <section>
    <div class="wrap">
      <div class="sec-head reveal"><span class="eyebrow">Ook interessant</span><h2>Vaak in combinatie gevraagd</h2></div>
      <div class="grid-3 reveal">{related_html}</div>
    </div>
  </section>
  <section style="background:var(--bg-soft);"><div class="wrap">{cta_band("Interesse in particuliere schoonmaak?", "Vraag vrijblijvend een offerte aan of neem direct contact op.", base, type_param="particulier")}</div></section>
  <section class="section-tight">
    <div class="wrap-narrow" style="text-align:center;">
      <p class="prose">Particuliere schoonmaak bieden we vanuit {CITY} en in omliggende plaatsen. Voor grotere opdrachten zijn ook werkzaamheden elders in <a href="{base}werkgebied.html" style="color:var(--link); font-weight:600;">Brabant</a> bespreekbaar \u2014 op zoek naar schoonmaak voor uw bedrijf? Bekijk onze <a href="{base}zakelijke-schoonmaak.html" style="color:var(--link); font-weight:600;">zakelijke schoonmaak</a>.</p>
    </div>
  </section>
"""
    particulier_svc_schema = {"name": "Schoonmaak voor particulieren", "short": "Professionele schoonmaak voor particuliere woningen: verhuisschoonmaak, grote schoonmaak, schoonmaak na verbouwing, periodieke schoonmaak en schoonmaak bij verkoop of verhuur."}
    write("schoonmaak-particulieren.html", page_shell(
        "Schoonmaak voor particulieren | Brabantschoon",
        "Particuliere schoonmaak door Brabantschoon: verhuisschoonmaak, grote schoonmaakbeurten en schoonmaak na verbouwing. Vraag vrijblijvend een offerte aan.",
        "schoonmaak-particulieren.html", base, "schoonmaak-particulieren.html",
        body,
        service_schema(particulier_svc_schema) + "\n" + breadcrumb_schema("Schoonmaak voor particulieren", "schoonmaak-particulieren.html") + "\n" + faq_schema(PARTICULIER_FAQS)
    ))

# =================================================================
# PARTICULIERE DIENST-DETAILPAGINA'S (volwaardige pagina per dienst)
# =================================================================
def prijstabel_eenmalig_html(slug, pakket_ids, pakket_namen):
    """Compacte, horizontaal scrollbare prijstabel voor een eenmalige
    particuliere dienst (grote-schoonmaak, verhuisschoonmaak, na-verbouwing)."""
    data = PARTICULIER_PRIJZEN[slug]
    header_cells = "".join(f"<th>{naam}</th>" for naam in pakket_namen)
    rows = []
    for staffel in STAFFEL_OPTIES:
        if staffel == "boven150":
            rows.append(f'<tr><td>{STAFFEL_LABELS[staffel]}</td><td colspan="{len(pakket_ids)}">Prijs op maat</td></tr>')
            continue
        prijzen = data["prijzen"][staffel]
        vanaf = "vanaf " if data["vanaf"] else ""
        cells = "".join(f"<td>{vanaf}\u20ac{prijzen[pid]}</td>" for pid in pakket_ids)
        rows.append(f"<tr><td>{STAFFEL_LABELS[staffel]}</td>{cells}</tr>")
    return f'''<div class="prijstabel-wrap reveal">
        <table class="prijstabel">
          <thead><tr><th>Woonoppervlakte</th>{header_cells}</tr></thead>
          <tbody>{"".join(rows)}</tbody>
        </table>
      </div>
      <p class="prose" style="font-size:12.5px; margin-top:10px;">Prijsindicaties incl. 21% btw, bij normale vervuiling. Bij sterk vervuilde woningen geldt een toeslag van {VERVUILING_TOESLAG_PERCENTAGE}% op de pakketprijs; bij zeer sterke vervuiling, bijzondere situaties of een woning boven 150 m\u00b2 stellen we een prijs op maat op. Vraag een offerte aan voor een prijsindicatie op basis van uw eigen situatie.</p>'''

def prijstabel_periodiek_html():
    # Desktop: overzichtelijke tabel (ongewijzigd, staat toch al goed op een
    # breed scherm). Mobiel: 3 kaarten (\u00e9\u00e9n per frequentie) i.p.v. de tabel
    # \u2014 zo hoeft niemand op een klein scherm horizontaal te scrollen en
    # valt de woonoppervlakte-kolom nooit buiten beeld. Beide gebruiken
    # dezelfde bestaande PERIODIEK_PRIJZEN-data; er wordt niets dubbel
    # bijgehouden en er verandert geen enkel bedrag.
    header_cells = "".join(f"<th>{lbl}</th>" for lbl in ["Wekelijks", "Iedere 2 weken", "Iedere 4 weken"])
    rows = []
    for staffel in STAFFEL_OPTIES:
        if staffel == "boven150":
            rows.append(f'<tr><td>{STAFFEL_LABELS[staffel]}</td><td colspan="3">Prijs op maat</td></tr>')
            continue
        prijzen = PERIODIEK_PRIJZEN[staffel]
        cells = "".join(f"<td>\u20ac{prijzen[k]} <span class=\"prijstabel-eenheid\">per beurt</span></td>" for k in ("wekelijks", "2weken", "4weken"))
        rows.append(f"<tr><td>{STAFFEL_LABELS[staffel]}</td>{cells}</tr>")
    desktop_table = f'''<div class="prijstabel-wrap prijstabel-desktop-only reveal">
        <table class="prijstabel">
          <thead><tr><th>Woonoppervlakte</th>{header_cells}</tr></thead>
          <tbody>{"".join(rows)}</tbody>
        </table>
      </div>'''

    freq_labels = {"wekelijks": "Wekelijks", "2weken": "Iedere 2 weken", "4weken": "Iedere 4 weken"}
    freq_sub = {"wekelijks": "Voordeligste prijs per beurt", "2weken": "", "4weken": ""}
    cards = []
    for k in ("wekelijks", "2weken", "4weken"):
        rijen = "".join(
            f'<div class="periodiek-kaart-rij"><span>{STAFFEL_LABELS[s]}</span><span>\u20ac{PERIODIEK_PRIJZEN[s][k]} <span class="prijstabel-eenheid">per beurt</span></span></div>'
            for s in STAFFEL_OPTIES if s != "boven150"
        )
        rijen += '<div class="periodiek-kaart-rij"><span>Boven 150 m\u00b2</span><span>Prijs op maat</span></div>'
        sub = f'<p class="periodiek-kaart-sub">{freq_sub[k]}</p>' if freq_sub[k] else ""
        cards.append(f'''<div class="periodiek-kaart reveal">
        <h3 class="periodiek-kaart-titel">{freq_labels[k]}</h3>
        {sub}
        {rijen}
      </div>''')
    mobile_cards = f'''<div class="periodiek-kaarten-wrap prijstabel-mobile-only">
        {"".join(cards)}
      </div>'''

    return f'''{desktop_table}
      {mobile_cards}
      <p class="prose" style="font-size:12.5px; margin-top:10px;">Prijs per schoonmaakbeurt, incl. 21% btw. Hoe vaker wij komen, hoe voordeliger de prijs per schoonmaakbeurt. Bij een woning boven 150 m\u00b2 stellen we een prijs op maat op. Vraag een offerte aan voor een prijsindicatie op basis van uw eigen situatie.</p>'''

def build_particulier_detail_pages():
    base = ""
    for page in PARTICULIER_PAGES:
        voor_wie_html = "\n        ".join(f"<li>{v}</li>" for v in page["voor_wie"])
        onderdelen_visible = page["onderdelen"][:6]
        onderdelen_rest = page["onderdelen"][6:]
        onderdelen_html = "\n        ".join(f"<li>{o}</li>" for o in onderdelen_visible)
        onderdelen_extra_html = ""
        if onderdelen_rest:
            rest_items = "\n          ".join(f"<li>{o}</li>" for o in onderdelen_rest)
            onderdelen_extra_html = f'''<details class="onderdelen-more">
        <summary>Bekijk alle werkzaamheden <span class="chev">{icon("chevron")}</span></summary>
        <ul class="prose" style="margin-top:10px;">
          {rest_items}
        </ul>
      </details>'''
        prijs_zin = ", ".join(page["prijs_factoren"][:-1]) + " en " + page["prijs_factoren"][-1]

        if page["slug"] == "periodiek":
            # Geen pakketten: frequentiekeuze + prijstabel per beurt.
            keuze_sectie = f'''<div class="sec-head reveal"><h2>Hoe vaak wilt u schoonmaak?</h2><p class="prose" style="margin-top:8px;">U kiest zelf het ritme: wekelijks, iedere 2 weken of iedere 4 weken. Hoe vaker, hoe voordeliger de prijs per beurt.</p></div>
      {prijstabel_periodiek_html()}
      <div class="hero-actions" style="margin-top:22px;">
        <a href="{base}offerte.html?type=particulier&amp;dienst={page['slug']}#offerteWizard" class="btn btn-primary">Bereken uw prijsindicatie</a>
      </div>'''
        elif page["slug"] == "glasbewassing-particulier":
            # Geen pakketten, nog geen vaste tarieven: leg het aanbod uit en
            # verwijs direct door naar de eigen (korte) offerteflow.
            keuze_sectie = f'''<div class="sec-head reveal"><h2>Waar kunt u uit kiezen?</h2><p class="prose" style="margin-top:8px;">Glasbewassing is maatwerk \u2014 er zijn nog geen vaste tarieven, u ontvangt altijd een vrijblijvende prijsindicatie op basis van uw situatie.</p></div>
      <div class="pakket-grid">
        <div class="pakket-card reveal"><h3 class="pakket-title">Alleen buitenzijde</h3><p class="pakket-description">De buitenkant van uw ramen streeploos schoon.</p><p class="pakket-price">Prijs op maat</p></div>
        <div class="pakket-card reveal"><h3 class="pakket-title">Binnen- en buitenzijde</h3><p class="pakket-description">Beide zijden in \u00e9\u00e9n afspraak.</p><p class="pakket-price">Prijs op maat</p></div>
        <div class="pakket-card reveal"><h3 class="pakket-title">Eenmalig of periodiek</h3><p class="pakket-description">Een enkele beurt, of een vast terugkerend ritme dat u zelf bepaalt.</p><p class="pakket-price">Prijs op maat</p></div>
      </div>
      <p class="prose reveal" style="margin-top:20px;">De uiteindelijke prijs hangt onder meer af van de hoeveelheid glas, het formaat, de verdieping en de bereikbaarheid van de ramen. Bij moeilijk bereikbare of bijzondere situaties beoordelen we dit eerst persoonlijk.</p>
      <div class="hero-actions" style="margin-top:22px;">
        <a href="{base}offerte.html?type=particulier&amp;dienst={page['slug']}#offerteWizard" class="btn btn-primary">Offerte aanvragen</a>
      </div>'''
        elif page["slug"] in PARTICULIER_PRIJZEN:
            prijsdata = PARTICULIER_PRIJZEN[page["slug"]]
            vanaf_prefix = "vanaf " if prijsdata["vanaf"] else ""
            pakketten_html = "\n      ".join(f'''<div class="pakket-card reveal">
        <h3 class="pakket-title">{naam}</h3>
        <p class="pakket-description">{desc}</p>
        <p class="pakket-price">Vanaf \u20ac{prijsdata["prijzen"]["tm60"][pid]} <span class="pakket-price-unit">incl. btw</span></p>
        <div class="pakket-details" id="pakket-details-{page['slug']}-{pid}" hidden>
          <p class="pakket-details-label">Prijs op basis van woonoppervlakte</p>
          <table class="pakket-prijstabel">
            <tbody>
              {"".join(f'<tr><td>{STAFFEL_LABELS[st]}</td><td>{("vanaf " if prijsdata["vanaf"] else "")}\u20ac{prijsdata["prijzen"][st][pid]}</td></tr>' for st in ("tm60","61-90","91-120","121-150"))}
              <tr><td>{STAFFEL_LABELS["boven150"]}</td><td>Prijs op maat</td></tr>
            </tbody>
          </table>
          <p class="pakket-details-label" style="margin-top:16px;">Wat is inbegrepen?</p>
          <ul class="pakket-items">{''.join(f'<li>{item}</li>' for item in items)}</ul>
        </div>
        <div class="pakket-actions">
          <button type="button" class="pakket-toggle" aria-expanded="false" aria-controls="pakket-details-{page['slug']}-{pid}">
            <span class="pakket-toggle-label">Bekijk wat inbegrepen is</span><span class="pakket-toggle-arrow" aria-hidden="true">\u2193</span>
          </button>
          <a href="{base}offerte.html?type=particulier&amp;dienst={page['slug']}&amp;pakket={pid}#offerteWizard" class="btn btn-primary pakket-cta">Offerte voor {naam} aanvragen</a>
        </div>
      </div>''' for pid, naam, desc, items, meest_gekozen in page["pakketten"])
            keuze_sectie = f'''<div class="sec-head reveal"><h2>Kies de schoonmaak die bij uw woning past</h2><p class="prose" style="margin-top:8px;">Vergelijk de pakketten en zie direct wat inbegrepen is \u2014 prijzen zijn incl. btw, de definitieve prijs ontvangt u na beoordeling van uw aanvraag.</p></div>
      <div class="pakket-grid">
        {pakketten_html}
      </div>'''
        else:
            # "Bij verkoop, verhuur of oplevering" valt buiten deze prijsopdracht
            # (niet genoemd in de brief) \u2014 pakketten blijven bestaan als
            # keuzehulp, zonder prijstabel of live calculator.
            pakketten_html = "\n      ".join(f'''<div class="pakket-card reveal">
        <h3 class="pakket-title">{naam}</h3>
        <p class="pakket-description">{desc}</p>
        <div class="pakket-details" id="pakket-details-{page['slug']}-{pid}" hidden>
          <p class="pakket-details-label">Wat is inbegrepen?</p>
          <ul class="pakket-items">{''.join(f'<li>{item}</li>' for item in items)}</ul>
        </div>
        <div class="pakket-actions">
          <button type="button" class="pakket-toggle" aria-expanded="false" aria-controls="pakket-details-{page['slug']}-{pid}">
            <span class="pakket-toggle-label">Bekijk wat inbegrepen is</span><span class="pakket-toggle-arrow" aria-hidden="true">\u2193</span>
          </button>
          <a href="{base}offerte.html?type=particulier&amp;dienst={page['slug']}&amp;pakket={pid}#offerteWizard" class="btn btn-primary pakket-cta">Offerte voor {naam} aanvragen</a>
        </div>
      </div>''' for pid, naam, desc, items, meest_gekozen in page["pakketten"])
            keuze_sectie = f'''<div class="sec-head reveal"><h2>Waar kunt u uit kiezen?</h2><p class="prose" style="margin-top:8px;">Onderstaande richtingen zijn bedoeld als keuzehulp, geen vaste prijsproducten \u2014 we werken met een offerte op maat. De prijs hangt onder meer af van {prijs_zin.lower()}.</p></div>
      <div class="pakket-grid">
        {pakketten_html}
      </div>'''

        _extra_bron = [label for eid, label, prijs, eenheid, maxi in EXTRA_OPTIES_CONFIG] if page["slug"] in PARTICULIER_INBEGREPEN else page["extra_opties"]
        extra_zin = "Extra werkzaamheden nodig? Tijdens uw offerteaanvraag kunt u eenvoudig aanvullende wensen en aantallen aangeven, bijvoorbeeld " + ", ".join(_extra_bron[:3]).lower() + ", en meer."
        stappen_html = "\n      ".join(f'''<div class="step">
        <div class="stepnum">{num}</div>
        <h3>{naam}</h3>
        <p>{desc}</p>
      </div>''' for num, naam, desc in PARTICULIER_WERKWIJZE)
        faq_html = faq_block(page["faqs"])
        note_html = f'<p class="prose" style="margin-top:14px;"><em>{page["note"]}</em></p>' if page["note"] else ""
        others = [p for p in PARTICULIER_SUBDIENSTEN if p[4] != page["filename"]][:3]
        others_html = "\n    ".join(f"""<a href="{base}{href}" class="service-card">
      <div class="thumb"><img src="{base}images/diensten/{img}" alt="{alt}" width="1200" height="800" loading="lazy" decoding="async" style="width:100%; height:100%; object-fit:cover;"></div>
      <div class="body"><h3>{t}</h3><p>{d}</p></div>
    </a>""" for t, d, img, alt, href in others)

        hero = page_hero("Particuliere schoonmaak", page["title"], page["lead"], base, page["title"],
                          image=f"images/diensten/{page['img']}", image_alt=page["alt"], compact=True)
        body = f"""
  {hero}
  <section class="section-tight" style="padding-bottom:0;">
    <div class="wrap">
      {keuze_sectie}
      <p class="prose reveal" style="margin-top:20px;">{extra_zin}</p>
    </div>
  </section>
  <section class="section-tight" style="background:var(--bg-soft);">
    <div class="wrap-narrow">
      <div class="sec-head reveal" style="text-align:left;"><h2>Wat kan er worden schoongemaakt?</h2></div>
      <ul class="prose reveal" style="margin-top:10px;">
        {onderdelen_html}
      </ul>
      {onderdelen_extra_html}
      {note_html}
    </div>
  </section>
  <section class="section-tight">
    <div class="wrap-narrow">
      <div class="sec-head reveal" style="text-align:left;"><h2>Voor wie is deze dienst?</h2></div>
      <ul class="prose reveal" style="margin-top:10px;">
        {voor_wie_html}
      </ul>
      <div class="hero-actions" style="margin-top:22px;">
        <a href="{base}offerte.html?type=particulier&amp;dienst={page['slug']}#offerteWizard" class="btn btn-primary">Vrijblijvende offerte aanvragen</a>
        <a href="tel:{PHONE_TEL}" class="btn btn-outline">Bel direct</a>
      </div>
    </div>
  </section>
  <section class="section-tight" style="background:var(--bg-soft);">
    <div class="wrap">
      <div class="sec-head reveal"><h2>Hoe werkt het?</h2></div>
      <div class="steps reveal">
        {stappen_html}
      </div>
    </div>
  </section>
  <section class="section-tight">
    <div class="wrap-narrow">
      <div class="sec-head reveal" style="text-align:left;"><h2>Veelgestelde vragen</h2></div>
      <div class="faq reveal" style="margin-top:10px;">{faq_html}</div>
    </div>
  </section>
  <section style="background:var(--bg-soft);"><div class="wrap">{cta_band(f"Interesse in {page['title'].lower()}?", "Vraag vrijblijvend een offerte aan of neem direct contact op.", base, type_param="particulier")}</div></section>
  <section>
    <div class="wrap">
      <div class="sec-head reveal"><span class="eyebrow">Ook interessant</span><h2>Andere particuliere diensten</h2></div>
      <div class="grid-3 reveal">{others_html}</div>
    </div>
  </section>
  <section class="section-tight">
    <div class="wrap-narrow" style="text-align:center;">
      <p class="prose">Bekijk het volledige overzicht van <a href="{base}schoonmaak-particulieren.html" style="color:var(--link); font-weight:600;">particuliere schoonmaak</a> \u2014 op zoek naar schoonmaak voor uw bedrijf? Bekijk onze <a href="{base}zakelijke-schoonmaak.html" style="color:var(--link); font-weight:600;">zakelijke schoonmaak</a>.</p>
    </div>
  </section>
"""
        svc_schema = {"name": page["title"], "short": page["lead"]}
        write(page["filename"], page_shell(
            page["meta_title"], page["meta_description"], page["filename"], base, "schoonmaak-particulieren.html",
            body,
            service_schema(svc_schema) + "\n" + breadcrumb_schema(page["title"], page["filename"]) + "\n" + faq_schema(page["faqs"])
        ))

# =================================================================
# OVER ONS
# =================================================================
def build_over_ons():
    base = ""
    about_items = [
        ("chat", "Persoonlijke aanpak", "Voor ons is schoonmaak geen anoniem proces. We nemen de tijd om uw pand en wensen te leren kennen, zodat de aanpak aansluit op uw situatie \u2014 geen standaardpakket."),
        ("phone", "Direct contact, geen callcenter", "Vragen of een aanpassing nodig? U belt of appt rechtstreeks met uw vaste aanspreekpunt bij Brabantschoon \u2014 niet met een callcenter of wisselende medewerkers."),
        ("check", "Vaste afspraken en kwaliteitscontrole", "Wat we afspreken, komen we na. Daarnaast controleren we resultaat en afspraken steekproefsgewijs, ook nadat de eerste schoonmaakbeurt achter de rug is."),
        ("spark", "Herkenbare, professionele medewerkers", "Onze medewerkers werken in herkenbare Brabantschoon-bedrijfskleding en weten wat er van hen verwacht wordt: representatief, zorgvuldig en met oog voor detail."),
    ]
    about_html = "\n    ".join(f'<div class="usp"><div class="icon-circle">{icon(n)}</div><h3>{t}</h3><p>{d}</p></div>' for n, t, d in about_items)
    body = f"""
  {page_hero("Over ons", "Persoonlijk en professioneel.", f"Een schoonmaakpartner uit {CITY}, met korte lijnen en heldere afspraken.", base, "Over ons", image="images/over-ons.jpg", image_alt="Medewerker van Brabantschoon bij de bedrijfswagen")}
  <section class="section-tight">
    <div class="wrap-narrow">
      <p class="prose">Brabantschoon is de schoonmaakpartner voor kantoren, bedrijfsverzamelgebouwen, VvE's en scholen in heel Noord-Brabant, vanuit onze thuisbasis in {CITY}. In {CITY} en de Peelgemeenten zijn we het snelst ter plaatse. Geen callcenter: direct contact met wie uw locatie kent, en afspraken die we nakomen.</p>
      <div class="hero-actions" style="margin-top:24px;">
        <a href="{base}diensten.html" class="btn btn-outline">Onze diensten</a>
        <a href="{base}werkgebied.html" class="btn btn-outline">Ons werkgebied</a>
      </div>
    </div>
  </section>
  <section style="background:var(--bg-soft);">
    <div class="wrap">
      <div class="sec-head reveal"><span class="eyebrow">Onze aanpak</span><h2>Waar we voor staan.</h2></div>
      <div class="usp-grid reveal">
        {about_html}
      </div>
    </div>
  </section>
  <section style="background:var(--bg-soft);"><div class="wrap">{cta_band(base=base)}</div></section>
"""
    write("over-ons.html", page_shell(
        "Over ons | Brabantschoon Schoonmaakbedrijf",
        f"Brabantschoon is een professionele schoonmaakpartner voor Brabant, met een thuisbasis in {CITY}.",
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
    "Eindhoven": "Kantoorreiniging en opleveringsschoonmaak, inzetbaar op aanvraag.",
    "Geldrop-Mierlo": "Op de route Helmond-Eindhoven, goed inzetbaar.",
    "Nuenen": "Kleinere kantoren en praktijken, persoonlijk contact voorop.",
    "Mierlo": "Onderdeel van Geldrop-Mierlo, dezelfde vaste aanpak.",
}

# Steden buiten het kerngebied: eigen landingspagina, eerlijk over de afstand,
# gericht op grotere of terugkerende opdrachten in plaats van een claim van lokale aanwezigheid.
LOCATIONS = [
    {
        "slug": "tilburg", "name": "Tilburg",
        "intro": "Brabantschoon is actief in heel Noord-Brabant, dus ook in Tilburg. We rijden geregeld naar de stad voor kantoorreiniging, opleveringsschoonmaak en VvE-schoonmaak. Vraag gerust naar de mogelijkheden voor uw locatie.",
        "faq_q": "Werkt u ook in Tilburg voor kleinere klussen?",
        "kaart_tekst": "Brabantschoon is in Tilburg inzetbaar voor kantoorreiniging, opleveringsschoonmaak en VvE-schoonmaak.",
        "uitgelicht": ('Tilburg is een grote studentenstad met een textielverleden en, dankzij de ligging aan de A58 en A65, een belangrijke logistieke sector met veel distributiecentra. Voor kantoren en bedrijfsverzamelgebouwen in de stad zijn we inzetbaar voor kantoorreiniging en VvE-schoonmaak.', 'Of het nu gaat om een vast kantoorcontract, een opleveringsschoonmaak of een eenmalige beurt: vraag gerust naar de mogelijkheden voor uw locatie in Tilburg.'),
        "faq_a": "Ja, Brabantschoon is actief in heel Noord-Brabant. Vraag gerust een vrijblijvende offerte aan, dan bespreken we de mogelijkheden voor uw situatie.",
    },
    {
        "slug": "breda", "name": "Breda",
        "intro": "Brabantschoon is actief in heel Noord-Brabant, dus ook in Breda. Voor kantoren, VvE's en opleveringsschoonmaak rijden we ook hiernaartoe. Vraag gerust naar de mogelijkheden voor uw locatie.",
        "faq_q": "Is een eenmalige beurt in Breda mogelijk?",
        "kaart_tekst": "In Breda is Brabantschoon inzetbaar voor kantoren en VvE's, van eenmalige tot structurele schoonmaakopdrachten.",
        "uitgelicht": ('Breda combineert een historisch centrum met een groeiende sector aan kantoren en bedrijfsverzamelgebouwen, mede dankzij onderwijsinstellingen als Breda University of Applied Sciences. Voor een vast kantoorcontract, VvE-schoonmaak of een opleveringsschoonmaak zijn we hier inzetbaar.', 'Neem gerust contact op om de mogelijkheden voor uw specifieke situatie in Breda te bespreken.'),
        "faq_a": "Ja, Brabantschoon is actief in heel Noord-Brabant. Neem contact op met de details van uw situatie, dan bespreken we de mogelijkheden.",
    },
    {
        "slug": "den-bosch", "name": "Den Bosch",
        "intro": "'s-Hertogenbosch ligt op een goed bereikbare afstand vanuit Helmond, en Brabantschoon is hier actief voor kantoorreiniging, VvE-schoonmaak en opleveringsschoonmaak.",
        "faq_q": "Werkt u ook voor VvE's in Den Bosch?",
        "kaart_tekst": "Voor kantoren, VvE's en bedrijfsverzamelgebouwen in 's-Hertogenbosch is Brabantschoon inzetbaar voor periodieke en facilitaire schoonmaak.",
        "uitgelicht": ("'s-Hertogenbosch is als provinciehoofdstad van Noord-Brabant een stad met veel kantoren van overheid, onderwijs en dienstverlening, onder meer rond het moderne Paleiskwartier bij het station. Voor kantoorreiniging, VvE-schoonmaak en opleveringsschoonmaak zijn we hier inzetbaar.", 'De goede bereikbaarheid vanuit Helmond maakt het mogelijk om zowel structurele, terugkerende opdrachten als eenmalige klussen zoals een opleveringsschoonmaak in Den Bosch in te plannen.'),
        "faq_a": "Ja, we zijn inzetbaar voor schoonmaak van trappenhuizen en gemeenschappelijke ruimtes voor VvE's in en rond 's-Hertogenbosch, in overleg met het bestuur.",
    },
    {
        "slug": "waalwijk", "name": "Waalwijk",
        "intro": "Waalwijk ligt tussen Tilburg en 's-Hertogenbosch in. Brabantschoon is actief in heel Noord-Brabant, dus ook hier zijn we voor bedrijven en VvE's inzetbaar.",
        "faq_q": "Kunt u een vast schoonmaakcontract voor Waalwijk laten verzorgen?",
        "kaart_tekst": "In Waalwijk is Brabantschoon inzetbaar voor vaste schoonmaakcontracten en eenmalige opdrachten voor bedrijven en VvE's.",
        "uitgelicht": ("Waalwijk staat historisch bekend om de schoen- en lederindustrie — zichtbaar in het Schoenenkwartier — en heeft dankzij de ligging aan de A59 een flinke logistieke sector met distributiecentra. Voor bedrijven en VvE's hier zijn we inzetbaar, van periodiek onderhoud tot een eenmalige beurt.", 'Voor een vast, terugkerend contract is Waalwijk goed inpasbaar in onze planning; vraag gerust naar de mogelijkheden voor uw specifieke situatie.'),
        "faq_a": "Ja, voor een vast, terugkerend contract is Waalwijk goed inpasbaar in onze planning. Neem contact op om de mogelijkheden te bespreken.",
    },
]

def build_werkgebied():
    base = ""
    local_slug = {
        "Helmond": "helmond", "Eindhoven": "eindhoven", "Deurne": "deurne", "Asten": "asten",
        "Someren": "someren", "Gemert-Bakel": "gemert-bakel", "Geldrop-Mierlo": "geldrop-mierlo",
        "Nuenen": "nuenen", "Laarbeek": "laarbeek",
        "\u2019s-Hertogenbosch": "den-bosch", "Tilburg": "tilburg", "Waalwijk": "waalwijk", "Breda": "breda",
    }
    # Voorbeeldindeling van Noord-Brabant in 4 regio's. Plaatsen met een
    # bestaande lokale SEO-pagina zijn klikbaar; overige plaatsen staan als
    # gewone tekst (nadrukkelijk een selectie, geen volledige lijst — zie
    # de "Onder andere actief in" framing hieronder).
    REGIOS = [
        ("Zuidoost-Brabant", ["Helmond", "Eindhoven", "Deurne", "Asten", "Someren", "Gemert-Bakel",
                               "Geldrop-Mierlo", "Nuenen", "Laarbeek", "Veldhoven", "Best"]),
        ("Noordoost-Brabant", ["\u2019s-Hertogenbosch", "Oss", "Veghel", "Uden", "Boxtel", "Vught"]),
        ("Midden-Brabant", ["Tilburg", "Waalwijk", "Oisterwijk", "Goirle"]),
        ("West-Brabant", ["Breda", "Oosterhout", "Etten-Leur", "Roosendaal", "Bergen op Zoom"]),
    ]

    def place_html(p):
        if p in local_slug:
            return f'<a href="{base}schoonmaakbedrijf-{local_slug[p]}.html" style="color:var(--link); font-weight:600; text-decoration:none;">{p}</a>'
        return f'<span>{p}</span>'

    regio_cards = "\n        ".join(f'''<div class="pakket-card">
        <h3 class="pakket-title">{naam}</h3>
        <p class="pakket-description" style="margin-top:2px;">{" \u00b7 ".join(place_html(p) for p in plaatsen)}</p>
      </div>''' for naam, plaatsen in REGIOS)

    body = f"""
  {page_hero("Werkgebied", "Actief in heel Noord-Brabant.", f"Vanuit {CITY} verzorgen we schoonmaak voor bedrijven en particulieren in heel Noord-Brabant. Van eenmalige opdrachten tot periodieke schoonmaak: vraag gerust naar de mogelijkheden voor uw locatie.", base, "Werkgebied", image="images/werkgebied-kerngebied.jpg", image_alt="Medewerker van Brabantschoon bij de bedrijfswagen op locatie")}
  <section class="section-tight">
    <div class="wrap">
      <div class="sec-head reveal"><span class="eyebrow">Onder andere actief in</span><h2>Een selectie van plaatsen waar wij actief zijn.</h2></div>
      <div class="regio-grid reveal">
        {regio_cards}
      </div>
    </div>
  </section>
  <section class="section-tight" style="background:var(--bg-soft);">
    <div class="wrap-narrow" style="text-align:center;">
      <span class="eyebrow">Staat uw plaats er niet tussen?</span>
      <h2 style="margin-top:8px;">Ook dan denken we graag mee.</h2>
      <p class="prose reveal" style="margin-top:10px;">Ook dan kunt u gewoon een offerte aanvragen. Wij bekijken graag wat er mogelijk is op uw locatie.</p>
      <div class="hero-actions" style="justify-content:center; margin-top:20px;">
        <a href="{base}offerte.html#offerteWizard" class="btn btn-primary">Offerte aanvragen</a>
      </div>
    </div>
  </section>
  <section>
    <div class="wrap">
      {cta_band(base=base)}
    </div>
  </section>
"""
    write("werkgebied.html", page_shell(
        "Werkgebied | Actief in heel Noord-Brabant | Brabantschoon",
        f"Brabantschoon is uw schoonmaakpartner in heel Noord-Brabant, vanuit Helmond \u2014 voor bedrijven, VvE's, organisaties en particulieren.",
        "werkgebied.html", base, "werkgebied.html", body, breadcrumb_schema("Werkgebied", "werkgebied.html")
    ))

# =================================================================
# CONTACT
# =================================================================
# =================================================================
# LOCATIEPAGINA'S (steden buiten het kerngebied)
# =================================================================
def local_uitgelicht(loc):
    """Rendert de twee handgeschreven, plaats-specifieke paragrafen uit loc['uitgelicht']
    (KERNGEBIED/LOCATIONS). Geen sjabloon met plaatsnaam-vervanging: elke plaats heeft
    eigen tekst, gebaseerd op de daadwerkelijke lokale bedrijvigheid/context."""
    p1, p2 = loc["uitgelicht"]
    return f"""<p class="prose">{p1}</p>
      <p class="prose" style="margin-top:14px;">{p2}</p>"""

def seo_trust_paragraphs():
    """Vaste, zorgvuldig geschreven tekst over onze werkwijze. Bewust NIET per plaats
    geroteerd: de werkwijze zelf verschilt niet per plaats, alleen de doelgroep en
    dienstverlening (die staan wel per plaats uniek beschreven, zie 'uitgelicht' en
    'doelgroep_lokaal' per stad hierboven)."""
    return """<p class="prose">Ieder nieuw contract begint met een kort, vrijblijvend kennismakingsgesprek op locatie. We bekijken samen welke ruimtes schoongemaakt moeten worden, welke frequentie logisch is en of er specifieke aandachtspunten zijn. Op basis daarvan stellen we een offerte op maat op, zonder verrassingen achteraf.</p>
      <p class="prose" style="margin-top:14px;">U krijgt een vast schoonmaakteam toegewezen dat uw pand na een paar bezoeken door en door kent. Wisselende gezichten en steeds opnieuw uitleggen hoe u het wilt hebben, doen we liever niet \u2014 vaste mensen werken prettiger en efficiënter.</p>
      <p class="prose" style="margin-top:14px;">Werkzaamheden of drukte veranderen weleens. Daarom kunt u de frequentie of omvang van de schoonmaak tussentijds aanpassen, zonder dat u vastzit aan een star contract. Waar mogelijk werken we bovendien met milieuvriendelijke schoonmaakmiddelen, zonder dat dit ten koste gaat van het resultaat.</p>"""

def local_doelgroep(loc):
    """Rendert de handgeschreven, plaats-specifieke doelgroep-paragraaf uit
    loc['doelgroep_lokaal'], aangevuld met een vaste, niet-geroteerde alinea over
    planning en aanspreekpunt (praktische afspraken verschillen niet wezenlijk per
    plaats, de doelgroep zelf staat wel echt per plaats beschreven)."""
    fallback_klanten = loc.get('klanten', "kantoren, VvE's en bedrijfspanden")
    doelgroep = loc.get("doelgroep_lokaal", f"In {loc['name']} werken we voor uiteenlopende organisaties: {fallback_klanten}.")
    return f"""<p class="prose">{doelgroep}</p>
      <p class="prose" style="margin-top:14px;">De planning stemmen we af op uw openingstijden of het gebruik van het pand \u2014 vaak buiten de reguliere uren, zodat de dagelijkse werkzaamheden geen hinder ondervinden. Voor vragen of aanpassingen heeft u altijd één vast aanspreekpunt bij Brabantschoon, rechtstreeks bereikbaar, zonder callcenter.</p>"""

KERNGEBIED = [
    {
        "slug": "helmond", "name": "Helmond",
        "intro": "Als thuisbasis van Brabantschoon is Helmond ons voornaamste werkgebied. Van periodieke tot eenmalige schoonmaak en bredere facilitaire dienstverlening — we zijn hier inzetbaar voor kantoren, bedrijfsverzamelgebouwen en winkelpanden.",
        "waarom": "Doordat we in Helmond zelf gevestigd zijn, is de reistijd naar elke locatie kort. Dat betekent snel kunnen schakelen bij een spoedklus, en een team dat zich snel inwerkt in uw pand.",
        "klanten": "kantoren, bedrijfsverzamelgebouwen, VvE's, winkels, praktijken en andere zakelijke organisaties",
        "kaart_tekst": "Brabantschoon is vanuit Helmond inzetbaar voor periodieke en eenmalige schoonmaak, voor kantoren, VvE's en winkels in de hele regio.",
        "uitgelicht": ('Als vestigingsplaats is Helmond ons voornaamste werkgebied: van kantoren op en rond de Automotive Campus tot bedrijfsverzamelgebouwen in Suytkade en het centrum. Kantoorreiniging en VvE-schoonmaak vormen hier de kern van onze dienstverlening, aangevuld met opleveringsschoonmaak bij verhuizingen of nieuwbouw.', 'Ook glasbewassing en specialistische reiniging \u2014 bijvoorbeeld van tapijt en vloeren \u2014 vragen we regelmatig aan in Helmond, vaak in combinatie met periodieke schoonmaak op een vast ritme. Door de korte afstand tot ons kantoor kunnen we hier ook kleinere of onregelmatige klussen inplannen die verder weg minder snel rendabel zijn — denk aan een eenmalige beurt of een spoedklus tussen de vaste planning door.'),
        "doelgroep_lokaal": "In Helmond zijn we inzetbaar voor uiteenlopende organisaties: kantoren, bedrijfsverzamelgebouwen, VvE's, winkels en praktijken. Omdat dit onze thuisbasis is, bespreken we hier snel de mogelijkheden voor een kennismaking op locatie.",
        "faqs": [
            ("Werkt u ook 's avonds of in het weekend in Helmond?", "Ja, voor veel kantoren en winkels plannen we de schoonmaak juist buiten openingstijden, zodat het uw bedrijfsvoering niet verstoort."),
            ("Kunt u snel starten als nieuwe klant in Helmond?", "Vaak wel — omdat we hier gevestigd zijn, bespreken we de mogelijkheden voor een kennismaking op locatie snel."),
        ],
        "neighbors": ["deurne", "gemert-bakel"],
    },
    {
        "slug": "deurne", "name": "Deurne",
        "intro": "Deurne ligt dicht bij ons kerngebied: van bedrijfspanden op de bedrijventerreinen tot praktijken in het centrum. We zijn hier inzetbaar voor reguliere kantoorreiniging, opleveringsschoonmaak en specialistische reiniging.",
        "waarom": "Deurne ligt op korte afstand van ons kerngebied Helmond, waardoor we hier net zo snel kunnen schakelen als in onze thuisstad.",
        "klanten": "bedrijfspanden, praktijken, logistieke bedrijven en productiebedrijven",
        "kaart_tekst": "Vanuit ons kerngebied zijn we in Deurne inzetbaar voor periodieke schoonmaak, opleveringsschoonmaak en specialistische reiniging voor bedrijven en praktijken.",
        "uitgelicht": ('Deurne combineert bedrijventerreinen zoals Kranenmortel met een sterke agrarische en logistieke sector. Voor bedrijfspanden en loodsen zijn we vooral inzetbaar voor periodieke kantoor- en hallenreiniging, en bij verbouwing of verhuizing opleveringsschoonmaak.', 'Ook praktijken in het centrum van Deurne — huisartsen, fysiotherapie en vergelijkbare zorgpraktijken — vragen om hygiënische, buiten openingstijden uitgevoerde schoonmaak. Dat combineren we goed met onze planning rond Helmond, waar Deurne aan grenst.'),
        "doelgroep_lokaal": 'Organisaties waarvoor wij in Deurne inzetbaar zijn: met name bedrijfspanden, praktijken, logistieke en productiebedrijven. Voor deze laatste groep bieden we ook specialistische reiniging van hallen en werkvloeren.',
        "faqs": [
            ("Verzorgt u ook praktijken in Deurne?", "Ja, we zijn inzetbaar voor praktijkruimtes zoals huisartsenposten en fysiotherapiepraktijken, buiten de openingstijden."),
            ("Is eenmalige schoonmaak in Deurne mogelijk?", "Zeker, bijvoorbeeld bij een verhuizing of oplevering. Neem contact op voor de mogelijkheden."),
        ],
        "neighbors": ["helmond", "asten"],
    },
    {
        "slug": "asten", "name": "Asten",
        "intro": "Asten en de kern Heusden liggen goed bereikbaar vanuit Helmond. We zijn hier inzetbaar voor zowel eenmalige als periodieke schoonmaak, op een ritme dat bij uw organisatie past.",
        "waarom": "De korte afstand vanuit Helmond maakt het voor ons eenvoudig om ook kleinere opdrachten in Asten rendabel in te plannen.",
        "klanten": "kantoren, bedrijfsruimtes, VvE's en productiebedrijven",
        "kaart_tekst": "Brabantschoon is in Asten inzetbaar voor zowel eenmalige als terugkerende schoonmaak, voor kantoren, bedrijfsruimtes en VvE's.",
        "uitgelicht": ('Asten en de kern Heusden liggen in De Peel, een regio met relatief veel agrarische bedrijven en kleinere bedrijfsterreinen zoals Molenakkers. Voor kantoren en bedrijfsruimtes hier zijn we inzetbaar voor zowel periodieke schoonmaak als eenmalige beurten.', 'Door de korte afstand vanuit Helmond kunnen we in Asten ook kleinere opdrachten rendabel inplannen — iets wat verder van ons kerngebied minder vanzelfsprekend is.'),
        "doelgroep_lokaal": "In Asten zijn we inzetbaar voor kantoren, bedrijfsruimtes, VvE's en productiebedrijven. Voor VvE's gaat het met name om trappenhuizen en gemeenschappelijke ruimtes, in overleg met het bestuur.",
        "faqs": [
            ("Rijdt u ook naar Heusden?", "Ja, Heusden valt binnen ons werkgebied rond Asten."),
            ("Wat kost schoonmaak in Asten?", "Dat hangt af van de ruimte en frequentie. Na een kort gesprek ontvangt u een vrijblijvende offerte op maat."),
        ],
        "neighbors": ["deurne", "someren"],
    },
    {
        "slug": "someren", "name": "Someren",
        "intro": "In Someren zijn we inzetbaar voor kantoren, VvE's en scholen die op zoek zijn naar een persoonlijke, vaste schoonmaakpartner — van wekelijkse onderhoudsbeurten tot eenmalige klussen.",
        "waarom": "Someren heeft veel lokale organisaties die op zoek zijn naar een vaste, betrokken schoonmaakpartner — daar sluit onze aanpak van één vast team en korte lijnen goed op aan.",
        "klanten": "kantoren, VvE's, bedrijfspanden en scholen",
        "kaart_tekst": "In Someren zijn we inzetbaar voor periodieke en wekelijkse schoonmaak, voor kantoren, VvE's en scholen in de regio.",
        "uitgelicht": ('Someren en de kernen Someren-Eind en Lierop kennen een sterke glastuinbouwsector, naast kantoren en lokale bedrijvigheid. Voor kantoren en bedrijfsruimtes hier bieden we periodieke schoonmaak op een vast, wekelijks ritme.', "Scholen en VvE's in Someren vragen vaak om schoonmaak buiten lesuren of avonduren — daar stemmen we onze planning bewust op af, met hetzelfde vaste team per bezoek."),
        "doelgroep_lokaal": "Organisaties waarvoor wij in Someren inzetbaar zijn: kantoren, VvE's, bedrijfspanden en scholen. Voor scholen letten we extra op hygiëne in gemeenschappelijke ruimtes zoals gangen, toiletten en kantines.",
        "faqs": [
            ("Werkt u met een vast team in Someren?", "Ja, u krijgt een vast aanspreekpunt toegewezen zodra u klant wordt."),
            ("Is een offerte vrijblijvend?", "Altijd, en zonder verplichtingen."),
        ],
        "neighbors": ["asten", "gemert-bakel"],
    },
    {
        "slug": "gemert-bakel", "name": "Gemert-Bakel",
        "intro": "Gemert en Bakel behoren tot ons kerngebied. Of het nu gaat om facilitaire schoonmaak voor een bedrijfspand in Gemert of een opleveringsschoonmaak in Bakel, we pakken dit met dezelfde zorg aan als in Helmond zelf.",
        "waarom": "Als schoonmaakbedrijf in de Peelregio hebben we oog voor de wensen van lokale bedrijven.",
        "klanten": "bedrijfspanden, VvE's, logistieke bedrijven en organisaties met een opleveringsklus",
        "kaart_tekst": "Brabantschoon is in Gemert-Bakel inzetbaar voor facilitaire schoonmaak, opleveringsschoonmaak en periodiek onderhoud, voor bedrijven en VvE's.",
        "uitgelicht": ('Gemert-Bakel heeft een sterke agrifoodsector — met de champignonteelt als bekende bedrijfstak — en huisvest onderwijsinstellingen zoals Helicon. Voor bedrijfspanden in deze sector zijn we inzetbaar voor facilitaire schoonmaak en, bij verbouwing of verhuizing, opleveringsschoonmaak.', 'Ook in het centrum van Gemert, rond Kasteel Gemert, zitten kantoren en praktijken die om periodieke schoonmaak vragen — vaak in combinatie met glasbewassing van etalages of kantoorramen.'),
        "doelgroep_lokaal": "Organisaties waarvoor wij in Gemert-Bakel inzetbaar zijn: bedrijfspanden, VvE's, logistieke bedrijven en organisaties met een opleveringsklus. De agrarische en foodsector in de regio betekent dat hygiëne vaak net iets meer aandacht vraagt dan gemiddeld.",
        "faqs": [
            ("Doet u ook opleveringsschoonmaak in Gemert-Bakel?", "Ja, opleveringsschoonmaak is een van de diensten die we hier aanbieden."),
            ("Hoe snel kunt u starten?", "Neem contact op voor een kort kennismakingsgesprek, dan bespreken we de mogelijkheden snel."),
        ],
        "neighbors": ["helmond", "laarbeek"],
    },
    {
        "slug": "laarbeek", "name": "Laarbeek",
        "intro": "In Laarbeek, met de kernen Beek en Donk, Aarle-Rixtel en Mariahout, zijn we inzetbaar voor periodieke en eenmalige schoonmaak, voor kantoren, winkels en VvE's die op zoek zijn naar een vast en betrouwbaar schoonmaakteam.",
        "waarom": "De verschillende kernen van Laarbeek liggen dicht bij elkaar, waardoor we hier efficiënt kunnen plannen — dat voordeel geven we door in scherpe tarieven.",
        "klanten": "kantoren, VvE's, winkels en bedrijfsverzamelgebouwen in Beek en Donk, Aarle-Rixtel en Mariahout",
        "kaart_tekst": "In Laarbeek zijn we inzetbaar voor periodieke en eenmalige schoonmaak, voor kantoren, winkels en bedrijfsverzamelgebouwen.",
        "uitgelicht": ('Laarbeek — met de kernen Beek en Donk, Aarle-Rixtel en Mariahout — kent een mix van agrarische bedrijven, de paardensector en kleinere bedrijventerreinen zoals Bemmerpark in Beek en Donk. Voor kantoren en bedrijfsverzamelgebouwen hier zijn we inzetbaar voor periodieke en eenmalige schoonmaak.', 'Doordat de kernen van Laarbeek dicht bij elkaar liggen, kunnen we hier efficiënt plannen — verschillende panden op één route, zonder dat dit ten koste gaat van de aandacht per locatie.'),
        "doelgroep_lokaal": "Organisaties waarvoor wij in Laarbeek inzetbaar zijn: kantoren, VvE's, winkels en bedrijfsverzamelgebouwen in Beek en Donk, Aarle-Rixtel en Mariahout. Voor winkels plannen we het liefst vroeg in de ochtend, vóór openingstijd.",
        "faqs": [
            ("Werkt u in alle kernen van Laarbeek?", "Ja, in Beek en Donk, Aarle-Rixtel en Mariahout zijn we inzetbaar."),
            ("Biedt u ook periodieke schoonmaak?", "Ja, naast vaste contracten ook periodieke beurten op afspraak."),
        ],
        "neighbors": ["gemert-bakel", "helmond"],
    },
    {
        "slug": "nuenen", "name": "Nuenen",
        "intro": "In Nuenen zijn we inzetbaar voor zowel periodieke als eenmalige schoonmaak, voor kantoren, praktijken en scholen, waarbij persoonlijk contact en een vast aanspreekpunt voorop staan.",
        "waarom": "Nuenen heeft veel zelfstandige ondernemers en professionele praktijken — juist daar telt een schoonmaakpartner die meedenkt in plaats van alleen uitvoert.",
        "klanten": "kantoren, praktijken, scholen en organisaties met een eigen bedrijfspand",
        "kaart_tekst": "Brabantschoon is in Nuenen inzetbaar voor periodieke en eenmalige schoonmaak, voor kantoren, praktijken en scholen.",
        "uitgelicht": ('Nuenen is vooral bekend als woonplaats van Vincent van Gogh en heeft een overwegend kleinschalig, welvarend ondernemersklimaat: veel zelfstandige praktijken en kleinere kantoren, minder zware industrie dan in de rest van de regio.', 'Dat vertaalt zich in onze aanpak: periodieke schoonmaak op maat voor praktijkruimtes en kantoren, waarbij representativiteit en een persoonlijke aanpak vaak net iets zwaarder wegen dan bij grootschalige bedrijfspanden.'),
        "doelgroep_lokaal": 'Organisaties waarvoor wij in Nuenen inzetbaar zijn: kantoren, praktijken, scholen en organisaties met een eigen bedrijfspand — van eenmanszaak tot grotere praktijk, telkens met een offerte op maat.',
        "faqs": [
            ("Werkt u voor organisaties van elke omvang in Nuenen?", "Zeker, van eenmanszaak tot grotere praktijk stellen we een passende offerte op."),
            ("Is de eerste afspraak vrijblijvend?", "Ja, een kennismaking en offerte zijn altijd kosteloos en vrijblijvend."),
        ],
        "neighbors": ["eindhoven", "geldrop-mierlo"],
    },
    {
        "slug": "geldrop-mierlo", "name": "Geldrop-Mierlo",
        "intro": "Geldrop en Mierlo, samen de gemeente Geldrop-Mierlo, liggen op de route tussen Helmond en Eindhoven. Dat maakt het voor ons goed mogelijk om hier structurele en facilitaire schoonmaak aan te bieden, van periodiek onderhoud tot vaste contracten.",
        "waarom": "De ligging tussen onze twee belangrijkste werkgebieden in maakt Geldrop-Mierlo makkelijk te combineren met andere afspraken — dat scheelt in de planning en dus in de prijs.",
        "klanten": "kantoren, bedrijfsverzamelgebouwen, VvE's en productiebedrijven",
        "kaart_tekst": "In Geldrop-Mierlo zijn we inzetbaar voor structurele en facilitaire schoonmaak, voor kantoren, bedrijfsverzamelgebouwen en VvE's.",
        "uitgelicht": ('Geldrop-Mierlo heeft een industrieel verleden in de textielsector en ligt precies op de route tussen Helmond en Eindhoven. Voor kantoren en bedrijfsverzamelgebouwen op bedrijventerreinen zoals Bogardeind zijn we inzetbaar voor structurele, facilitaire schoonmaak.', 'De ligging tussen onze twee belangrijkste werkgebieden maakt het voor ons goed te combineren met andere afspraken in de regio — dat komt de planning, en daarmee de prijs, ten goede.'),
        "doelgroep_lokaal": "Organisaties waarvoor wij in Geldrop-Mierlo inzetbaar zijn: kantoren, bedrijfsverzamelgebouwen, VvE's en productiebedrijven, zowel in Geldrop als in Mierlo.",
        "faqs": [
            ("Ook actief in Mierlo zelf?", "Ja, voor Mierlo hanteren we dezelfde vaste aanpak als voor Geldrop."),
            ("Kunt u een vast wekelijks contract laten verzorgen?", "Ja, dat behoort tot de mogelijkheden in deze regio."),
        ],
        "neighbors": ["nuenen", "eindhoven"],
    },
    {
        "slug": "eindhoven", "name": "Eindhoven",
        "intro": "Eindhoven ligt op korte afstand van ons kerngebied in de Peel. We zijn hier inzetbaar voor kantoorreiniging, facilitaire schoonmaak, VvE-schoonmaak en specialistische reiniging — van eenmalige klussen tot vaste contracten.",
        "waarom": "Eindhoven is de grootste stad in onze regio, met veel kantoren, bedrijfsverzamelgebouwen en VvE's. Daarom zijn we hier goed inzetbaar voor zowel incidentele als structurele opdrachten.",
        "klanten": "kantoren, bedrijfsverzamelgebouwen, VvE's, zorginstellingen en gemeentelijke instellingen",
        "kaart_tekst": "Brabantschoon is in Eindhoven inzetbaar voor periodieke, eenmalige en specialistische schoonmaak, voor kantoren, VvE's, zorginstellingen en gemeentelijke instellingen.",
        "uitgelicht": ('Eindhoven is met Brainport en de High Tech Campus de grootste en meest kantorendichte stad in onze regio. Voor kantoren en bedrijfsverzamelgebouwen hier zijn we inzetbaar voor periodieke en facilitaire schoonmaak, van een enkele verdieping tot een compleet pand.', "Door het grote aantal VvE's, zorginstellingen en gemeentelijke gebouwen in Eindhoven zijn we hier goed inzetbaar voor structurele opdrachten — met een vast team dat zich snel inwerkt in uw pand."),
        "doelgroep_lokaal": "Organisaties waarvoor wij in Eindhoven inzetbaar zijn: kantoren, bedrijfsverzamelgebouwen, VvE's, zorginstellingen en gemeentelijke instellingen. Bij bedrijfsverzamelgebouwen met meerdere huurders werken we met één vast aanspreekpunt voor het hele pand.",
        "faqs": [
            ("Is een vast schoonmaakcontract in Eindhoven mogelijk?", "Ja, Eindhoven ligt goed bereikbaar vanuit Helmond en we zijn hier inzetbaar voor vaste, terugkerende schoonmaak."),
            ("Werkt u ook voor bedrijfsverzamelgebouwen in Eindhoven?", "Ja, met meerdere huurders onder één dak werken we met één vast aanspreekpunt voor het hele pand."),
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
      <div class="thumb {s['tint']}">{service_visual_from_root(s)}</div>
      <div class="body"><h3>{s['name']}</h3><p>{s['short']}</p></div>
    </a>""" for s in SERVICES[:6])
        faq_html = faq_block(k["faqs"])
        body = f"""
  {page_hero("Werkgebied", f"Schoonmaakbedrijf {k['name']}", k['intro'], base, k['name'], image="images/werkgebied-kerngebied.jpg", image_alt=f"Brabantschoon actief in {k['name']} en omgeving")}
  <section class="section-tight">
    <div class="wrap">
      <div class="two-col reveal">
        <div>
          <span class="eyebrow">Waarom Brabantschoon in {k['name']}</span>
          <h2 style="font-size:24px; margin-top:8px;">Lokaal betrokken, professioneel uitgevoerd.</h2>
          <p class="prose" style="margin-top:14px;">{k['waarom']}</p>
          <p class="prose" style="margin-top:12px;"><strong style="color:var(--ink);">Voor wie:</strong> {k['klanten']}.</p>
          <div class="hero-actions" style="margin-top:24px;">
            <a href="{base}offerte.html?type=zakelijk#offerteWizard" class="btn btn-primary">Vraag offerte aan</a>
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
      <div class="sec-head reveal"><span class="eyebrow">{k['name']}</span><h2>Onze diensten en werkwijze in {k['name']}</h2></div>
      <div style="max-width:760px; margin:0 auto;">
        {local_uitgelicht(k)}
        <h3 style="font-family:'Inter',sans-serif; font-size:17px; margin-top:22px;">Zo werken wij</h3>
        <div style="margin-top:10px;">{seo_trust_paragraphs()}</div>
        <h3 style="font-family:'Inter',sans-serif; font-size:17px; margin-top:22px;">Voor wie</h3>
        <div style="margin-top:10px;">{local_doelgroep(k)}</div>
      </div>
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
        title = f"Schoonmaakbedrijf {k['name']} | Brabantschoon"
        desc = f"Schoonmaakbedrijf in {k['name']}? Brabantschoon verzorgt kantoorreiniging, VvE-schoonmaak en opleveringsschoonmaak. Vrijblijvende offerte binnen 1 werkdag."
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
      <div class="thumb {s['tint']}">{service_visual_from_root(s)}</div>
      <div class="body"><h3>{s['name']}</h3><p>{s['short']}</p></div>
    </a>""" for s in SERVICES[:6])
        body = f"""
  {page_hero("Werkgebied", f"Schoonmaakbedrijf {loc['name']}", loc['intro'], base, loc['name'], image="images/werkgebied-regio.jpg", image_alt=f"Brabantschoon actief in {loc['name']} en omgeving")}
  <section>
    <div class="wrap">
      <div class="two-col reveal">
        <div>
          <p class="prose">Brabantschoon is actief in heel Noord-Brabant, vanuit onze thuisbasis in Helmond. Voor {loc['name']} zijn we inzetbaar voor onder meer een vast kantoorcontract, VvE-schoonmaak of een opleveringsschoonmaak \u2014 vraag gerust naar de mogelijkheden voor uw locatie.</p>
          <div class="hero-actions" style="margin-top:26px;">
            <a href="{base}offerte.html?type=zakelijk#offerteWizard" class="btn btn-primary">Vraag offerte aan</a>
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
  <section class="section-tight">
    <div class="wrap">
      <div class="sec-head reveal"><span class="eyebrow">{loc['name']}</span><h2>Onze diensten en werkwijze in {loc['name']}</h2></div>
      <div style="max-width:760px; margin:0 auto;">
        {local_uitgelicht(loc)}
        <h3 style="font-family:'Inter',sans-serif; font-size:17px; margin-top:22px;">Zo werken wij</h3>
        <div style="margin-top:10px;">{seo_trust_paragraphs()}</div>
        <h3 style="font-family:'Inter',sans-serif; font-size:17px; margin-top:22px;">Voor wie</h3>
        <div style="margin-top:10px;">{local_doelgroep(loc)}</div>
      </div>
    </div>
  </section>
  <section class="section-tight" style="background:var(--bg-soft);">
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
        title = f"Schoonmaakbedrijf {loc['name']} | Brabantschoon"
        desc = f"Schoonmaakbedrijf voor {loc['name']}? Brabantschoon verzorgt kantoorreiniging en VvE-schoonmaak voor grotere opdrachten, vanuit Helmond. Vrijblijvende offerte."
        url = f"schoonmaakbedrijf-{loc['slug']}.html"
        write(url, page_shell(
            title, desc, url, base, url, body,
            breadcrumb_schema(loc['name'], url) + "\n" + faq_schema([(loc['faq_q'], loc['faq_a'])]) + "\n" + LOCALBUSINESS_SCHEMA
        ))

def build_contact():
    base = ""
    body = f"""
  {page_hero("Contact", "Neem contact op.", "We reageren doorgaans binnen \u00e9\u00e9n werkdag \u2014 voor bedrijven, VvE's, organisaties en particulieren.", base, "Contact")}
  <section>
    <div class="wrap">
      <div class="benefits-strip reveal">
        <span>{icon('check')}Vrijblijvende offerte</span>
        <span>{icon('clock')}Reactie doorgaans binnen \u00e9\u00e9n werkdag</span>
        <span>{icon('doc')}Duidelijke offerte</span>
        <span>{icon('pin')}Actief in Brabant</span>
      </div>
      <div class="contact-grid reveal">
        {contact_info_block(base, show_heading=False)}
        <div class="quick-cta-card">
          <h3>Liever direct een offerte op maat?</h3>
          <p>Beantwoord een paar korte vragen over uw situatie &mdash; wij sturen u een vrijblijvende offerte, voor bedrijven, VvE's, organisaties en particulieren.</p>
          <div class="hero-actions">
            <a href="{base}offerte.html" class="btn btn-primary">Offerte aanvragen</a>
          </div>
        </div>
      </div>
    </div>
  </section>
"""
    write("contact.html", page_shell(
        "Contact | Brabantschoon Schoonmaakbedrijf Brabant",
        "Neem contact op met Brabantschoon \u2014 telefonisch, per e-mail of via het contactformulier. Voor een offerte op maat verwijzen we u naar onze offertepagina.",
        "contact.html", base, "contact.html", body, LOCALBUSINESS_SCHEMA + "\n" + breadcrumb_schema("Contact", "contact.html")
    ))

def build_offerte():
    base = ""
    body = f"""
  {page_hero("Offerte", "Vraag een offerte aan.", "Beantwoord een paar korte vragen over uw situatie \u2014 we sturen u een vrijblijvende, kosteloze offerte op maat.", base, "Offerte aanvragen")}
  <section>
    <div class="wrap-narrow">
      {contact_form()}
    </div>
  </section>
"""
    write("offerte.html", page_shell(
        "Offerte aanvragen | Brabantschoon",
        "Vraag vrijblijvend een offerte aan bij Brabantschoon \u2014 voor bedrijven, VvE's, organisaties en particulieren. Beantwoord een paar korte vragen voor een offerte op maat.",
        "offerte.html", base, "contact.html", body, LOCALBUSINESS_SCHEMA + "\n" + breadcrumb_schema("Offerte aanvragen", "offerte.html")
    ))

# =================================================================
# THANKS / LEGAL
# =================================================================
def build_thanks():
    body = f"""
  <section style="min-height:56vh; display:flex; align-items:center; justify-content:center; text-align:center;">
    <div class="wrap-narrow">
      <img src="images/logo.png" alt="Brabantschoon" width="260" height="30" style="height:30px; width:auto; margin:0 auto 20px;">
      <h1 style="font-size:34px;">Bedankt voor uw aanvraag.</h1>
      <p class="prose" style="margin-top:12px;">We hebben uw bericht ontvangen en nemen binnen \u00e9\u00e9n werkdag contact met u op.</p>
      <a class="btn btn-primary" href="/" style="margin-top:24px;">Terug naar de website</a>
    </div>
  </section>
"""
    write("thanks.html", page_shell("Bedankt | Brabantschoon", "Bedankt voor uw offerteaanvraag bij Brabantschoon. We nemen binnen \u00e9\u00e9n werkdag contact met u op.", "thanks.html", "", "", body))

def build_legal():
    base = ""
    privacy = f"""
  {page_hero("Juridisch", "Privacyverklaring.", "Hoe Brabantschoon omgaat met uw persoonsgegevens.", base, "Privacyverklaring")}
  <section><div class="wrap-narrow prose reveal">
    <p>Brabantschoon (KvK {KVK}), gevestigd in {CITY}, is verantwoordelijk voor de verwerking van persoonsgegevens zoals beschreven in deze privacyverklaring. Wij gaan zorgvuldig met uw gegevens om en vragen nooit meer gegevens dan nodig is om uw aanvraag goed te kunnen behandelen.</p>

    <h2>Welke gegevens verzamelen wij</h2>
    <p>Wanneer u een offerte aanvraagt via onze website, verwerken wij de volgende soorten gegevens:</p>
    <ul>
      <li><strong>Contactgegevens</strong>: naam, e-mailadres, telefoonnummer en, indien u die invult, plaats- of adresgegevens.</li>
      <li><strong>Aanvraaggegevens</strong>, afhankelijk van de gekozen dienst: of u een particuliere, zakelijke of VvE-aanvraag doet, de gekozen dienst en eventueel pakket, en relevante situatie-informatie zoals woonoppervlakte, type woning, aantal kamers of sanitair, vervuilingsgraad, gewenste extra werkzaamheden, en gegevens over bijvoorbeeld een verhuizing, verbouwing, oplevering of glasbewassing wanneer die dienst van toepassing is.</li>
      <li><strong>Overige informatie</strong> die u zelf toevoegt, zoals een opmerking of toelichting bij uw aanvraag.</li>
      <li><strong>Gebruiksgegevens</strong> van de website, uitsluitend met uw toestemming via Google Analytics (zie ons <a href="{base}cookiebeleid.html" style="color:var(--link); font-weight:600;">cookiebeleid</a>).</li>
    </ul>
    <p>We vragen alleen de gegevens die nodig zijn om een passende offerte te kunnen opstellen \u2014 welke gegevens dat precies zijn, hangt af van de dienst waarvoor u een aanvraag doet.</p>

    <h2>Waarom verwerken wij deze gegevens</h2>
    <p>Wij gebruiken uw gegevens om:</p>
    <ul>
      <li>contact met u op te nemen en een passende offerte op te stellen;</li>
      <li>de overeengekomen dienstverlening uit te voeren, wanneer u klant wordt;</li>
      <li>te voldoen aan wettelijke verplichtingen, zoals onze administratie- en fiscale bewaarplicht;</li>
      <li>(uitsluitend met uw toestemming) inzicht te krijgen in het gebruik van onze website, om deze te verbeteren.</li>
    </ul>

    <h2>Hoe lang bewaren wij uw gegevens</h2>
    <p>Wij bewaren uw gegevens niet langer dan nodig is voor het doel waarvoor ze zijn verzameld. Gegevens van een offerteaanvraag die niet tot een opdracht leidt, bewaren wij een redelijke termijn om eventuele vervolgvragen te kunnen beantwoorden, en verwijderen wij daarna. Gegevens die horen bij een lopende of afgeronde opdracht bewaren wij zolang de wet dit voorschrijft, bijvoorbeeld de fiscale bewaarplicht van 7 jaar voor administratieve gegevens.</p>

    <h2>Delen met derden</h2>
    <p>Wij verkopen uw gegevens nooit aan derden. Voor de uitvoering van onze dienstverlening en website maken wij gebruik van enkele externe partijen die als verwerker voor ons optreden of waarmee gegevens gedeeld kunnen worden:</p>
    <ul>
      <li>de partij die ons offerteformulier technisch verwerkt en per e-mail aan ons doorstuurt;</li>
      <li>Google, uitsluitend voor Google Analytics (met uw toestemming) en voor het tonen van Google Maps wanneer u deze zelf laadt;</li>
      <li>Elfsight, voor het tonen van onze Google-beoordelingen op de website.</li>
    </ul>
    <p>Meer details over deze externe diensten en wanneer ze worden geladen, leest u in ons <a href="{base}cookiebeleid.html" style="color:var(--link); font-weight:600;">cookiebeleid</a>.</p>

    <h2>Beveiliging</h2>
    <p>Wij nemen passende technische en organisatorische maatregelen om uw gegevens te beschermen tegen verlies of onrechtmatig gebruik.</p>

    <h2>Uw rechten</h2>
    <p>U heeft het recht op inzage, correctie of verwijdering van uw persoonsgegevens, en het recht om bezwaar te maken tegen de verwerking ervan. Neem hiervoor contact met ons op via {EMAIL}. Bent u niet tevreden over hoe wij met uw gegevens omgaan, dan kunt u ook een klacht indienen bij de Autoriteit Persoonsgegevens.</p>

    <h2>Contact</h2>
    <p>Vragen over deze privacyverklaring? Neem contact op via {EMAIL} of {PHONE_DISPLAY}.</p>

    <p class="prose" style="font-size:13px; color:var(--ink-soft); margin-top:24px;">Laatst bijgewerkt: augustus 2026.</p>
  </div></section>
"""
    write("privacy.html", page_shell("Privacyverklaring | Brabantschoon", "Lees hoe Brabantschoon omgaat met uw persoonsgegevens bij een offerteaanvraag of samenwerking.", "privacy.html", base, "", privacy))

    voorwaarden = f"""
  {page_hero("Juridisch", "Algemene voorwaarden.", "De voorwaarden die van toepassing zijn op onze dienstverlening.", base, "Algemene voorwaarden")}
  <section><div class="wrap-narrow prose reveal">
    <h2>1. Toepasselijkheid</h2>
    <p>Deze algemene voorwaarden zijn van toepassing op alle offertes, aanbiedingen en overeenkomsten van Brabantschoon (KvK {KVK}), met zowel zakelijke opdrachtgevers (waaronder VvE's en organisaties) als particuliere klanten. Bij particuliere klanten gelden aanvullend de bepalingen van dwingend Nederlands consumentenrecht; waar deze voorwaarden daarvan zouden afwijken, gaat het consumentenrecht voor.</p>

    <h2>2. Offertes en prijsopgaven</h2>
    <p>Offertes van Brabantschoon zijn vrijblijvend, tenzij uitdrukkelijk anders vermeld, en gebaseerd op de door u verstrekte informatie. Getoonde prijsindicaties op de website zijn richtprijzen; de definitieve prijs wordt bevestigd nadat wij uw situatie hebben beoordeeld. Vermelde prijzen zijn inclusief btw, tenzij anders aangegeven.</p>

    <h2>3. Totstandkoming van de opdracht</h2>
    <p>Een opdracht komt tot stand zodra u akkoord gaat met de offerte, hetzij schriftelijk, hetzij per e-mail of op een andere door Brabantschoon aangeboden wijze.</p>

    <h2>4. Uitvoering van de werkzaamheden</h2>
    <p>Brabantschoon voert de overeengekomen werkzaamheden zorgvuldig en vakkundig uit, binnen de afgesproken frequentie en op de afgesproken locatie. Waar redelijkerwijs mogelijk houden wij rekening met specifieke wensen die vooraf zijn aangegeven.</p>

    <h2>5. Toegang tot de locatie</h2>
    <p>Opdrachtgever zorgt ervoor dat onze medewerkers op de afgesproken tijden toegang hebben tot de locatie en tot eventueel benodigde voorzieningen (zoals stroom en water), tenzij anders overeengekomen.</p>

    <h2>6. Verplichtingen van de opdrachtgever</h2>
    <p>Opdrachtgever verstrekt tijdig alle informatie die redelijkerwijs nodig is voor een goede uitvoering van de werkzaamheden, waaronder bijzonderheden over de locatie of het te reinigen oppervlak die van invloed kunnen zijn op de werkzaamheden of de prijs.</p>

    <h2>7. Wijzigingen en meerwerk</h2>
    <p>Wijzigingen in de opdracht, of werkzaamheden die buiten de oorspronkelijke offerte vallen, worden vooraf met u besproken. Meerwerk wordt pas uitgevoerd en in rekening gebracht na overleg.</p>

    <h2>8. Prijzen en btw</h2>
    <p>Alle door Brabantschoon aan particuliere klanten getoonde prijzen zijn inclusief btw. Prijzen aan zakelijke opdrachtgevers kunnen exclusief btw worden vermeld; dit wordt in de offerte duidelijk aangegeven.</p>

    <h2>9. Betaling</h2>
    <p>Betaling vindt plaats op de wijze en binnen de termijn zoals vermeld op de factuur of zoals vooraf overeengekomen. <em>[Ondernemersbeslissing nodig: de exacte betalingstermijn en betaalwijze(n) \u2014 bijvoorbeeld vooraf, na uitvoering, of via een vast maandbedrag bij periodieke schoonmaak \u2014 zijn nog niet vastgelegd. Vul dit aan zodra dit intern is bepaald.]</em></p>

    <h2>10. Annulering of verplaatsing</h2>
    <p>Wilt u een geplande schoonmaakbeurt annuleren of verplaatsen, neem dan zo tijdig mogelijk contact met ons op. <em>[Ondernemersbeslissing nodig: een exacte annuleringstermijn is nog niet vastgesteld. Vul dit aan met de door Brabantschoon gewenste termijn, bijvoorbeeld "minimaal 24 of 48 uur van tevoren"; houd bij particuliere klanten rekening met eventueel geldend herroepingsrecht.]</em></p>

    <h2>11. Situaties waarin werkzaamheden niet kunnen worden uitgevoerd</h2>
    <p>Brabantschoon behoudt zich het recht voor werkzaamheden geheel of gedeeltelijk niet uit te voeren, of alleen tegen een aangepaste prijs, wanneer de situatie ter plaatse afwijkt van wat is afgesproken, of wanneer veilige en redelijke uitvoering niet mogelijk is \u2014 bijvoorbeeld bij niet eerder gemelde, hardnekkige verontreiniging of bouwresten, of bij een onveilige of onbereikbare situatie. Wij nemen in dat geval eerst contact met u op.</p>

    <h2>12. Aansprakelijkheid</h2>
    <p>Brabantschoon is aansprakelijk voor schade die het rechtstreekse gevolg is van een toerekenbare tekortkoming in de uitvoering van de werkzaamheden, binnen de grenzen van de wet en tot het bedrag dat in het voorkomende geval door onze aansprakelijkheidsverzekering wordt uitgekeerd. Voor particuliere klanten laat dit onverlet de aansprakelijkheid die op grond van dwingend consumentenrecht niet kan worden beperkt of uitgesloten.</p>

    <h2>13. Klachten</h2>
    <p>Bent u niet tevreden over de uitgevoerde werkzaamheden, meld dit dan zo snel mogelijk, en in ieder geval binnen een redelijke termijn, via {EMAIL} of {PHONE_DISPLAY}. Wij nemen uw klacht serieus en zoeken samen met u naar een passende oplossing.</p>

    <h2>14. Overmacht</h2>
    <p>In geval van overmacht \u2014 een omstandigheid die uitvoering van de opdracht redelijkerwijs verhindert en niet aan Brabantschoon is toe te rekenen \u2014 wordt de uitvoering van de werkzaamheden opgeschort voor de duur van de overmachtsituatie, zonder dat dit tot schadeplichtigheid van Brabantschoon leidt.</p>

    <h2>15. Toepasselijk recht</h2>
    <p>Op alle overeenkomsten tussen Brabantschoon en haar opdrachtgevers is Nederlands recht van toepassing.</p>

    <h2>16. Contact</h2>
    <p>Vragen over deze voorwaarden? Neem contact op via {EMAIL} of {PHONE_DISPLAY}.</p>

    <p class="prose" style="font-size:13px; color:var(--ink-soft); margin-top:24px;">Laatst bijgewerkt: augustus 2026. Dit is geen juridisch advies; laat deze voorwaarden \u2014 met name de onderdelen die hierboven als ondernemersbeslissing zijn gemarkeerd \u2014 controleren door een juridisch adviseur voordat u ze definitief vaststelt.</p>
  </div></section>
"""
    write("voorwaarden.html", page_shell("Algemene voorwaarden | Brabantschoon", "De algemene voorwaarden die gelden voor offertes en opdrachten bij Brabantschoon.", "voorwaarden.html", base, "", voorwaarden))

    cookies = f"""
  {page_hero("Juridisch", "Cookiebeleid.", "Welke cookies en externe diensten deze website gebruikt.", base, "Cookiebeleid")}
  <section><div class="wrap-narrow prose reveal">
    <h2>Welke cookies gebruikt deze website?</h2>
    <p>Deze website gebruikt alleen strikt noodzakelijke, functionele cookies/opslag om goed te werken (bijvoorbeeld om uw cookievoorkeur te onthouden). Daarnaast gebruiken we, uitsluitend met uw toestemming, Google Analytics om te meten hoe bezoekers de website gebruiken. Analytics wordt pas geladen nadat u hier via de cookiemelding expliciet toestemming voor geeft \u2014 zonder toestemming worden er geen Analytics-cookies geplaatst.</p>
    <h2>Uw voorkeur wijzigen</h2>
    <p>U kunt uw cookievoorkeur op elk moment wijzigen via de link "Cookievoorkeuren wijzigen" onderaan iedere pagina.</p>
    <h2>Google Analytics</h2>
    <p>Bij toestemming gebruiken we Google Analytics 4 om geanonimiseerde statistieken te verzamelen over websitebezoek, zoals bezochte pagina's en algemene herkomst van bezoekers. Deze gegevens worden verwerkt door Google conform het eigen privacybeleid van Google.</p>
    <h2>Google Maps</h2>
    <p>Op de contactpagina kunt u desgewenst een kaart van Google Maps laden om onze locatie te bekijken. Deze kaart wordt niet automatisch geladen: pas wanneer u zelf op "Kaart laden" klikt, wordt de iframe van Google ingeladen. Voor die klik worden er geen gegevens met Google gedeeld via deze kaart. Zodra u de kaart laadt, kan Google gegevens verzamelen conform het eigen privacybeleid van Google.</p>
    <h2>Google Reviews (Elfsight)</h2>
    <p>Op de homepage tonen we onze Google-beoordelingen via een widget van Elfsight. Elfsight kan hierbij cookies of vergelijkbare technieken plaatsen, conform het eigen privacybeleid van Elfsight.</p>
    <h2>Offerte- en contactformulieren</h2>
    <p>Het offerteformulier en het terugbelformulier worden verwerkt via een externe formulierdienst, die de inhoud van uw aanvraag per e-mail aan ons doorstuurt. Zie onze <a href="{base}privacy.html" style="color:var(--link); font-weight:600;">privacyverklaring</a> voor meer informatie over hoe wij met uw gegevens omgaan.</p>
    <h2>Vragen</h2>
    <p>Vragen over dit cookiebeleid? Neem contact op via {EMAIL}.</p>
    <p class="prose" style="font-size:13px; color:var(--ink-soft); margin-top:24px;">Laatst bijgewerkt: augustus 2026.</p>
  </div></section>
"""
    write("cookiebeleid.html", page_shell("Cookiebeleid | Brabantschoon", "Lees welke cookies en externe diensten, zoals Google Maps, Brabantschoon.nl gebruikt en waarom.", "cookiebeleid.html", base, "", cookies))

# =================================================================
# SEO FILES
# =================================================================
def build_seo_files():
    import datetime
    today = datetime.date.today().isoformat()
    urls = [
        ("", "1.0"), ("diensten.html", "0.9"), ("zakelijke-schoonmaak.html", "0.9"), ("schoonmaak-particulieren.html", "0.9"), ("werkgebied.html", "0.9"),
        ("over-ons.html", "0.7"), ("contact.html", "0.8"), ("offerte.html", "0.9"),
        ("privacy.html", "0.3"), ("voorwaarden.html", "0.3"), ("cookiebeleid.html", "0.3"),
    ]
    urls += [(f"diensten/{s['slug']}.html", "0.8") for s in SERVICES]
    urls += [(p["filename"], "0.8") for p in PARTICULIER_PAGES]
    urls += [(f"schoonmaakbedrijf-{loc['slug']}.html", "0.8") for loc in LOCATIONS]
    urls += [(f"schoonmaakbedrijf-{k['slug']}.html", "0.85") for k in KERNGEBIED]
    entries = "\n  ".join(
        f"<url><loc>{SITE_URL}/{u}</loc><lastmod>{today}</lastmod><changefreq>monthly</changefreq><priority>{p}</priority></url>"
        for u, p in urls
    )
    write("sitemap.xml", f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  {entries}\n</urlset>\n')
    write("robots.txt", f"User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}/sitemap.xml\n")

# =================================================================
if __name__ == "__main__":
    build_home()
    build_diensten_overview()
    build_service_pages()
    build_zakelijke_pagina()
    build_particulieren_page()
    build_particulier_detail_pages()
    build_over_ons()
    build_werkgebied()
    build_kerngebied_pages()
    build_location_pages()
    build_contact()
    build_offerte()
    build_thanks()
    build_legal()
    build_seo_files()
    print("\nKlaar.")
