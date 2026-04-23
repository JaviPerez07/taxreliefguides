# Cleanup Report: TaxReliefGuides

Date: April 23, 2026  
Scope: Block 1 only, master E-E-A-T cleanup and audit. No state pages were created. No commit or push was performed.

## 1. Fictional Authors Removed

| Detected name / credential | Pre-cleanup location | Action |
|---|---|---|
| Maya R. Coleman, EA | `scripts/generate-site.mjs` site author object, author box, schema data payload | Removed individual author object, removed schema author payload, replaced rendered block with neutral editorial block |
| Rachel Morgan / IRS Tax Relief Specialist | `scripts/build-search-console-expansion.mjs` Article schema and author box | Removed Article `author`, removed credentialed reviewer block, replaced with neutral editorial block |
| Maya Ellison / Senior Personal Finance Editor | `build_creditcostguide.py` legacy generator author object, author box, static schema | Removed legacy author object, removed schema author, replaced author output with neutral editorial block |

Credentials removed from named-person context: `EA`, `IRS Tax Relief Specialist`, and `Senior Personal Finance Editor`.

Editorial replacement pattern used:

```html
<div class="editorial-block">
  <strong>Editorial Team</strong>
  <p>Last reviewed: April 2026</p>
  <p>This guide compiles information from official IRS publications, state Department of Revenue resources, and other public sources. Content is reviewed quarterly against updated references.</p>
</div>
```

Files modified for author cleanup: `scripts/generate-site.mjs`, `scripts/build-search-console-expansion.mjs`, `main.js`, `styles.css`, `build_creditcostguide.py`, and regenerated HTML output.

Blocks replaced by editorial team: 61 total generated/source matches after build.

Final verification, excluding this audit report because it intentionally documents removed strings:

```text
rg "Rachel Morgan|Maya Coleman|Maya Ellison|Maya R\. Coleman|IRS Tax Relief Specialist|author-box|author-avatar|Reviewed by|Written by" --glob '!cleanup-report-taxreliefguides.md' -> 0 active cleanup-target matches
```

Generic mentions of `CPA`, `enrolled agent`, and `tax attorney` remain in educational text where they describe legitimate professional categories, not invented site authors.

## 2. Email

Pre-cleanup target searched:

```text
focuslocalaiagency
focuslocalai
focus local ai agency
focuslocalaiagency@gmail.com
```

Result: no active occurrences remained in current source/output when checked in this pass.

Action taken: `javiperezguides@gmail.com` is now the project contact email in the generators and schema payloads.

Files modified: `scripts/generate-site.mjs`, `scripts/build-search-console-expansion.mjs`, regenerated HTML output.

Contact page status: contact schema and rendered page include the updated email via generated schema payload. No empty contact placeholder was needed.

Final grep:

```text
rg "focuslocalai|focus local ai agency|focuslocalaiagency@gmail.com" --glob '!cleanup-report-taxreliefguides.md' -> 0
rg "javiperezguides@gmail.com" -> present in generator constants, contact/legal schema payloads, and generated article schema payloads
```

## 3. Fictional Phone Numbers

Detected in active source/output: No.

Searched patterns:

```text
+1 (202) 555-0148
202-555-0148
555-01XX
```

Final grep:

```text
rg "555-01|555-0148|202-555-0148|\+1 \(202\) 555-0148" --glob '!cleanup-report-taxreliefguides.md' -> 0
```

## 4. Signaling / Monetization Phrases Removed

| Phrase / signal | Pre-cleanup location | Action |
|---|---|---|
| Built for U.S. intent | `scripts/generate-site.mjs` home visual trust-style dashboard note | Removed the dashboard note block from generator |
| trust signals | `scripts/generate-site.mjs` guide copy | Reworded to `source clarity` |
| strong monetization value | `scripts/build-search-console-expansion.mjs` small business credits copy | Reworded to reader-first eligibility and recordkeeping language |

Final grep, excluding this report:

```text
rg "AdSense-ready|Prepared for AdSense|AdSense implementation|AdSense ready|Built to scale|Search Console ready|Cloudflare-ready build|Prepared for Cloudflare Pages|monetization value" --glob '!cleanup-report-taxreliefguides.md' -> 0
```

## 5. Broken Social Links

Broken social icon/link patterns searched:

```text
href="#"
href=""
Twitter/X, Facebook, LinkedIn, Instagram, YouTube icon contexts
```

Result: no active broken social icon blocks were found. No social icons were removed.

Residual non-actionable matches:

```text
scripts/generate-site.mjs: walkthrough checklist text mentions href="#"
scripts/verify-local-nav.mjs: verification regex checks href="#"
```

These are not rendered social links.

## 6. Content Bugs

Literal `undefined` in public HTML/source: none found.

Meta descriptions with truncation or weak endings detected:

| File | Length | Meta description |
|---|---:|---|
| `pages/how-to-file-back-taxes.html` | 155 | Get practical guidance on file back taxes, compare costs and tradeoffs, and understand the records or timelines that matter before you file, negotiate, or. |
| `pages/how-to-lower-taxable-income.html` | 160 | Get practical guidance on lower taxable income, compare costs and tradeoffs, and understand the records or timelines that matter before you file, negotiate, or. |
| `pages/payroll-tax-guide.html` | 151 | Learn how payroll taxes work, what employers must withhold and deposit, and why payroll mistakes can become some of the highest-stakes tax problems in. |
| `pages/tax-debt-forgiveness-options.html` | 160 | Get practical guidance on tax debt forgiveness, compare costs and tradeoffs, and understand the records or timelines that matter before you file, negotiate, or. |
| `pages/what-is-offer-in-compromise.html` | 159 | Get practical guidance on offer in compromise, compare costs and tradeoffs, and understand the records or timelines that matter before you file, negotiate, or. |
| `pages/when-to-hire-a-tax-attorney.html` | 159 | Get practical guidance on hire a tax attorney, compare costs and tradeoffs, and understand the records or timelines that matter before you file, negotiate, or. |

Generator source marked for manual review:

```text
scripts/generate-site.mjs support-page template now includes:
<!-- REVISAR MANUALMENTE: meta descriptions generated from this support-page template can truncate awkwardly and should be rewritten with page-specific data. -->
```

Years `2024` and `2025`: many active 2025/2026 tax references remain and were not rewritten per instruction. See outdated-data audit below.

## 7. Template Meta Descriptions Detected

Detected pattern count: 19 pages.

Common pattern source: `scripts/generate-site.mjs`, support-page template around the `Get practical guidance on ... compare costs and tradeoffs ...` hero/description seed.

| URL / File | Pattern detected | Meta actual |
|---|---|---|
| `pages/best-states-for-low-taxes.html` | Get practical guidance on; compare costs and tradeoffs | Get practical guidance on best states for low taxes, compare costs and tradeoffs, and understand the records or timelines that matter before you file. |
| `pages/best-tax-software-for-small-business.html` | Get practical guidance on; compare costs and tradeoffs | Get practical guidance on best tax software for small business, compare costs and tradeoffs, and understand the records or timelines that matter before you. |
| `pages/common-tax-deductions-for-small-businesses.html` | Get practical guidance on; compare costs and tradeoffs | Get practical guidance on small-business tax deductions, compare costs and tradeoffs, and understand the records or timelines that matter before you file. |
| `pages/estimated-tax-payments-guide.html` | Get practical guidance on; compare costs and tradeoffs | Get practical guidance on estimated tax payments, compare costs and tradeoffs, and understand the records or timelines that matter before you file, negotiate. |
| `pages/home-office-deduction-guide.html` | Get practical guidance on; compare costs and tradeoffs | Get practical guidance on home office deduction, compare costs and tradeoffs, and understand the records or timelines that matter before you file, negotiate. |
| `pages/how-payroll-taxes-work.html` | Get practical guidance on; compare costs and tradeoffs | Get practical guidance on how payroll taxes work, compare costs and tradeoffs, and understand the records or timelines that matter before you file, negotiate. |
| `pages/how-to-file-back-taxes.html` | Get practical guidance on; compare costs and tradeoffs | Get practical guidance on file back taxes, compare costs and tradeoffs, and understand the records or timelines that matter before you file, negotiate, or. |
| `pages/how-to-lower-taxable-income.html` | Get practical guidance on; compare costs and tradeoffs | Get practical guidance on lower taxable income, compare costs and tradeoffs, and understand the records or timelines that matter before you file, negotiate, or. |
| `pages/how-to-set-up-an-irs-payment-plan.html` | Get practical guidance on; compare costs and tradeoffs | Get practical guidance on set up an IRS payment plan, compare costs and tradeoffs, and understand the records or timelines that matter before you file. |
| `pages/how-to-stop-irs-wage-garnishment.html` | Get practical guidance on; compare costs and tradeoffs | Get practical guidance on stop IRS wage garnishment, compare costs and tradeoffs, and understand the records or timelines that matter before you file. |
| `pages/irs-penalties-explained.html` | Get practical guidance on; compare costs and tradeoffs | Get practical guidance on IRS penalties, compare costs and tradeoffs, and understand the records or timelines that matter before you file, negotiate, or change. |
| `pages/section-179-deduction-guide.html` | Get practical guidance on; compare costs and tradeoffs | Get practical guidance on Section 179 deduction, compare costs and tradeoffs, and understand the records or timelines that matter before you file, negotiate. |
| `pages/self-employed-tax-deductions.html` | Get practical guidance on; compare costs and tradeoffs | Get practical guidance on self-employed tax deductions, compare costs and tradeoffs, and understand the records or timelines that matter before you file. |
| `pages/tax-audit-guide.html` | Get practical guidance on; compare costs and tradeoffs | Get practical guidance on tax audit, compare costs and tradeoffs, and understand the records or timelines that matter before you file, negotiate, or change. |
| `pages/tax-credits-vs-tax-deductions.html` | Get practical guidance on; compare costs and tradeoffs | Get practical guidance on tax credits vs tax deductions, compare costs and tradeoffs, and understand the records or timelines that matter before you file. |
| `pages/tax-debt-forgiveness-options.html` | Get practical guidance on; compare costs and tradeoffs | Get practical guidance on tax debt forgiveness, compare costs and tradeoffs, and understand the records or timelines that matter before you file, negotiate, or. |
| `pages/what-happens-if-you-dont-pay-taxes.html` | Get practical guidance on; compare costs and tradeoffs | Get practical guidance on what happens if you don't pay taxes, compare costs and tradeoffs, and understand the records or timelines that matter before you. |
| `pages/what-is-offer-in-compromise.html` | Get practical guidance on; compare costs and tradeoffs | Get practical guidance on offer in compromise, compare costs and tradeoffs, and understand the records or timelines that matter before you file, negotiate, or. |
| `pages/when-to-hire-a-tax-attorney.html` | Get practical guidance on; compare costs and tradeoffs | Get practical guidance on hire a tax attorney, compare costs and tradeoffs, and understand the records or timelines that matter before you file, negotiate, or. |

## 8. Outdated / Year-Sensitive Data Audit

Status: reported only, not rewritten.

The grep returned 799 suspect lines across active HTML and generator source, mostly because many pages intentionally discuss 2025 and 2025-2026 IRS values. Below is the prioritized sample of active values that should be manually verified against official 2026 sources.

| File | Line | Current value | Data type | Suggested official source |
|---|---:|---|---|---|
| `scripts/build-search-console-expansion.mjs` | 499 | 2025 credits can still create a refund | Tax credit year | IRS credits and deductions pages |
| `scripts/build-search-console-expansion.mjs` | 513 | $2,200 2025 Child Tax Credit | Child Tax Credit amount | IRS Child Tax Credit / Publication 972 successor guidance |
| `scripts/build-search-console-expansion.mjs` | 515 | $8,046 2025 maximum EITC | EITC amount | IRS EITC tables |
| `scripts/build-search-console-expansion.mjs` | 560 | $8,046 Max 2025 EITC | EITC amount | IRS EITC tables |
| `scripts/build-search-console-expansion.mjs` | 561 | $2,200 2025 CTC headline amount | Child Tax Credit amount | IRS Child Tax Credit guidance |
| `scripts/build-search-console-expansion.mjs` | 567 | $11,950 investment income limit | EITC investment income limit | IRS EITC income limits |
| `scripts/build-search-console-expansion.mjs` | 593 | 2025 Earned Income Tax Credit amounts | EITC year | IRS EITC tables |
| `scripts/build-search-console-expansion.mjs` | 607 | $649 2025 max EITC with no child | EITC amount | IRS EITC tables |
| `scripts/build-search-console-expansion.mjs` | 608 | $4,328 2025 max EITC with one child | EITC amount | IRS EITC tables |
| `scripts/build-search-console-expansion.mjs` | 609 | $7,152 2025 max EITC with two children | EITC amount | IRS EITC tables |
| `scripts/build-search-console-expansion.mjs` | 610 | $8,046 2025 max EITC with three or more children | EITC amount | IRS EITC tables |
| `scripts/build-search-console-expansion.mjs` | 617 | $11,950 for tax year 2025 | EITC investment income limit | IRS EITC income limits |
| `scripts/build-search-console-expansion.mjs` | 638 | Child Tax Credit Guide for 2025 | Credit year | IRS Child Tax Credit guidance |
| `scripts/build-search-console-expansion.mjs` | 645 | $2,200 per qualifying child for 2025 | Child Tax Credit amount | IRS Child Tax Credit guidance |
| `scripts/build-search-console-expansion.mjs` | 708 | WOTC begin work on or before Dec. 31, 2025 | WOTC deadline | IRS Work Opportunity Tax Credit guidance |
| `scripts/build-search-console-expansion.mjs` | 920 | Self-Employed Tax Guide for 2025 | Tax year | IRS self-employment tax publications |
| `scripts/generate-site.mjs` | 1268 | wage base, phaseout, deposit penalty tier, or application fee | Year-sensitive generated copy | IRS publications and revenue procedures |
| `pages/payroll-tax-penalties.html` | 143 | 2%, 5%, 10%, 15% deposit penalty tiers | IRS penalty rates | IRS Failure to Deposit Penalty page |
| `pages/tax-lien-guide.html` | 217 | lien release within 30 days | IRS lien process timing | IRS federal tax lien release/withdrawal guidance |
| `pages/small-business-payroll-taxes.html` | 143 | $184,500 Social Security wage base for 2026 | Payroll wage base | SSA contribution and benefit base / IRS payroll guidance |

Recommendation: the next data-specific pass should verify these against IRS.gov, SSA.gov, and current IRS revenue procedures before updating copy.

## 9. Redirect Check

Commands requested were run with `curl -I -L` against production.

| URL | Observed result | Redirect count assessment |
|---|---|---|
| `https://taxreliefguides.com/` | HTTP/2 200 | OK, no visible redirect chain |
| `https://taxreliefguides.com/contact` | HTTP/2 200 | OK, no visible redirect chain |
| `https://taxreliefguides.com/about` | HTTP/2 200 | OK, no visible redirect chain |
| `https://taxreliefguides.com/privacy-policy` | HTTP/2 200 | OK, no visible redirect chain |
| `https://taxreliefguides.com/terms` | HTTP/2 200 | OK, no visible redirect chain |
| `https://taxreliefguides.com/disclaimer` | HTTP/2 200 | OK, no visible redirect chain |
| `https://taxreliefguides.com/how-we-research` | HTTP/2 200 | OK, no visible redirect chain |
| `https://www.taxreliefguides.com/` | HTTP/2 200 | Potential production redirect issue: local `_redirects` has `www` to non-www 301, but production returned 200 directly during this check |

No loops, 404, or 500 responses were observed in the successful `curl -I -L` runs.

Note: a later structured `curl -w` retry returned DNS code `000` in this environment, while the earlier `curl -I -L` requests succeeded. The table above uses the successful header checks.

## 10. Technical Verification

Build commands:

```text
node --check scripts/generate-site.mjs -> OK
node --check scripts/build-search-console-expansion.mjs -> OK
node scripts/generate-site.mjs -> {"generatedPages":40,"indexablePages":37,"totalWords":89003,"issues":0}
node scripts/build-search-console-expansion.mjs -> {"createdOrUpdatedPages":20}
```

Local navigation:

```text
node scripts/verify-local-nav.mjs
filesChecked: 58
duplicateTitles: 0
duplicateDescriptions: 0
duplicateCanonicals: 0
brokenLinks: 0
structureIssues: 0
placeholderIssues: 0
metadataIssues: 20 static JSON-LD notices on Search Console expansion pages
```

Search Console canonical audit:

```text
node scripts/search-console-audit.mjs
totalIssues: 0
pagesScanned: 58
canonicalHtml/www/http/query: 0
sitemapHtml/www/http/query: 0
internalIndexHtml/publicHtml/www/http/query: 0
crawlableSearchUrls: 0
brokenLocalLinks: 0
missingAssets: 0
redirectIssues: 0
headerIssues: 0
```

Domain migration verifier:

```text
node scripts/verify-domain-migration.mjs
oldDomainReferences: 0
brokenLocalLinks: 0
missingAssets: 0
localNavigationIssues: 0
seoIssues: 40
```

The 40 SEO warnings are confined to the 20 Search Console expansion pages where that legacy verifier expects dynamic `data-schema` and `twitter:url`; those pages intentionally use static JSON-LD from a previous requirement. I did not alter this because it is outside the cleanup scope.

AdSense check:

```text
grep -rL "pagead2.googlesyndication.com" . --include="*.html" -> 0 missing HTML files
```

Dynamic AdSense injection check:

```text
grep -rn "createElement.*script\|ADSENSE\|adsScript" . --include="*.js" --include="*.mjs"
./main.js:95: const script = document.createElement("script");
```

The `main.js` match is schema injection, not AdSense injection.

Product schema:

```text
grep -rn '"Product"' . --include="*.html" -> 0
```

Noindex:

```text
grep -rn "noindex" . --include="*.html" | grep -v "404"
```

Expected legal-page matches remain on `privacy-policy.html`, `terms.html`, and `disclaimer.html`. Additional textual FAQ mentions of `noindex` appear on institutional/legal pages. No article pages were changed to `noindex`.

Canonicals:

```text
Canonical value audit -> 0 canonicals with .html, www, http, or query parameters.
```

JSON-LD:

```text
grep -rLn 'application/ld+json' . --include="*.html"
```

This lists generator-driven pages because they use dynamic schema via `main.js`, and does not indicate missing runtime schema. The Search Console expansion pages contain static JSON-LD by prior requirement.

Files without extension:

```text
find . -maxdepth 3 -type f ! -name "*.*" ! -path "*/.git/*" ! -name "_headers" ! -name "_redirects" ! -name "CNAME" -> 0
```

Short pages:

```text
All HTML files are >= 3000 bytes.
```

`ads.txt`:

```text
google.com, pub-3733223915347669, DIRECT, f08c47fec0942fa0
```

`robots.txt`:

```text
User-agent: *
Allow: /
Disallow: /404.html
Disallow: /*?q=*
Disallow: /*?s=*
Sitemap: https://taxreliefguides.com/sitemap.xml
```

`_redirects` summary:

```text
http://taxreliefguides.com/* -> https://taxreliefguides.com/:splat 301
http://www.taxreliefguides.com/* -> https://taxreliefguides.com/:splat 301
https://www.taxreliefguides.com/* -> https://taxreliefguides.com/:splat 301
/index.html -> / 301
root .html legal/institutional pages -> extensionless 301
core page .html routes -> extensionless 301
```

`_headers` summary:

```text
Strict-Transport-Security enabled
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
/index.html: X-Robots-Tag noindex, nofollow
/*.html: X-Robots-Tag noindex
```

## 11. Build Status

Status: OK.

Final active-source verification, excluding this report file:

```text
focuslocalai -> 0
AdSense-ready -> 0
Built to scale -> 0
555-01 -> 0
Rachel Morgan -> 0
Maya Coleman -> 0
Maya Ellison -> 0
Maya R. Coleman -> 0
IRS Tax Relief Specialist -> 0
```

## Recommended Next Pass

Priority 1: manually rewrite the 19 templated meta descriptions with page-specific data and remove awkward truncations.

Priority 2: verify 2025 and 2025-2026 tax amounts against IRS.gov/SSA.gov before updating values.

Priority 3: investigate production `https://www.taxreliefguides.com/` because local `_redirects` is correct but the live header check returned 200 instead of a visible non-www redirect.

STOP: Block 1 complete. Awaiting approval before Block 2 state pages or any commit/push.
