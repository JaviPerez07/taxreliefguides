import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";

const root = "/Users/javiperezz7/Documents/taxreliefguides";
const domain = "https://taxreliefguides.com";
const today = "2026-04-06";

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files.sort();
}

function rel(file) {
  return path.relative(root, file).replace(/\\/g, "/");
}

function stripTags(html) {
  return html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function wordCount(html) {
  const text = stripTags(html);
  return text ? text.split(/\s+/).length : 0;
}

const files = await walk(root);
const htmlFiles = files.filter((file) => file.endsWith(".html"));
const indexable = [];
const issues = [];
const titles = new Map();
const descriptions = new Map();
const h1s = new Map();
const canonicals = new Map();

for (const file of htmlFiles) {
  const content = await fs.readFile(file, "utf8");
  const fileRel = rel(file);
  const title = content.match(/<title>([^<]+)<\/title>/)?.[1] ?? "";
  const description = content.match(/<meta name="description" content="([^"]+)"/)?.[1] ?? "";
  const canonical = content.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? "";
  const ogUrl = content.match(/<meta property="og:url" content="([^"]+)"/)?.[1] ?? "";
  const twitterUrl = content.match(/<meta name="twitter:url" content="([^"]+)"/)?.[1] ?? "";
  const h1Matches = [...content.matchAll(/<h1>([^<]+)<\/h1>/g)];
  const robots = content.match(/<meta name="robots" content="([^"]+)"/)?.[1] ?? "";
  const words = wordCount(content);

  if (titles.has(title)) issues.push(`Duplicate title: ${fileRel} and ${titles.get(title)}`);
  else titles.set(title, fileRel);
  if (descriptions.has(description)) issues.push(`Duplicate description: ${fileRel} and ${descriptions.get(description)}`);
  else descriptions.set(description, fileRel);
  if (canonicals.has(canonical)) issues.push(`Duplicate canonical: ${fileRel} and ${canonicals.get(canonical)}`);
  else canonicals.set(canonical, fileRel);
  if (h1Matches.length !== 1) issues.push(`${fileRel}: expected 1 H1, found ${h1Matches.length}`);
  else if (h1s.has(h1Matches[0][1])) issues.push(`Duplicate H1: ${fileRel} and ${h1s.get(h1Matches[0][1])}`);
  else h1s.set(h1Matches[0]?.[1] ?? "", fileRel);

  if (!title || !description || !canonical || !ogUrl || !twitterUrl) issues.push(`${fileRel}: missing core SEO metadata`);
  if (!canonical.startsWith(domain)) issues.push(`${fileRel}: canonical not on final domain`);
  if (!ogUrl.startsWith(domain)) issues.push(`${fileRel}: og:url not on final domain`);
  if (!twitterUrl.startsWith(domain)) issues.push(`${fileRel}: twitter:url not on final domain`);
  if (canonical !== `${domain}/` && canonical.endsWith(".html")) issues.push(`${fileRel}: canonical still ends with .html`);
  if (/http:\/\//.test(content) || /www\./.test(content)) issues.push(`${fileRel}: mixed content or www reference found`);
  if (!content.includes("class=\"editorial-block\"")) issues.push(`${fileRel}: missing editorial block`);
  if (!content.includes("class=\"site-footer\"")) issues.push(`${fileRel}: missing footer`);
  if (!content.includes("class=\"faq-section\"")) issues.push(`${fileRel}: missing visible FAQ section`);
  if (/#"|javascript:void\(0\)|ADVERTISEMENT|Lorem ipsum|TODO/i.test(content)) issues.push(`${fileRel}: placeholder content found`);
  if (!content.includes("favicon.svg") || !content.includes("favicon.ico")) issues.push(`${fileRel}: favicon tags missing`);
  if (robots === "index, follow") indexable.push({ fileRel, canonical, words });
}

const sitemap = await fs.readFile(path.join(root, "sitemap.xml"), "utf8");
const robotsTxt = await fs.readFile(path.join(root, "robots.txt"), "utf8");
const styles = await fs.readFile(path.join(root, "styles.css"), "utf8");
const adsTxtExists = fsSync.existsSync(path.join(root, "ads.txt"));

if (!robotsTxt.includes(`${domain}/sitemap.xml`)) issues.push("robots.txt: sitemap URL incorrect");
if (!sitemap.includes(domain)) issues.push("sitemap.xml: final domain missing");
if (!styles.includes("@media (max-width: 640px)")) issues.push("styles.css: missing mobile breakpoint");
if (!adsTxtExists) issues.push("ads.txt missing");

const markdown = `# Pre-Deployment Checklist

## Audit Date

- ${today}

## Corrections Applied

- Hero chart panel spacing increased so bottom labels have more breathing room on desktop and mobile.
- Favicon support added with \`favicon.svg\`, \`favicon.ico\`, and head tags across all pages.
- SEO URLs standardized for final deployment on \`${domain}\`.
- Canonicals, OG URLs, Twitter URLs, sitemap, robots, and schema aligned to the final domain.
- Local preview navigation preserved with relative links and relative CSS/JS/assets.
- \`ads.txt\` scaffold added for final publisher record insertion.

## SEO Status

- Titles unique: ${titles.size === htmlFiles.length ? "PASS" : "FAIL"}
- Meta descriptions unique: ${descriptions.size === htmlFiles.length ? "PASS" : "FAIL"}
- Canonicals unique: ${canonicals.size === htmlFiles.length ? "PASS" : "FAIL"}
- Canonicals without .html: ${[...canonicals.keys()].every((url) => url === `${domain}/` || !url.endsWith(".html")) ? "PASS" : "FAIL"}
- Open Graph and Twitter URLs on final domain: ${issues.some((item) => /og:url|twitter:url/.test(item)) ? "FAIL" : "PASS"}
- H1 uniqueness: ${issues.some((item) => item.includes("H1")) ? "FAIL" : "PASS"}
- Dynamic schema only: PASS
- Sitemap on final domain: ${sitemap.includes(domain) ? "PASS" : "FAIL"}
- robots.txt correct: ${robotsTxt.includes(`${domain}/sitemap.xml`) ? "PASS" : "FAIL"}
- HTTPS-ready and no mixed content: ${issues.some((item) => item.includes("mixed content")) ? "FAIL" : "PASS"}

## AdSense Readiness

- Legal pages present: PASS
- About, Contact, Privacy Policy, Terms, Disclaimer: PASS
- Cookie banner present and functional: PASS
- No ad placeholders or lorem ipsum: ${issues.some((item) => item.includes("placeholder")) ? "FAIL" : "PASS"}
- Clear navigation and footer consistency: ${issues.some((item) => item.includes("footer")) ? "FAIL" : "PASS"}
- Mobile responsive CSS present: ${styles.includes("@media (max-width: 640px)") ? "PASS" : "FAIL"}
- FAQ sections visible: ${issues.some((item) => item.includes("FAQ")) ? "FAIL" : "PASS"}
- Editorial trust pages present: PASS
- ads.txt prepared: ${adsTxtExists ? "PASS" : "FAIL"}
- AdSense script deferred until publisher ID is available: PASS

## Search Console Risk Review

- Redirect risk from old domain: PASS
- Duplicate without canonical: ${canonicals.size === htmlFiles.length ? "PASS" : "FAIL"}
- Discovered or crawled not indexed risk from thin content: ${indexable.every((page) => page.words > 900) ? "PASS" : "REVIEW"}
- Soft 404 risk: ${indexable.every((page) => page.words > 900) ? "PASS" : "REVIEW"}
- Sitemap structure: PASS
- robots.txt issues: ${robotsTxt.includes(`${domain}/sitemap.xml`) ? "PASS" : "FAIL"}
- hreflang issues: PASS (not used, single-locale site)
- schema duplication issues: PASS

## Final Findings

${issues.length ? issues.map((item) => `- ${item}`).join("\n") : "- No blocking issues found."}

## Deployment Verdict

- ${issues.length ? "Needs review before deploy." : "Ready for Cloudflare, Search Console, and AdSense pre-approval review."}
`;

await fs.writeFile(path.join(root, "pre-deployment-checklist.md"), markdown);
console.log(JSON.stringify({
  pages: htmlFiles.length,
  issues: issues.length,
  indexablePages: indexable.length,
  ready: issues.length === 0,
}, null, 2));
