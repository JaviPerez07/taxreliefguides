import fs from "node:fs/promises";
import path from "node:path";

const root = "/Users/javiperezz7/Documents/taxreliefguides";
const modifiedDate = "2026-04-18";
const targetSlugs = [
  "payroll-tax-penalties",
  "payroll-tax-problems",
  "small-business-payroll-taxes",
  "payroll-tax-relief",
  "payroll-tax-calculator",
  "tax-debt-relief-options",
  "irs-payment-plan-guide",
  "irs-currently-not-collectible",
  "tax-debt-settlement",
  "back-taxes-help",
  "refundable-vs-nonrefundable-tax-credits",
  "tax-credits-guide",
  "earned-income-tax-credit",
  "child-tax-credit-guide",
  "small-business-tax-credits",
  "offer-in-compromise-guide",
  "penalty-abatement-guide",
  "innocent-spouse-relief",
  "tax-lien-guide",
  "self-employed-tax-guide",
];

function stripTags(html) {
  return html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function wordCount(html) {
  const text = stripTags(html);
  return text ? text.split(/\s+/).length : 0;
}

const issues = [];
const summary = [];

for (const slug of targetSlugs) {
  const file = path.join(root, "pages", `${slug}.html`);
  const html = await fs.readFile(file, "utf8");
  const words = wordCount(html);
  const jsonLdCount = (html.match(/<script type="application\/ld\+json">/g) ?? []).length;
  const faqCount = (html.match(/<details/g) ?? []).length;
  const linkCount = (html.match(/href="\.\.?\/pages\/[^".?#]+"/g) ?? []).length + (html.match(/href="\.\/[^".?#]+"/g) ?? []).length;

  if (!html.includes('meta name="robots" content="index, follow"')) issues.push(`${slug}: missing index, follow robots`);
  if (!html.includes(`<link rel="canonical" href="https://taxreliefguides.com/pages/${slug}">`)) issues.push(`${slug}: canonical mismatch`);
  if (!html.includes('<link rel="icon" href="../favicon.ico">')) issues.push(`${slug}: favicon path mismatch`);
  if (!html.includes('script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3733223915347669"')) issues.push(`${slug}: missing AdSense script`);
  if (jsonLdCount !== 3) issues.push(`${slug}: expected 3 JSON-LD blocks, found ${jsonLdCount}`);
  if ((html.match(/"@type":"Product"/g) ?? []).length > 0) issues.push(`${slug}: Product schema found`);
  if ((html.match(/<table>/g) ?? []).length < 1) issues.push(`${slug}: missing data table`);
  if (faqCount < 5) issues.push(`${slug}: fewer than 5 FAQs`);
  if (words < 2000) issues.push(`${slug}: fewer than 2000 words (${words})`);
  if (linkCount < 5) issues.push(`${slug}: fewer than 5 relative internal links`);
  const anchorHrefs = [...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map((match) => match[1]);
  if (anchorHrefs.some((href) => /^https?:\/\//.test(href))) issues.push(`${slug}: found absolute internal href`);
  if (anchorHrefs.some((href) => /\.html(?:$|[?#])/.test(href))) issues.push(`${slug}: found .html in internal href`);
  if (!html.includes(modifiedDate)) issues.push(`${slug}: modified date missing`);

  summary.push({ slug, words, jsonLdCount, faqCount, linkCount });
}

const sitemap = await fs.readFile(path.join(root, "sitemap.xml"), "utf8");
for (const slug of targetSlugs) {
  if (!sitemap.includes(`<loc>https://taxreliefguides.com/pages/${slug}</loc>`)) issues.push(`sitemap: missing ${slug}`);
}

console.log(JSON.stringify({ pagesChecked: targetSlugs.length, issues: issues.length, summary }, null, 2));
if (issues.length) {
  console.log(issues.join("\n"));
  process.exitCode = 1;
}
