import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";

const root = "/Users/javiperezz7/Documents/taxreliefguides";
const domain = "https://taxreliefguides.com";

async function collectHtml(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectHtml(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(fullPath);
    }
  }
  return files.sort();
}

function toSitePath(file) {
  return path.relative(root, file).replace(/\\/g, "/");
}

const htmlFiles = await collectHtml(root);
const pathSet = new Set(htmlFiles.map((file) => toSitePath(file)));
const report = {
  filesChecked: htmlFiles.length,
  duplicateTitles: [],
  duplicateDescriptions: [],
  duplicateCanonicals: [],
  brokenLinks: [],
  metadataIssues: [],
  structureIssues: [],
  placeholderIssues: [],
};

const seenTitles = new Map();
const seenDescriptions = new Map();
const seenCanonicals = new Map();

function resolveCandidates(file, ref) {
  const clean = ref.split("#")[0].split("?")[0];
  if (!clean) return [];
  const resolved = path.normalize(path.resolve(path.dirname(file), clean));
  if (path.extname(resolved)) return [resolved];
  return [`${resolved}.html`, path.join(resolved, "index.html"), resolved];
}

for (const file of htmlFiles) {
  const content = await fs.readFile(file, "utf8");
  const rel = toSitePath(file);
  const title = content.match(/<title>([^<]+)<\/title>/)?.[1] ?? "";
  const description = content.match(/<meta name="description" content="([^"]+)"/)?.[1] ?? "";
  const canonical = content.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? "";

  if (seenTitles.has(title)) report.duplicateTitles.push([seenTitles.get(title), rel, title]);
  else seenTitles.set(title, rel);

  if (seenDescriptions.has(description)) report.duplicateDescriptions.push([seenDescriptions.get(description), rel, description]);
  else seenDescriptions.set(description, rel);

  if (seenCanonicals.has(canonical)) report.duplicateCanonicals.push([seenCanonicals.get(canonical), rel, canonical]);
  else seenCanonicals.set(canonical, rel);

  if (!canonical.startsWith(domain)) report.metadataIssues.push({ file: rel, field: "canonical", value: canonical });
  if (content.includes("http://") || content.includes("www.")) report.metadataIssues.push({ file: rel, field: "protocol", value: "Found http:// or www" });
  if (/<script type="application\/ld\+json">/.test(content)) report.metadataIssues.push({ file: rel, field: "schema", value: "Static JSON-LD found" });
  if (!content.includes("<header class=\"site-header\">")) report.structureIssues.push({ file: rel, issue: "Missing header" });
  if (!content.includes("<footer class=\"site-footer\">")) report.structureIssues.push({ file: rel, issue: "Missing footer" });
  if (rel !== "index.html" && !content.includes("aria-label=\"Breadcrumb\"")) report.structureIssues.push({ file: rel, issue: "Missing breadcrumbs" });
  if (!content.includes("class=\"editorial-block\"")) report.structureIssues.push({ file: rel, issue: "Missing editorial block" });
  if (!content.includes("class=\"related-section\"")) report.structureIssues.push({ file: rel, issue: "Missing related section" });
  if (!content.includes("This content is for informational purposes only and does not constitute tax, legal, or financial advice.")) {
    report.structureIssues.push({ file: rel, issue: "Missing disclaimer" });
  }
  if (/href="#"|javascript:void\(0\)|ADVERTISEMENT|Lorem ipsum|TODO/i.test(content)) {
    report.placeholderIssues.push(rel);
  }

  for (const match of content.matchAll(/<(a|link|script|img)\b[^>]*(href|src)="([^"]+)"/g)) {
    const ref = match[3];
    const tagMarkup = match[0];
    if (tagMarkup.startsWith("<link") && !/rel="stylesheet"/.test(tagMarkup)) {
      continue;
    }
    if (ref.startsWith("http://") || ref.startsWith("https://")) {
      if (ref.startsWith(domain)) {
        const target = ref === `${domain}/` ? "index.html" : ref.replace(`${domain}/`, "");
        if (ref.includes("/index.html")) {
          report.brokenLinks.push({ file: rel, href: ref });
        }
      }
      continue;
    }
    if (ref.startsWith("#") || ref.startsWith("mailto:") || ref.startsWith("tel:") || ref.startsWith("data:")) continue;
    const candidates = resolveCandidates(file, ref);
    if (!candidates.some((candidate) => fsSync.existsSync(candidate))) {
      report.brokenLinks.push({ file: rel, href: ref });
    }
  }
}

console.log(JSON.stringify(report, null, 2));
