const COOKIE_NAME = "trg_cookie_pref";

function parseSchema() {
  const holder = document.querySelector("#schema-data");
  if (!holder) return null;
  try {
    return JSON.parse(holder.dataset.schema || "{}");
  } catch {
    return null;
  }
}

function injectSchema() {
  const data = parseSchema();
  if (!data || document.querySelector("#dynamic-schema")) return;

  const graph = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: data.siteName,
      url: "https://taxreliefguides.com/",
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: data.organizationName,
      url: data.organizationUrl,
      logo: data.organizationLogo,
    },
  ];

  if (Array.isArray(data.breadcrumbs) && data.breadcrumbs.length > 1) {
    graph.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: data.breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.label,
        item: crumb.href,
      })),
    });
  }

  if (Array.isArray(data.faqs) && data.faqs.length) {
    graph.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: data.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.a,
        },
      })),
    });
  }

  if (data.type === "home" || data.type === "article") {
    graph.push({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: data.title,
      description: data.description,
      datePublished: data.published,
      dateModified: data.modified,
      author: {
        "@type": "Person",
        name: data.author,
      },
      publisher: {
        "@type": "Organization",
        name: data.organizationName,
        logo: {
          "@type": "ImageObject",
          url: data.organizationLogo,
        },
      },
      mainEntityOfPage: data.url,
      image: data.image,
    });
  }

  if (data.type === "calculator") {
    graph.push({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: data.title,
      url: data.url,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Any",
      description: data.description,
    });
  }

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = "dynamic-schema";
  script.textContent = JSON.stringify(graph);
  document.head.appendChild(script);
}

function upsertHeadTag(selector, build) {
  const existing = document.head.querySelector(selector);
  if (existing) {
    build(existing);
    return existing;
  }
  const node = build(document.createElement(selector.startsWith("link") ? "link" : "meta"));
  document.head.appendChild(node);
  return node;
}

function cleanCanonicalPath(pathname) {
  if (!pathname || pathname === "/index.html") return "/";
  return pathname.replace(/\/index\.html$/, "/").replace(/\.html$/, "").replace(/\/{2,}/g, "/");
}

function handleSearchQuerySignals() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has("q")) return;

  upsertHeadTag('meta[name="robots"]', (node) => {
    node.setAttribute("name", "robots");
    node.setAttribute("content", "noindex, follow");
    return node;
  });

  upsertHeadTag('link[rel="canonical"]', (node) => {
    node.setAttribute("rel", "canonical");
    node.setAttribute("href", `https://taxreliefguides.com${cleanCanonicalPath(window.location.pathname)}`);
    return node;
  });
}

function setupFilePreviewLinks() {
  if (window.location.protocol !== "file:") return;

  document.querySelectorAll("a[href]").forEach((anchor) => {
    const rawHref = anchor.getAttribute("href");
    if (!rawHref || rawHref.startsWith("#") || /^[a-z]+:/i.test(rawHref)) return;
    if (rawHref.includes("?") || rawHref.includes("#")) return;
    if (/\/assets\/|\.css$|\.js$|\.svg$|\.png$|\.jpg$|\.jpeg$|\.webp$|\.ico$/i.test(rawHref)) return;

    if (rawHref === "./" || rawHref === ".") {
      anchor.setAttribute("href", "./index.html");
      return;
    }

    if (rawHref === "../" || rawHref === "..") {
      anchor.setAttribute("href", "../index.html");
      return;
    }

    if (/\.[a-z0-9]+$/i.test(rawHref)) return;
    anchor.setAttribute("href", `${rawHref}.html`);
  });
}

function setupMenu() {
  const button = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");
  if (!button || !nav) return;
  button.addEventListener("click", () => {
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    nav.classList.toggle("is-open", !expanded);
  });
}

function setCookiePreference(value) {
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=31536000; SameSite=Lax; Secure`;
}

function getCookiePreference() {
  return document.cookie
    .split("; ")
    .find((chunk) => chunk.startsWith(`${COOKIE_NAME}=`))
    ?.split("=")[1];
}

function setupCookieBanner() {
  const banner = document.querySelector("[data-cookie-banner]");
  if (!banner) return;
  const preference = getCookiePreference();
  if (!preference) banner.hidden = false;
  banner.querySelectorAll("[data-cookie-action]").forEach((button) => {
    button.addEventListener("click", () => {
      setCookiePreference(button.dataset.cookieAction);
      banner.hidden = true;
    });
  });
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function renderResult(container, lines) {
  container.innerHTML = lines
    .map((line) => `<p><strong>${line.label}:</strong> ${line.value}</p>`)
    .join("");
}

function standardDeduction(status) {
  const table = {
    single: 14600,
    married: 29200,
    head: 21900,
  };
  return table[status] || table.single;
}

function estimateAnnualFederalTax(income, status) {
  const brackets = {
    single: [
      [11600, 0.1],
      [47150, 0.12],
      [100525, 0.22],
      [191950, 0.24],
    ],
    married: [
      [23200, 0.1],
      [94300, 0.12],
      [201050, 0.22],
      [383900, 0.24],
    ],
    head: [
      [16550, 0.1],
      [63100, 0.12],
      [100500, 0.22],
      [191950, 0.24],
    ],
  };
  const rows = brackets[status] || brackets.single;
  let remaining = Math.max(0, income);
  let previous = 0;
  let tax = 0;

  rows.forEach(([limit, rate]) => {
    const taxableAtThisRate = Math.max(0, Math.min(remaining, limit - previous));
    tax += taxableAtThisRate * rate;
    remaining -= taxableAtThisRate;
    previous = limit;
  });

  if (remaining > 0) tax += remaining * 0.32;
  return tax;
}

function setupCalculators() {
  document.querySelectorAll("[data-calculator]").forEach((wrapper) => {
    const form = wrapper.querySelector("form");
    const result = wrapper.querySelector(".calculator-result");
    if (!form || !result) return;

    const handlers = {
      refund() {
        const wages = Number(form.wages.value);
        const withheld = Number(form.withheld.value);
        const credits = Number(form.credits.value);
        const status = form.status.value;
        const taxableIncome = Math.max(0, wages - standardDeduction(status));
        const estimatedTax = Math.max(0, estimateAnnualFederalTax(taxableIncome, status) - credits);
        const refund = withheld - estimatedTax;
        renderResult(result, [
          { label: "Estimated taxable income", value: formatCurrency(taxableIncome) },
          { label: "Estimated federal tax", value: formatCurrency(estimatedTax) },
          { label: refund >= 0 ? "Estimated refund" : "Estimated amount due", value: formatCurrency(Math.abs(refund)) },
        ]);
      },
      "self-employment"() {
        const netIncome = Number(form.netIncome.value);
        const retirement = Number(form.retirement.value);
        const estimatesPaid = Number(form.estimatesPaid.value);
        const seBase = netIncome * 0.9235;
        const seTax = seBase * 0.153;
        const deductibleHalf = seTax / 2;
        const roughIncomeTaxBase = Math.max(0, netIncome - deductibleHalf - retirement - 14600);
        const roughIncomeTax = estimateAnnualFederalTax(roughIncomeTaxBase, "single");
        const total = seTax + roughIncomeTax;
        renderResult(result, [
          { label: "Estimated self-employment tax", value: formatCurrency(seTax) },
          { label: "Half SE tax deduction", value: formatCurrency(deductibleHalf) },
          { label: "Estimated remaining annual tax after payments", value: formatCurrency(Math.max(0, total - estimatesPaid)) },
        ]);
      },
      paycheck() {
        const gross = Number(form.gross.value);
        const periods = Number(form.frequency.value);
        const pretax = Number(form.pretax.value);
        const status = form.status.value;
        const annualTaxableWages = Math.max(0, (gross - pretax) * periods);
        const annualFederal = estimateAnnualFederalTax(Math.max(0, annualTaxableWages - standardDeduction(status)), status);
        const federalPerPaycheck = annualFederal / periods;
        const fica = Math.max(0, gross - pretax) * 0.0765;
        const takeHome = gross - pretax - federalPerPaycheck - fica;
        renderResult(result, [
          { label: "Estimated federal withholding", value: formatCurrency(federalPerPaycheck) },
          { label: "Estimated FICA", value: formatCurrency(fica) },
          { label: "Estimated take-home pay", value: formatCurrency(takeHome) },
        ]);
      },
      business() {
        const entity = form.entity.value;
        const profit = Number(form.profit.value);
        const salary = Number(form.salary.value);
        const payments = Number(form.payments.value);
        let estimatedTax = 0;

        if (entity === "ccorp") {
          estimatedTax = profit * 0.21;
        } else if (entity === "scorp") {
          const passThrough = Math.max(0, profit - salary);
          estimatedTax = salary * 0.153 + estimateAnnualFederalTax(passThrough + salary - 14600, "single");
        } else {
          const seBase = profit * 0.9235;
          estimatedTax = seBase * 0.153 + estimateAnnualFederalTax(Math.max(0, profit - (seBase * 0.153) / 2 - 14600), "single");
        }

        renderResult(result, [
          { label: "Estimated annual federal taxes", value: formatCurrency(estimatedTax) },
          { label: "Estimated balance after payments", value: formatCurrency(Math.max(0, estimatedTax - payments)) },
          { label: "Suggested quarterly reserve", value: formatCurrency(Math.max(0, estimatedTax - payments) / 4) },
        ]);
      },
      settlement() {
        const debt = Number(form.debt.value);
        const settlement = Number(form.settlement.value);
        const annualRate = Number(form.rate.value) / 100;
        const months = Number(form.months.value);
        const carryingCost = debt * annualRate * (months / 12);
        const payOverTime = debt + carryingCost;
        const savings = Math.max(0, payOverTime - settlement);
        renderResult(result, [
          { label: "Estimated pay-over-time cost", value: formatCurrency(payOverTime) },
          { label: "Estimated settlement amount", value: formatCurrency(settlement) },
          { label: "Potential gross savings", value: formatCurrency(savings) },
        ]);
      },
    };

    const key = wrapper.dataset.calculator;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      handlers[key]?.();
    });
    handlers[key]?.();
  });
}

handleSearchQuerySignals();
setupFilePreviewLinks();
injectSchema();
setupMenu();
setupCookieBanner();
setupCalculators();
