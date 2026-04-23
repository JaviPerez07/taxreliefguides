# State Pages Report: TaxReliefGuides

Date: April 23, 2026  
Scope: Block 2 only. Added a generated `/states/` hub and 10 state tax relief pages from generator/source data. No commit or push performed.

## Pages Created

| State | Slug | URL | Word count |
|---|---|---|---:|
| California | `california-state-tax-relief` | `https://taxreliefguides.com/states/california-state-tax-relief` | 3,220 |
| Texas | `texas-state-tax-relief` | `https://taxreliefguides.com/states/texas-state-tax-relief` | 3,113 |
| Florida | `florida-state-tax-relief` | `https://taxreliefguides.com/states/florida-state-tax-relief` | 3,188 |
| New York | `new-york-state-tax-relief` | `https://taxreliefguides.com/states/new-york-state-tax-relief` | 3,172 |
| Pennsylvania | `pennsylvania-state-tax-relief` | `https://taxreliefguides.com/states/pennsylvania-state-tax-relief` | 3,095 |
| Illinois | `illinois-state-tax-relief` | `https://taxreliefguides.com/states/illinois-state-tax-relief` | 3,129 |
| Ohio | `ohio-state-tax-relief` | `https://taxreliefguides.com/states/ohio-state-tax-relief` | 2,966 |
| Georgia | `georgia-state-tax-relief` | `https://taxreliefguides.com/states/georgia-state-tax-relief` | 3,044 |
| North Carolina | `north-carolina-state-tax-relief` | `https://taxreliefguides.com/states/north-carolina-state-tax-relief` | 2,995 |
| Michigan | `michigan-state-tax-relief` | `https://taxreliefguides.com/states/michigan-state-tax-relief` | 3,077 |

Hub created:

| Page | URL | Word count |
|---|---|---:|
| State Tax Relief Guides by U.S. State | `https://taxreliefguides.com/states/` | 1,329 |

## Generator / Source Changes

| File | Purpose |
|---|---|
| `scripts/state-tax-relief-data.mjs` | New source data file with state agencies, program tables, official links, forms, phone references, placeholders, and neighboring-state links |
| `scripts/generate-site.mjs` | Imports state data, renders state pages with static Article + BreadcrumbList + FAQPage JSON-LD, creates `/states/` hub, adds nav/footer links, adds homepage state grid, updates sitemap/redirect handling |
| `index.html` | Regenerated with state guide cards linking to all 10 state pages |
| `states/index.html` | Generated state hub |
| `states/*.html` | Generated 10 state guides |
| `sitemap.xml` | Regenerated with `/states/` and all 10 state URLs |
| `_redirects` | Regenerated with `/states/index.html -> /states/` and `.html -> extensionless` redirects for state pages |

## Official Data Extracted

| State | Agency | Official source URL | Payment/OIC form or process | Statute of limitations | Garnishment / levy detail |
|---|---|---|---|---|---|
| California | California Franchise Tax Board | `https://www.ftb.ca.gov/` | FTB payment plan, FTB 3567; FTB OIC package and FTB 4045 references | `DATO PENDIENTE VERIFICAR` | FTB Earnings Withholding Order for Taxes, FTB 2905; employer copy/payment timing described on FTB wage garnishment page |
| Texas | Texas Comptroller of Public Accounts | `https://comptroller.texas.gov/taxes/` | VDA request can include payment agreement; franchise forfeiture notices/forms referenced by Comptroller | `DATO PENDIENTE VERIFICAR` | `DATO PENDIENTE VERIFICAR` for wage garnishment/levy limits |
| Florida | Florida Department of Revenue | `https://floridarevenue.com/taxes/Pages/default.aspx` | Stipulated payment agreement; VDA; property deferral Form DR-570 | VDA lookback generally three years for eligible disclosures; normal collection SoL `DATO PENDIENTE VERIFICAR` | `DATO PENDIENTE VERIFICAR` for wage garnishment limit |
| New York | New York State Department of Taxation and Finance | `https://www.tax.ny.gov/` | IPA online for balance up to $20,000 and 36 payments; OIC forms DTF-4, DTF-4.1, DTF-5 | `DATO PENDIENTE VERIFICAR` | `DATO PENDIENTE VERIFICAR` for income execution percentage/limit |
| Pennsylvania | Pennsylvania Department of Revenue | `https://www.pa.gov/agencies/revenue.html` | myPATH standard PIT plan; REV-488/REV-484 for extended review; DBA-10 compromise request | `DATO PENDIENTE VERIFICAR` | `DATO PENDIENTE VERIFICAR` for wage garnishment/levy limits |
| Illinois | Illinois Department of Revenue | `https://tax.illinois.gov/` | MyTax payment plan; CPP-1; EG-13-I/EG-13-B over $15,000; BOA-1 for Board of Appeals compromise | VDP lookback no more than four years for approved disclosures | CPP-1 instructions mention levy of bank account or wages after default; exact limit not published in extracted data |
| Ohio | Ohio Department of Taxation / Ohio Attorney General | `https://tax.ohio.gov/` and `https://www.ohioattorneygeneral.gov/About-AG/Service-Divisions/Taxation` | Ohio AG OIC form for claims submitted for collection; contact AG Collections Enforcement for tax/debt payments | `DATO PENDIENTE VERIFICAR` | `DATO PENDIENTE VERIFICAR` for wage garnishment/levy limits |
| Georgia | Georgia Department of Revenue | `https://dor.georgia.gov/` | GA-9465 payment plan; OIC-1 plus CD-14B/CD-14C where required | `DATO PENDIENTE VERIFICAR` | `DATO PENDIENTE VERIFICAR` for wage garnishment limit |
| North Carolina | North Carolina Department of Revenue | `https://www.ncdor.gov/` | Payment plan through collections; OIC forms and OIC-101; RO-1033/RO-1062 referenced for payment/financial review | `DATO PENDIENTE VERIFICAR` | NCDOR publishes attachments/garnishments as forced collection actions; exact percentage not extracted |
| Michigan | Michigan Department of Treasury | `https://www.michigan.gov/treasury` | Form 990 installment agreement after assessment; Form 5181 series for OIC effective April 1, 2025 | `DATO PENDIENTE VERIFICAR` | OIC guidance says Treasury generally will not levy while eligible OIC pending except delay/jeopardy; exact garnishment limit not extracted |

## Placeholders Left Intentionally

These were left as HTML comments only where no clear official source was confirmed in this pass.

| State | Placeholder topics |
|---|---|
| California | State tax collection statute of limitations and tolling rules |
| Texas | Non-VDA minimum monthly payment, non-VDA max installment term, public OIC/compromise form, state collection SoL, wage garnishment/levy limit |
| Florida | Stipulated payment agreement max term, minimum monthly payment, wage garnishment limit |
| New York | State collection SoL, income execution percentage/limit |
| Pennsylvania | State collection SoL, wage garnishment/levy limit |
| Ohio | Minimum monthly payment, maximum payment-plan term, state collection SoL, wage garnishment/levy limit |
| Georgia | State collection SoL, wage garnishment limit |
| North Carolina | Minimum monthly payment, maximum installment term, state collection SoL |
| Michigan | Minimum monthly payment, maximum installment term, state collection SoL |

Total generated placeholder comments found in state output: present only as `<!-- DATO PENDIENTE VERIFICAR: ... -->`, not visible text.

## Internal Links Added

| Location | Links added |
|---|---|
| Header navigation | `State Relief` nav item to `/states/` |
| Footer Core Guides | `State Tax Relief Guides` link to `/states/` |
| Homepage | New `State Tax Relief Guides` grid linking to all 10 state pages |
| `/states/` hub | Grid cards linking to all 10 state pages |
| Each state page | Links to `/states/`, at least 3 neighboring/comparable state guides, IRS tax relief guide, tax debt guide, Offer in Compromise guide, and penalty abatement guide |

Verification:

```text
california: home=true hub=true
texas: home=true hub=true
florida: home=true hub=true
new-york: home=true hub=true
pennsylvania: home=true hub=true
illinois: home=true hub=true
ohio: home=true hub=true
georgia: home=true hub=true
north-carolina: home=true hub=true
michigan: home=true hub=true
```

## Sitemap Updated

Generated sitemap now includes:

```diff
+ https://taxreliefguides.com/states/
+ https://taxreliefguides.com/states/california-state-tax-relief
+ https://taxreliefguides.com/states/texas-state-tax-relief
+ https://taxreliefguides.com/states/florida-state-tax-relief
+ https://taxreliefguides.com/states/new-york-state-tax-relief
+ https://taxreliefguides.com/states/pennsylvania-state-tax-relief
+ https://taxreliefguides.com/states/illinois-state-tax-relief
+ https://taxreliefguides.com/states/ohio-state-tax-relief
+ https://taxreliefguides.com/states/georgia-state-tax-relief
+ https://taxreliefguides.com/states/north-carolina-state-tax-relief
+ https://taxreliefguides.com/states/michigan-state-tax-relief
```

All 10 state page entries use:

```text
<lastmod>2026-04-23</lastmod>
<changefreq>monthly</changefreq>
<priority>0.7</priority>
```

The `/states/` hub uses:

```text
<lastmod>2026-04-23</lastmod>
<priority>0.8</priority>
```

## Redirects Updated

Generated `_redirects` includes:

```text
/states/index.html /states/ 301
/states/california-state-tax-relief.html /states/california-state-tax-relief 301
/states/texas-state-tax-relief.html /states/texas-state-tax-relief 301
/states/florida-state-tax-relief.html /states/florida-state-tax-relief 301
/states/new-york-state-tax-relief.html /states/new-york-state-tax-relief 301
/states/pennsylvania-state-tax-relief.html /states/pennsylvania-state-tax-relief 301
/states/illinois-state-tax-relief.html /states/illinois-state-tax-relief 301
/states/ohio-state-tax-relief.html /states/ohio-state-tax-relief 301
/states/georgia-state-tax-relief.html /states/georgia-state-tax-relief 301
/states/north-carolina-state-tax-relief.html /states/north-carolina-state-tax-relief 301
/states/michigan-state-tax-relief.html /states/michigan-state-tax-relief 301
```

## Technical Verification

Build:

```text
node --check scripts/generate-site.mjs -> OK
node --check scripts/state-tax-relief-data.mjs -> OK
node scripts/generate-site.mjs -> generatedPages: 51, indexablePages: 48, totalWords: 121715, issues: 0
node scripts/build-search-console-expansion.mjs -> createdOrUpdatedPages: 20
```

Search Console audit:

```text
node scripts/search-console-audit.mjs -> totalIssues: 0
canonicalHtml/www/http/query: 0
sitemapHtml/www/http/query: 0
internalIndexHtml/publicHtml/www/http/query: 0
brokenLocalLinks: 0
missingAssets: 0
```

State page checks:

```text
state page checks OK
Each state page has exactly 3 JSON-LD scripts
Each state page has AdSense script in head
Each state page has Article + BreadcrumbList + FAQPage schema
Each state page has editorial block, disclaimer, related section, and clean canonical
```

Local nav:

```text
node scripts/verify-local-nav.mjs -> brokenLinks: 0, duplicateTitles: 0, duplicateDescriptions: 0, duplicateCanonicals: 0, structureIssues: 0, placeholderIssues: 0
```

Notes on verifier metadata warnings:

```text
Static JSON-LD warnings are expected for the 20 Search Console expansion pages and the 10 new state pages because prior/current requirements explicitly require static JSON-LD there.
Protocol/www warnings on state pages are from official external .gov URLs such as www.ftb.ca.gov, www.pa.gov, and www.ncdor.gov, not internal taxreliefguides.com URLs.
```

## Build Status

Status: OK.

STOP: Block 2 complete. Awaiting approval before commit or push.
