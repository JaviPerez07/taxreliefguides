import fs from "node:fs/promises";
import path from "node:path";

const root = "/Users/javiperezz7/Documents/taxreliefguides";
const adsenseSnippet = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3733223915347669" crossorigin="anonymous"></script>';

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(fullPath)));
    else if (entry.isFile() && entry.name.endsWith(".html")) files.push(fullPath);
  }
  return files.sort();
}

function rel(file) {
  return path.relative(root, file).replace(/\\/g, "/");
}

const htmlFiles = await walk(root);
const coverage = [];
const missing = [];
const duplicates = [];
const outsideHead = [];

for (const file of htmlFiles) {
  const html = await fs.readFile(file, "utf8");
  const relative = rel(file);
  const matches = html.match(/<script async src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-3733223915347669"\s+crossorigin="anonymous"><\/script>/g) ?? [];
  const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? "";

  coverage.push(relative);
  if (!matches.length) missing.push(relative);
  if (matches.length > 1) duplicates.push(`${relative}: ${matches.length}`);
  if (matches.length && !head.includes(adsenseSnippet)) outsideHead.push(relative);
}

const markdown = `# AdSense Verification Audit

## Scope

- Pages crawled: ${htmlFiles.length}
- Includes homepage: ${coverage.includes("index.html") ? "yes" : "no"}
- Includes 404 page: ${coverage.includes("404.html") ? "yes" : "no"}

## Coverage Results

- Pages missing the AdSense verification script: ${missing.length}
- Pages with duplicate AdSense verification scripts: ${duplicates.length}
- Pages where the script is not inside \`<head>\`: ${outsideHead.length}

## Coverage List

${coverage.map((file) => `- ${file}`).join("\n")}

## Missing Coverage

${missing.length ? missing.map((file) => `- ${file}`).join("\n") : "- None"}

## Duplicate Script Findings

${duplicates.length ? duplicates.map((item) => `- ${item}`).join("\n") : "- None"}

## Head Placement Findings

${outsideHead.length ? outsideHead.map((file) => `- ${file}`).join("\n") : "- None"}

## Final Status

- ${missing.length === 0 && duplicates.length === 0 && outsideHead.length === 0 ? "PASS: 100% of crawled pages contain exactly one AdSense verification script inside `<head>`." : "FAIL: One or more pages still need correction."}
`;

await fs.writeFile(path.join(root, "adsense_verification_audit.md"), markdown);
console.log(JSON.stringify({
  pages: htmlFiles.length,
  missing: missing.length,
  duplicates: duplicates.length,
  outsideHead: outsideHead.length,
}, null, 2));
