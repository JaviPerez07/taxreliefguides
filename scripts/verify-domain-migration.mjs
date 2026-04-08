import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";

const root = "/Users/javiperezz7/Documents/taxreliefguides";
const oldDomain = ["https://", "taxreliefguide", ".com"].join("");
const newDomain = "https://taxreliefguides.com";

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else {
      files.push(fullPath);
    }
  }
  return files.sort();
}

function rel(file) {
  return path.relative(root, file).replace(/\\/g, "/");
}

function resolveLocalRef(file, ref) {
  const clean = ref.split("#")[0].split("?")[0];
  if (!clean) return null;
  return path.normalize(path.resolve(path.dirname(file), clean));
}

function resolveLocalTargets(file, ref) {
  const clean = ref.split("#")[0].split("?")[0];
  if (!clean) return [];
  const resolved = path.normalize(path.resolve(path.dirname(file), clean));
  if (path.extname(resolved)) return [resolved];
  return [`${resolved}.html`, path.join(resolved, "index.html"), resolved];
}

function expectedLocalAssetRef(file, target) {
  return rel(file).includes("/") ? `../${target}` : `./${target}`;
}

const files = (await walk(root)).filter((file) => {
  const relative = rel(file);
  return relative !== "scripts/verify-domain-migration.mjs" && relative !== "domain-migration-report.md";
});
const htmlFiles = files.filter((file) => file.endsWith(".html"));

const report = {
  scannedFiles: files.length,
  scannedHtmlFiles: htmlFiles.length,
  oldDomainReferences: [],
  brokenLocalLinks: [],
  missingAssets: [],
  localNavigationIssues: [],
  seoIssues: [],
  summary: {},
};

for (const file of files) {
  const text = await fs.readFile(file, "utf8");
  if (text.includes(oldDomain)) {
    report.oldDomainReferences.push(rel(file));
  }
}

for (const file of htmlFiles) {
  const text = await fs.readFile(file, "utf8");
  const fileRel = rel(file);
  const canonical = text.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? "";
  const ogUrl = text.match(/<meta property="og:url" content="([^"]+)"/)?.[1] ?? "";
  const twitterUrl = text.match(/<meta name="twitter:url" content="([^"]+)"/)?.[1] ?? "";
  const schemaData = text.match(/data-schema='([^']+)'/)?.[1] ?? "";

  if (!canonical.startsWith(newDomain)) report.seoIssues.push(`${fileRel}: canonical does not use ${newDomain}`);
  if (!ogUrl.startsWith(newDomain)) report.seoIssues.push(`${fileRel}: og:url does not use ${newDomain}`);
  if (!twitterUrl.startsWith(newDomain)) report.seoIssues.push(`${fileRel}: twitter:url does not use ${newDomain}`);
  if (!schemaData.includes(newDomain.replace(/&/g, "&amp;"))) report.seoIssues.push(`${fileRel}: schema payload missing new domain`);

  const expectedCss = expectedLocalAssetRef(file, "styles.css");
  const expectedJs = expectedLocalAssetRef(file, "main.js");
  const cssHref = text.match(/<link rel="stylesheet" href="([^"]+)"/)?.[1] ?? "";
  const jsSrc = text.match(/<script src="([^"]+)" defer><\/script>/)?.[1] ?? "";
  if (cssHref !== expectedCss) report.localNavigationIssues.push(`${fileRel}: CSS href is ${cssHref}, expected ${expectedCss}`);
  if (jsSrc !== expectedJs) report.localNavigationIssues.push(`${fileRel}: JS src is ${jsSrc}, expected ${expectedJs}`);

  for (const match of text.matchAll(/<(a|link|script|img)\b[^>]*(href|src)="([^"]+)"/g)) {
    const tag = match[1];
    const ref = match[3];
    const tagMarkup = match[0];

    if (tag === "link" && !/rel="stylesheet"|rel="icon"|rel="shortcut icon"/.test(tagMarkup)) {
      continue;
    }

    if (ref === "#" || ref.startsWith("javascript:void(0)")) {
      report.localNavigationIssues.push(`${fileRel}: placeholder link ${ref}`);
      continue;
    }

    if (ref.startsWith("http://") || ref.startsWith("https://")) {
      if (ref.startsWith(oldDomain)) {
        report.oldDomainReferences.push(`${fileRel}: ${ref}`);
      } else if (ref.startsWith(newDomain)) {
        const target = ref === `${newDomain}/` ? "index.html" : ref.replace(`${newDomain}/`, "");
        const expected = path.join(root, `${target}.html`);
        const expectedIndex = path.join(root, target, "index.html");
        if (!fsSync.existsSync(expected) && !fsSync.existsSync(expectedIndex) && target !== "index.html") {
          report.brokenLocalLinks.push(`${fileRel}: ${ref}`);
        }
      }
      continue;
    }

    if (ref.startsWith("#") || ref.startsWith("mailto:") || ref.startsWith("tel:") || ref.startsWith("data:")) continue;

    const candidates = resolveLocalTargets(file, ref);
    if (!candidates.length || !candidates.some((candidate) => fsSync.existsSync(candidate))) {
      const bucket = tag === "img" || tag === "script" || tag === "link" ? report.missingAssets : report.brokenLocalLinks;
      bucket.push(`${fileRel}: ${ref}`);
    }
  }
}

const sitemap = await fs.readFile(path.join(root, "sitemap.xml"), "utf8");
const robots = await fs.readFile(path.join(root, "robots.txt"), "utf8");

if (sitemap.includes(oldDomain)) report.oldDomainReferences.push("sitemap.xml");
if (robots.includes(oldDomain)) report.oldDomainReferences.push("robots.txt");
if (!sitemap.includes(newDomain)) report.seoIssues.push("sitemap.xml: new domain not found");
if (!robots.includes(`${newDomain}/sitemap.xml`)) report.seoIssues.push("robots.txt: sitemap URL not updated");

report.summary = {
  oldDomainReferences: report.oldDomainReferences.length,
  brokenLocalLinks: report.brokenLocalLinks.length,
  missingAssets: report.missingAssets.length,
  localNavigationIssues: report.localNavigationIssues.length,
  seoIssues: report.seoIssues.length,
};

const markdown = `# Domain Migration Report

## Summary

- Files scanned: ${report.scannedFiles}
- HTML files scanned: ${report.scannedHtmlFiles}
- Remaining references to the legacy domain: ${report.summary.oldDomainReferences}
- Broken local links: ${report.summary.brokenLocalLinks}
- Missing assets: ${report.summary.missingAssets}
- Local navigation issues: ${report.summary.localNavigationIssues}
- SEO URL issues: ${report.summary.seoIssues}

## Checks

- ${report.summary.oldDomainReferences === 0 ? "[x]" : "[ ]"} All references migrated to \`${newDomain}\`
- ${report.summary.brokenLocalLinks === 0 ? "[x]" : "[ ]"} Local page links resolve correctly
- ${report.summary.missingAssets === 0 ? "[x]" : "[ ]"} CSS, JS, and image assets resolve correctly
- ${report.summary.localNavigationIssues === 0 ? "[x]" : "[ ]"} Local navigation paths match the expected relative structure
- ${report.summary.seoIssues === 0 ? "[x]" : "[ ]"} Canonicals, OG URLs, Twitter URLs, sitemap, robots, and schema use \`${newDomain}\`

## Remaining Legacy-Domain References
${report.oldDomainReferences.length ? report.oldDomainReferences.map((item) => `- ${item}`).join("\n") : "- None"}

## Broken Local Links
${report.brokenLocalLinks.length ? report.brokenLocalLinks.map((item) => `- ${item}`).join("\n") : "- None"}

## Missing Assets
${report.missingAssets.length ? report.missingAssets.map((item) => `- ${item}`).join("\n") : "- None"}

## Local Navigation Issues
${report.localNavigationIssues.length ? report.localNavigationIssues.map((item) => `- ${item}`).join("\n") : "- None"}

## SEO Issues
${report.seoIssues.length ? report.seoIssues.map((item) => `- ${item}`).join("\n") : "- None"}
`;

await fs.writeFile(path.join(root, "domain-migration-report.md"), markdown);
console.log(JSON.stringify(report, null, 2));
