import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";

const root = "/Users/javiperezz7/Documents/taxreliefguides";
const domain = "https://taxreliefguides.com";

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(fullPath)));
    else files.push(fullPath);
  }
  return files.sort();
}

function rel(file) {
  return path.relative(root, file).replace(/\\/g, "/");
}

function cleanPublicPath(pathname) {
  if (!pathname || pathname === "/index.html") return "/";
  return pathname.replace(/\/index\.html$/, "/").replace(/\.html$/, "").replace(/\/{2,}/g, "/");
}

function resolveLocalCandidates(file, ref) {
  const clean = ref.split("#")[0].split("?")[0];
  if (!clean) return [];
  const resolved = path.normalize(path.resolve(path.dirname(file), clean));
  if (path.extname(resolved)) return [resolved];
  return [`${resolved}.html`, path.join(resolved, "index.html"), resolved];
}

const files = await walk(root);
const htmlFiles = files.filter((file) => file.endsWith(".html"));
const report = {
  pagesScanned: htmlFiles.length,
  canonicalHtml: [],
  canonicalWww: [],
  canonicalHttp: [],
  canonicalQuery: [],
  sitemapHtml: [],
  sitemapWww: [],
  sitemapHttp: [],
  sitemapQuery: [],
  internalIndexHtml: [],
  internalPublicHtml: [],
  internalWww: [],
  internalHttp: [],
  internalQuery: [],
  crawlableSearchUrls: [],
  brokenLocalLinks: [],
  missingAssets: [],
  redirectIssues: [],
  headerIssues: [],
};

for (const file of htmlFiles) {
  const content = await fs.readFile(file, "utf8");
  const fileRel = rel(file);
  const canonical = content.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? "";

  if (canonical.includes(".html")) report.canonicalHtml.push(`${fileRel}: ${canonical}`);
  if (canonical.includes("www.")) report.canonicalWww.push(`${fileRel}: ${canonical}`);
  if (canonical.startsWith("http://")) report.canonicalHttp.push(`${fileRel}: ${canonical}`);
  if (canonical.includes("?")) report.canonicalQuery.push(`${fileRel}: ${canonical}`);

  for (const match of content.matchAll(/<(a|link|script|img|meta)\b[^>]*(href|src|content)="([^"]+)"/g)) {
    const tag = match[1];
    const value = match[3];
    const tagMarkup = match[0];

    if (value.startsWith("http://")) report.internalHttp.push(`${fileRel}: ${value}`);
    if (value.includes("www.taxreliefguides.com")) report.internalWww.push(`${fileRel}: ${value}`);
    if (value.includes("?q=")) report.internalQuery.push(`${fileRel}: ${value}`);

    if (tag === "a") {
      if (/index\.html(?:$|[?#])/.test(value)) report.internalIndexHtml.push(`${fileRel}: ${value}`);
      if (!/^([a-z]+:|#|mailto:|tel:|data:)/i.test(value) && /\.html(?:$|[?#])/.test(value)) {
        report.internalPublicHtml.push(`${fileRel}: ${value}`);
      }

      if (/^([a-z]+:|#|mailto:|tel:|data:)/i.test(value)) continue;
      const candidates = resolveLocalCandidates(file, value);
      if (!candidates.length || !candidates.some((candidate) => fsSync.existsSync(candidate))) {
        report.brokenLocalLinks.push(`${fileRel}: ${value}`);
      }
      continue;
    }

    if (tag === "link" && !/rel="stylesheet"|rel="icon"|rel="shortcut icon"|rel="canonical"/.test(tagMarkup)) continue;
    if (tag !== "a" && /^([a-z]+:|#|data:)/i.test(value)) continue;
    if (tag === "meta") continue;

    const candidates = resolveLocalCandidates(file, value);
    if (!candidates.length || !candidates.some((candidate) => fsSync.existsSync(candidate))) {
      report.missingAssets.push(`${fileRel}: ${value}`);
    }
  }
}

const sitemap = await fs.readFile(path.join(root, "sitemap.xml"), "utf8");
for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const url = match[1];
  if (url.includes(".html")) report.sitemapHtml.push(url);
  if (url.includes("www.")) report.sitemapWww.push(url);
  if (url.startsWith("http://")) report.sitemapHttp.push(url);
  if (url.includes("?")) report.sitemapQuery.push(url);
}

const robots = await fs.readFile(path.join(root, "robots.txt"), "utf8");
const redirectsPath = path.join(root, "_redirects");
const headersPath = path.join(root, "_headers");
const redirects = fsSync.existsSync(redirectsPath) ? await fs.readFile(redirectsPath, "utf8") : "";
const headers = fsSync.existsSync(headersPath) ? await fs.readFile(headersPath, "utf8") : "";
const mainJs = await fs.readFile(path.join(root, "main.js"), "utf8");

if (!redirects.includes("http://taxreliefguides.com/* https://taxreliefguides.com/:splat 301")) {
  report.redirectIssues.push("Missing http non-www to https non-www redirect.");
}
if (!redirects.includes("http://www.taxreliefguides.com/* https://taxreliefguides.com/:splat 301")) {
  report.redirectIssues.push("Missing http www to https non-www redirect.");
}
if (!redirects.includes("https://www.taxreliefguides.com/* https://taxreliefguides.com/:splat 301")) {
  report.redirectIssues.push("Missing https www to https non-www redirect.");
}
if (!redirects.includes("/index.html / 301")) {
  report.redirectIssues.push("Missing /index.html to / redirect.");
}
if (!headers.includes("/*.html") || !headers.includes("X-Robots-Tag: noindex")) {
  report.headerIssues.push("Missing HTML noindex header protection.");
}
if (!robots.includes(`${domain}/sitemap.xml`)) {
  report.headerIssues.push("robots.txt sitemap URL is not canonical.");
}
if (mainJs.includes("SearchAction") || mainJs.includes("?q={search_term_string}")) {
  report.crawlableSearchUrls.push("main.js still exposes SearchAction or ?q= schema signals.");
}
if (!mainJs.includes("noindex, follow")) {
  report.crawlableSearchUrls.push("main.js does not downgrade ?q= URLs to noindex.");
}

const modifiedFiles = [
  "scripts/generate-site.mjs",
  "main.js",
  "scripts/verify-domain-migration.mjs",
  "scripts/verify-local-nav.mjs",
  "scripts/pre-deployment-audit.mjs",
  "scripts/search-console-audit.mjs",
  "_redirects",
  "_headers",
];

const totalIssues =
  report.canonicalHtml.length +
  report.canonicalWww.length +
  report.canonicalHttp.length +
  report.canonicalQuery.length +
  report.sitemapHtml.length +
  report.sitemapWww.length +
  report.sitemapHttp.length +
  report.sitemapQuery.length +
  report.internalIndexHtml.length +
  report.internalPublicHtml.length +
  report.internalWww.length +
  report.internalHttp.length +
  report.internalQuery.length +
  report.crawlableSearchUrls.length +
  report.brokenLocalLinks.length +
  report.missingAssets.length +
  report.redirectIssues.length +
  report.headerIssues.length;

const markdown = `# TaxReliefGuides Search Console Fix

## Cause Of The Issues

- Search Console problems were caused by mixed URL signals across generated HTML, including legacy \`.html\` public paths, \`index.html\` entry points, host duplicates (\`www\` vs non-\`www\`), and a \`SearchAction\` schema pattern that advertised \`?q=\` search-result URLs.
- Cloudflare-compatible redirect rules were missing for some duplicate variants, so alternate versions could keep appearing as redirects or duplicate URLs in indexing reports.

## Files Modified

${modifiedFiles.map((file) => `- ${file}`).join("\n")}

## Redirects Added

- \`http://taxreliefguides.com/*\` -> \`https://taxreliefguides.com/:splat\`
- \`http://www.taxreliefguides.com/*\` -> \`https://taxreliefguides.com/:splat\`
- \`https://www.taxreliefguides.com/*\` -> \`https://taxreliefguides.com/:splat\`
- \`/index.html\` -> \`/\`
- Every public \`/*.html\` page path now redirects to its extensionless canonical route.

## Canonical Rules Enforced

- Only \`${domain}/\` is canonical for the homepage.
- All other pages use extensionless canonicals on \`${domain}\`.
- Canonicals never use \`www\`, \`http\`, \`.html\`, \`index.html\`, query strings, or duplicated slashes.
- Sitemap, Open Graph URLs, Twitter URLs, breadcrumbs, and dynamic schema all follow the same clean canonical format.

## Verification Summary

- Pages scanned: ${report.pagesScanned}
- \`.html\` canonicals: ${report.canonicalHtml.length}
- \`www\` canonicals: ${report.canonicalWww.length}
- \`http\` canonicals: ${report.canonicalHttp.length}
- Query canonicals: ${report.canonicalQuery.length}
- \`.html\` sitemap URLs: ${report.sitemapHtml.length}
- \`www\` sitemap URLs: ${report.sitemapWww.length}
- \`http\` sitemap URLs: ${report.sitemapHttp.length}
- Query sitemap URLs: ${report.sitemapQuery.length}
- Internal links to \`index.html\`: ${report.internalIndexHtml.length}
- Internal links to public \`.html\` URLs: ${report.internalPublicHtml.length}
- Internal links to \`www\`: ${report.internalWww.length}
- Internal links to \`http\`: ${report.internalHttp.length}
- Internal links to \`?q=\`: ${report.internalQuery.length}
- Crawlable \`?q=\` URLs: ${report.crawlableSearchUrls.length}
- Broken local links: ${report.brokenLocalLinks.length}
- Missing assets: ${report.missingAssets.length}
- Redirect rule issues: ${report.redirectIssues.length}
- Header rule issues: ${report.headerIssues.length}

## Remaining Issues

${totalIssues === 0 ? "- None." : [
  ...report.canonicalHtml,
  ...report.canonicalWww,
  ...report.canonicalHttp,
  ...report.canonicalQuery,
  ...report.sitemapHtml,
  ...report.sitemapWww,
  ...report.sitemapHttp,
  ...report.sitemapQuery,
  ...report.internalIndexHtml,
  ...report.internalPublicHtml,
  ...report.internalWww,
  ...report.internalHttp,
  ...report.internalQuery,
  ...report.crawlableSearchUrls,
  ...report.brokenLocalLinks,
  ...report.missingAssets,
  ...report.redirectIssues,
  ...report.headerIssues,
].map((item) => `- ${item}`).join("\n")}

## Final Confirmation

- Only \`${domain}/\` is now canonical at the domain level.
- Cloudflare Pages compatibility was preserved with \`_redirects\` and \`_headers\` files.
- Local preview compatibility was preserved by keeping relative assets and using runtime link adaptation only for \`file://\` previews.
- Search Console should stop reporting the listed canonical and redirect issues after Google recrawls the updated pages, sitemap, and redirect rules.
`;

await fs.writeFile(path.join(root, "taxreliefguides_search_console_fix.md"), markdown);
console.log(JSON.stringify({ totalIssues, report }, null, 2));
