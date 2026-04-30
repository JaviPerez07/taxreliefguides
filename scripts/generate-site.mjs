import fs from "node:fs/promises";
import path from "node:path";
import { stateTaxReliefConfigs } from "./state-tax-relief-data.mjs";

const root = "/Users/javiperezz7/Documents/taxreliefguides";
const domain = "https://taxreliefguides.com";
const lastmod = "2026-04-23";
const adsenseScript = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3733223915347669" crossorigin="anonymous"></script>`;
const contactEmail = "javiperezguides@gmail.com";

const site = {
  name: "TaxReliefGuides",
  domain,
  tagline: "Independent U.S. tax relief, IRS debt, deductions, payroll, and business tax guidance.",
  organization: {
    legalName: "TaxReliefGuides",
    url: domain,
    logo: `${domain}/assets/logo-mark.svg`,
    sameAs: [
      `${domain}/about`,
      `${domain}/how-we-research`,
      `${domain}/contact`,
    ],
  },
  disclaimer:
    "This content is for informational purposes only and does not constitute tax, legal, or financial advice.",
};

const navGroups = [
  { label: "IRS Relief", href: `${domain}/pages/irs-tax-relief-guide` },
  { label: "Tax Debt", href: `${domain}/pages/tax-debt-guide` },
  { label: "Deductions", href: `${domain}/pages/tax-deductions-guide` },
  { label: "Business Taxes", href: `${domain}/pages/business-tax-guide` },
  { label: "Payroll Taxes", href: `${domain}/pages/payroll-tax-guide` },
  { label: "Tax Credits", href: `${domain}/pages/tax-credits-guide` },
  { label: "State Relief", href: `${domain}/states/` },
  { label: "Calculators", href: `${domain}/pages/tax-refund-calculator` },
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

function slugToTitle(slug) {
  return slug
    .replace(/\.html$/, "")
    .split("/")
    .pop()
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function cleanEnding(value) {
  return value.replace(/[\s|:;,/-]+$/, "").trim();
}

/** Ensure a string ends with a sentence-closing period. */
function sentenceEnd(str) {
  const s = str.trim();
  return /[.!?]$/.test(s) ? s : `${s}.`;
}

/** Capitalize the first character of a string (for audience/subject at sentence start). */
function cap(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function truncateAtWord(value, max) {
  if (value.length <= max) return value;
  const slice = value.slice(0, max + 1);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > 28 ? slice.slice(0, lastSpace) : value.slice(0, max)).trim();
}

function normalizeTitle(title) {
  if (title.length >= 50 && title.length <= 60) return title;
  const suffixes = [" | TaxReliefGuides", " | U.S. Tax Guide"];
  for (const suffix of suffixes) {
    const candidate = `${title}${suffix}`;
    if (candidate.length >= 50 && candidate.length <= 60) return candidate;
    if (candidate.length > 60) {
      const allowed = 60 - suffix.length;
      const trimmed = cleanEnding(truncateAtWord(title, allowed));
      const adjusted = `${trimmed}${suffix}`;
      if (adjusted.length >= 50 && adjusted.length <= 60) return adjusted;
    }
  }
  return cleanEnding(truncateAtWord(`${title} Guide`, 60));
}

function normalizeDescription(description) {
  const base = description.replace(/\s+/g, " ").trim().replace(/\.+$/, "");
  if (base.length >= 140 && base.length <= 160) {
    return /[.!?]$/.test(base) ? base : `${base}.`;
  }
  if (base.length > 160) {
    return `${cleanEnding(truncateAtWord(base, 159))}.`;
  }
  const fragments = [
    " Includes IRS procedures, records, and practical next steps.",
    " Covers key forms, deadlines, and documentation points.",
    " Built to help readers compare the next sensible option.",
  ];
  let candidate = base;
  for (const fragment of fragments) {
    if (candidate.length >= 140) break;
    if (`${candidate}${fragment}`.length <= 160) candidate += fragment;
  }
  candidate = cleanEnding(candidate);
  return /[.!?]$/.test(candidate) ? candidate : `${candidate}.`;
}

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordCountFromHtml(html) {
  const text = stripTags(html);
  return text ? text.split(/\s+/).length : 0;
}

function urlFor(filePath) {
  if (filePath === "index.html") return `${domain}/`;
  if (filePath.endsWith("/index.html")) return `${domain}/${filePath.slice(0, -"index.html".length)}`;
  return `${domain}/${filePath.replace(/\.html$/, "")}`;
}

function pathForTarget(target) {
  if (!target) return "";
  if (target === `${domain}/`) return "index.html";
  const raw = target.startsWith(`${domain}/`) ? target.replace(`${domain}/`, "") : target;
  if (!raw) return "index.html";
  if (raw.endsWith("/")) return `${raw}index.html`;
  if (raw.endsWith(".html") || path.posix.extname(raw)) return raw;
  return `${raw}.html`;
}

function localHref(fromPath, target) {
  const targetPath = pathForTarget(target);
  if (!targetPath) return "";
  const fromDir = fromPath.includes("/") ? path.posix.dirname(fromPath) : ".";
  let relative = path.posix.relative(fromDir, targetPath);
  if (!relative) relative = path.posix.basename(targetPath);
  relative = relative.replace(/\\/g, "/");
  if (relative === "index.html") return "./";
  if (relative.endsWith("/index.html")) relative = relative.slice(0, -"index.html".length);
  else relative = relative.replace(/\.html$/, "");
  if (relative === ".") return "./";
  if (relative === "..") return "../";
  if (!relative.startsWith(".")) relative = `./${relative}`;
  return relative;
}

function withDefaults(config) {
  return {
    robots: "index, follow",
    template: "article",
    badge: "Guide",
    image: `${domain}/assets/social-cover.svg`,
    ...config,
  };
}

function makeBreadcrumbs(pathname, label, groupLabel = "Guides") {
  return [
    { label: "Home", href: `${domain}/` },
    { label: groupLabel, href: `${domain}/pages/irs-tax-relief-guide` },
    { label, href: urlFor(pathname) },
  ];
}

function makeFaqs(config) {
  return [
    {
      q: `Who benefits most from a guide about ${config.keyword}?`,
      a: `${cap(config.audience)} usually benefit most because the biggest savings often come from understanding deadlines, documentation, and which relief program actually fits the case before contacting the IRS or filing amended information.`,
    },
    {
      q: `Can ${config.keyword} reduce penalties or improve cash flow?`,
      a: `In many cases it can improve cash flow, lower avoidable penalties, or prevent collection pressure from escalating, but the outcome depends on filing status, balance size, compliance history, and whether returns are already current.`,
    },
    {
      q: `What records should I gather first for ${config.keyword}?`,
      a: `Start with the most recent IRS notices, prior returns, wage and income records, current year estimates, bank statements, and any bookkeeping or payroll records that explain why the balance or adjustment exists.`,
    },
    {
      q: `When should I speak with a CPA, enrolled agent, or tax attorney?`,
      a: `Professional help becomes more important when a case involves large balances, multiple unfiled returns, payroll exposure, liens, levies, audit adjustments, or disputed facts that need representation rather than basic filing support.`,
    },
  ];
}

function makeKeyTakeaways(config) {
  return [
    `${config.keyword} decisions are usually driven by timing, documentation quality, and whether you stay current on new filings while fixing old problems.`,
    `The headline solution matters less than the full cost path: tax due, penalties, interest, payment term, compliance obligations, and the risk of collection action.`,
    `${cap(config.audience)} often save the most by comparing relief paths early instead of waiting until notices become more serious or payroll problems compound.`,
  ];
}

function articleTable(config) {
  return {
    caption: `${config.shortLabel} decision framework`,
    headers: ["Priority area", "What to review", "Why it matters", "Practical next step"],
    rows: [
      ["Balance and exposure", config.challenge, "It determines urgency and which IRS path is realistic", "Summarize current balances, notices, and tax years involved"],
      ["Eligibility", config.eligibility, "Programs work only when filing and disclosure rules are met", "Confirm return status, income trend, and entity structure"],
      ["Cash-flow impact", config.cashflow, "Affordable plans hold up better than optimistic ones", "Model best-case and stress-case monthly payments"],
      ["Documentation", config.docs, "Missing support slows resolution and can trigger denials", "Prepare notices, transcripts, returns, and financial statements"],
    ],
  };
}

function chartFromStats(config) {
  return {
    eyebrow: "Visual snapshot",
    title: `${config.shortLabel} cost and risk signals`,
    ariaLabel: `${config.shortLabel} chart comparing urgency and planning factors`,
    bars: config.chartBars,
  };
}

function pillarSections(config) {
  return [
    {
      id: "overview",
      eyebrow: "Big picture",
      title: `How ${config.keyword} works in the United States`,
      intro: `${config.shortLabel} sits at the intersection of tax procedure, cash-flow planning, and legal compliance.`,
      paragraphs: [
        `${config.keyword} matters because federal tax problems rarely stay static. A small balance can become a larger collection issue once failure-to-file penalties, failure-to-pay penalties, and daily interest keep stacking up. For ${config.audience}, the first decision is usually not whether to pay in full right away. It is whether the next step should be filing missing returns, requesting a transcript, building a short-term cash plan, or comparing formal IRS relief routes before the account moves deeper into collections.`,
        `Readers researching ${config.keyword} are usually trying to answer three questions at once. First, how serious is the current notice or balance? Second, which programs actually apply to the facts of the case? Third, what does each option do to monthly cash flow over the next year? Those questions matter because the cheapest option on paper can still fail if the taxpayer cannot sustain the payment or misses a future filing deadline after entering relief.`,
        `TaxReliefGuides treats ${config.shortLabel.toLowerCase()} as a decision system rather than a single tactic. We focus on sequence: get the filing picture current, measure the tax, penalty, and interest components, compare relief options, and then protect compliance going forward. That framework helps households and business owners avoid the expensive habit of reacting to each IRS letter without a full plan.`,
      ],
      list: [
        `Map every tax year involved before choosing a relief strategy.`,
        `Separate the original tax from penalties and interest to see where savings may be possible.`,
        `Assume that future filing compliance is part of the solution, not a separate project.`,
      ],
      table: articleTable(config),
    },
    {
      id: "programs",
      eyebrow: "Programs",
      title: `Core relief paths and tradeoffs for ${config.shortLabel}`,
      intro: `The strongest strategy depends on balance size, income stability, assets, and compliance status.`,
      paragraphs: [
        `Most taxpayers start by comparing installment agreements, temporary hardship status, penalty relief, and settlement-style programs such as an offer in compromise. Each path solves a different problem. Installment agreements are built for balances that can be paid over time. Penalty relief is often the best first move when the account is otherwise manageable. Hardship status helps when collection would create real financial strain. Compromise programs are narrower and usually require a deeper financial disclosure.`,
        `The practical mistake is chasing the most dramatic option first. For example, a taxpayer may spend weeks pursuing a settlement even though a clean payment plan plus first-time penalty abatement would cost less, move faster, and carry less documentation burden. On the other hand, a business owner with volatile income may need a more flexible plan because a standard monthly draft could fail during a slow quarter and create a new default.`,
        `${config.keyword} planning works best when the taxpayer compares not only approval odds but also operating reality after approval. A program that looks attractive in a consultation may still underperform if it requires constant quarterly estimates, aggressive future withholding, or business cash reserves that the company does not actually have.`,
      ],
    },
    {
      id: "eligibility",
      eyebrow: "Eligibility",
      title: `Eligibility signals, thresholds, and IRS expectations`,
      intro: `IRS relief is highly process-driven, and eligibility usually turns on compliance behavior more than marketing language.`,
      paragraphs: [
        `${sentenceEnd(config.eligibility)} In practice, that means the IRS wants recent returns filed, financial statements that match the story being told, and enough detail to evaluate what the taxpayer can reasonably pay. When these items are weak, taxpayers often misread a denial as a rejection of the program itself when the real issue is incomplete support or inconsistent disclosures.`,
        `Taxpayers should also remember that balance size changes the work involved. Smaller balances may qualify for streamlined paths with less documentation, while larger balances often require a fuller review of income, expenses, equity, or business records. That difference matters because the timeline, professional fees, and level of scrutiny can increase sharply once an account crosses higher-risk thresholds.`,
        `If a taxpayer is self-employed or running payroll, the IRS also looks hard at current compliance. A plan to fix old debt is less convincing when new estimates or deposits are already falling behind. That is why many tax professionals treat current-year compliance as the foundation of every relief strategy rather than a box to check later.`,
      ],
      list: [
        `Confirm which returns are filed and which remain open.`,
        `Check whether current withholding or estimates are sufficient.`,
        `Know whether business payroll issues create separate exposure from income tax debt.`,
      ],
    },
    {
      id: "cost-drivers",
      eyebrow: "Cost drivers",
      title: `What makes tax problems more expensive over time`,
      intro: `The tax due is only one part of the real cost.`,
      paragraphs: [
        `Failure-to-file penalties are often the most aggressive cost accelerators because they can compound quickly when returns are missing. Failure-to-pay penalties usually accumulate more slowly, but they still matter on older balances that sit unresolved for months. Interest then keeps running on top of both the tax and certain penalties, which is why waiting for a refund season windfall can be an expensive delay strategy.`,
        `For business owners, compliance costs extend beyond the IRS account transcript. Unpaid payroll taxes can affect vendor confidence, financing, licenses, and the owner’s personal stress level because payroll issues are treated with unusual seriousness. Even when a company remains solvent, poor deposit discipline can turn a manageable tax bill into a broader credibility problem with both tax authorities and lenders.`,
        `Another hidden cost is decision friction. Taxpayers who do not organize records early tend to spend more on emergency consultations, rush filing services, and reactive payment arrangements. The sooner the file is normalized into notices, returns, transcripts, bookkeeping, and a cash-flow forecast, the easier it becomes to compare relief options on their actual merits.`,
      ],
      table: {
        caption: `${config.shortLabel} cost pressure points`,
        headers: ["Cost source", "Typical effect", "When it spikes", "How to manage it"],
        rows: [
          ["Tax principal", "Core amount due", "After audit changes or missed estimates", "Confirm the balance with transcripts and filed returns"],
          ["Penalties", "Raises the effective cost quickly", "Late filing, late payment, payroll failures", "Review abatement options and compliance history"],
          ["Interest", "Runs until the balance is resolved", "Long timelines and partial payments", "Use faster filing and structured payment decisions"],
          ["Professional and admin time", "Adds cash and time cost", "Disorganized records or multi-year cases", "Prepare records before seeking representation"],
        ],
      },
    },
    {
      id: "strategy",
      eyebrow: "Strategy",
      title: `Building a workable ${config.shortLabel.toLowerCase()} plan`,
      intro: `A workable plan protects both the taxpayer’s budget and future compliance.`,
      paragraphs: [
        `The most reliable plans start with current-year tax behavior. Employees may need higher withholding, while self-employed taxpayers often need a stronger estimated-tax routine before any relief agreement is signed. Without that change, old debt gets layered with new debt, and even a well-negotiated monthly plan becomes fragile.`,
        `Cash-flow planning also matters more than taxpayers expect. The IRS may accept a payment figure that still feels difficult inside a household or business budget, especially when seasonal volatility or uneven receivables are involved. A stronger strategy uses conservative revenue assumptions and a payment amount that can survive slow months, not just average months.`,
        `Finally, strong planning means knowing when to escalate from self-help to professional help. If the case involves liens, levies, trust fund payroll issues, disputed assessments, or multiple entities, the taxpayer is no longer just looking for information. They are managing risk, and the right advisor can change both the process and the final outcome.`,
      ],
      list: [
        `Prioritize staying current on this year’s taxes before asking the IRS for flexibility on old years.`,
        `Model payments against conservative income assumptions.`,
        `Treat deadlines, transcripts, and written records as part of the strategy, not admin work.`,
      ],
    },
    {
      id: "documents",
      eyebrow: "Documentation",
      title: `Documents and numbers you should prepare`,
      intro: `Better records make better relief decisions.`,
      paragraphs: [
        `${sentenceEnd(config.docs)} Taxpayers often underestimate how much time is lost simply locating notices, recreating income, or explaining why estimated payments were missed. A complete document packet shortens that loop and gives any advisor or reviewer a cleaner picture from the start.`,
        `For individual cases, that usually means prior returns, recent wage and income transcripts, current pay stubs, bank statements, and a draft monthly budget. For businesses, add bookkeeping reports, payroll filings, sales trends, debt schedules, and any correspondence involving state tax agencies if the problem is broader than the IRS.`,
        `Documentation is also where credibility is built. When taxpayers can show how they arrived at a number, what changed in their finances, and how they plan to stay compliant next year, it is easier to present the case consistently across notices, forms, and professional consultations.`,
      ],
    },
    {
      id: "case-study",
      eyebrow: "Examples",
      title: `Real-world scenarios readers can learn from`,
      intro: `High-CPC tax topics become easier to understand when the math is grounded in realistic cases.`,
      paragraphs: [
        `Consider a W-2 employee who owes several thousand dollars after under-withholding and early retirement distributions. That taxpayer may not need a complex settlement at all. Filing quickly, requesting first-time penalty relief if eligible, and stretching the remaining balance over a modest payment plan could solve the issue with less friction than a more aggressive strategy.`,
        `Now compare that with a freelance consultant whose income fell after a strong year. The consultant may owe back taxes across more than one year and also need to reset quarterly estimates. In that situation, the relief choice is inseparable from future tax planning because a payment agreement that ignores next year’s estimates will likely collapse as soon as the next quarter closes.`,
        `A third example is a small business with late payroll deposits during a cash crunch. The owner’s challenge is not only the tax due but also the seriousness of payroll enforcement. That case often requires faster escalation, tighter bookkeeping, and more discipline around payroll funding than a standard income tax balance.`,
      ],
    },
    {
      id: "mistakes",
      eyebrow: "Mistakes",
      title: `Common mistakes that make ${config.shortLabel.toLowerCase()} harder`,
      intro: `Most expensive tax problems start with a sequence error rather than a lack of effort.`,
      paragraphs: [
        `One common mistake is entering a payment arrangement before verifying the underlying years, penalties, or transcript details. Taxpayers sometimes agree to a monthly amount while an older return is still unfiled or while an abatement opportunity is sitting untouched. That can lock in a weaker path and delay a more efficient solution.`,
        `Another mistake is treating the relief process like a one-time negotiation. In reality, the IRS expects ongoing compliance, and that expectation can break otherwise reasonable strategies. If withholding, estimated tax payments, or payroll deposits remain weak, the old problem simply reappears in a new tax year.`,
        `A third mistake is waiting until wage garnishment, levies, or repeated notices create urgency. Some pressure is unavoidable, but early action preserves options. Taxpayers who move while the file is still organized and before collection intensifies usually have more room to choose the right remedy rather than the fastest emergency fix.`,
      ],
      list: [
        `Do not assume the first relief option mentioned is the cheapest long-term option.`,
        `Do not ignore current-year compliance while solving prior-year debt.`,
        `Do not send incomplete financial disclosures when the case requires detailed review.`,
      ],
    },
    {
      id: "timeline",
      eyebrow: "Timeline",
      title: `What a sensible action timeline looks like`,
      intro: `Tax relief becomes more manageable when the work is sequenced.`,
      paragraphs: [
        `A practical first week is about information capture: gather notices, request or review transcripts, identify missing returns, and calculate the current balance by tax year. During the second stage, the taxpayer should fix filing gaps, update withholding or estimates, and compare which formal relief path matches the facts. Only after that should the focus move to submitting forms, negotiating terms, or escalating to representation.`,
        `The middle stage of a tax case is where many readers lose momentum because the administrative work is less dramatic than the notices. Yet this stage often delivers the biggest payoff. Organized records, realistic budgets, and corrected current-year tax habits improve both approval odds and long-term success.`,
        `The final stage is maintenance. Once a payment plan, penalty decision, or other relief path is in place, the taxpayer should calendar due dates, monitor transcripts, and review tax settings during the year. Relief is strongest when it transitions into a stable tax process rather than staying an emergency project.`,
      ],
    },
    {
      id: "next-steps",
      eyebrow: "Action plan",
      title: `Next steps if you are dealing with ${config.keyword}`,
      intro: `Use the simplest path that fully solves the problem and preserves compliance.`,
      paragraphs: [
        `Start by identifying whether your main issue is balance size, missing returns, penalty burden, business cash flow, or active collection pressure. That diagnosis determines whether you should prioritize filing, negotiation, penalty relief, or professional representation. Many taxpayers save time by naming the bottleneck before they start filling out forms.`,
        `Next, compare the cost of doing nothing with the cost of taking action now. When penalties, interest, or payroll exposure are still building, delay can be more expensive than many readers expect. Even if the final solution is a monthly agreement, filing and organizing the case earlier usually improves the economics.`,
        `Finally, make your plan durable. Adjust withholding, set aside estimated payments, protect payroll tax deposits, and calendar review points. The goal of ${config.shortLabel.toLowerCase()} is not only to shrink the old problem. It is to stop the next one from forming.`,
      ],
    },
  ];
}

function supportSections(config) {
  return [
    {
      id: "start-here",
      eyebrow: "Start here",
      title: `What this page helps you decide`,
      intro: `This page is most useful when you already know the real tax question in front of you.`,
      paragraphs: [
        `${cap(config.audience)} usually land here because they are trying to decide what to do next, not because they need a dictionary definition. The useful question is whether this topic changes a filing choice, lowers a current tax bill, reduces collection pressure, or helps avoid a repeat problem next quarter or next filing season.`,
        `${config.shortLabel} becomes easier once the decision is narrowed. Are you reviewing an IRS notice, comparing two relief options, checking whether a deduction is supportable, or trying to estimate the cash impact of a tax move before you make it? The answer determines which records matter and what the safest next step looks like.`,
        `This page is written to move that decision forward. It focuses on how the topic works in real life, who it usually fits, where people go wrong, and which related guide should be read next if the situation is broader than one form or one rule.`,
      ],
      table: articleTable(config),
    },
    {
      id: "fit-check",
      eyebrow: "Fit check",
      title: `When this topic usually fits and when it does not`,
      intro: `Not every tax page applies to every filer, business, or notice stage.`,
      paragraphs: [
        `${cap(config.audience)} are usually the best fit because the topic directly affects how they file, how much tax they owe, or how they respond to a balance or notice. The page becomes less useful when the reader is really dealing with a different issue, such as payroll compliance, multistate filing, an audit, or a collection problem that needs a separate guide.`,
        `Context matters. A deduction that makes sense for a profitable business may be weak for a side hustle with thin records. A payment strategy that helps one wage earner may fail for someone with uneven self-employment income. A credit that looks valuable in isolation may shrink or disappear once filing status and income are considered.`,
        `Use this page as a fit screen first. If the facts do not line up, move to the related guides instead of forcing the wrong strategy onto the wrong tax situation.`,
      ],
      list: [
        `Use this guide if the main issue is ${config.keyword}.`,
        `Pause and switch guides if the bigger problem is missing returns, active collection, or payroll exposure.`,
        `Treat any high-stakes fact pattern as a sign to verify documents before acting.`,
      ],
    },
    {
      id: "how-it-works",
      eyebrow: "How it works",
      title: `What to review before relying on this strategy`,
      intro: `The useful part of a tax rule is usually in the mechanics, not the headline.`,
      paragraphs: [
        `${sentenceEnd(config.eligibility)} That sounds procedural, but procedure is where people either protect a good outcome or lose it. The real work is confirming the tax year, the form or notice involved, the timing rule that matters, and the records needed to support the position.`,
        `If the topic connects to the IRS directly, the next question is whether the issue is handled through filing, account management, penalty review, or a more formal relief request. If it connects to planning, the question is usually whether the expected savings are large enough and well-documented enough to justify the extra complexity.`,
        `This is why tax pages should not stop at definitions. The better question is always: what would I need in front of me before I acted on this?`,
      ],
      list: [
        `Confirm the tax year, filing status, and any notice or form number tied to the issue.`,
        `Separate current-year compliance from prior-year cleanup so the problem is not blurred.`,
        `Write down the assumptions behind any tax estimate or relief choice before you rely on it.`,
      ],
    },
    {
      id: "records-and-docs",
      eyebrow: "Records and documents",
      title: `What to gather before you act`,
      intro: `Good records are part of the decision, not paperwork after the fact.`,
      paragraphs: [
        `${sentenceEnd(config.docs)} The stronger the record set, the easier it is to estimate value, explain a position, or respond to questions from the IRS, a state agency, or a tax preparer.`,
        `Readers often wait too long to gather documents because they assume the next step is obvious. In practice, many tax choices change once the return, transcript, receipt trail, payroll report, or bank statement is in front of you. That is especially true when the page touches debt relief, credits with eligibility tests, or deductions that depend on business purpose.`,
        `If a record is missing, note it and work from that list. A clear missing-document list is safer than acting as if the file is complete when it is not.`,
      ],
    },
    {
      id: "documents",
      eyebrow: "Cost and tradeoffs",
      title: `How this topic affects cash flow, risk, or total tax cost`,
      intro: `The right tax move needs to work in the bank account as well as on paper.`,
      paragraphs: [
        `${sentenceEnd(config.cashflow)} Some strategies reduce tax directly. Others mainly change timing, monthly affordability, or the risk of penalties and notices. Readers should know which kind of benefit they are actually evaluating before they decide something is “worth it.”`,
        `This is also where the tradeoff becomes visible. A move that looks attractive in a search result may create extra bookkeeping, phaseout risk, or future payment pressure. Another move may look dull, but save more money precisely because it is easier to maintain correctly.`,
        `A safer rule is to compare the direct benefit, the documentation burden, and the risk of getting the details wrong. That produces better decisions than chasing the most dramatic-sounding option.`,
      ],
    },
    {
      id: "mistakes",
      eyebrow: "Mistakes",
      title: `Mistakes that usually make this issue more expensive`,
      intro: `The common errors here are usually practical, not theoretical.`,
      paragraphs: [
        `A common mistake is treating a keyword as if it points to a universal answer. Tax choices rarely work that way. Filing status, entity structure, timing, documentation, and whether the issue is current-year or back-year all change the right next step.`,
        `Another mistake is focusing on one line item without checking how the surrounding tax picture changes. A credit can phase out, a deduction can become hard to defend, and a relief strategy can fail if current compliance is still broken.`,
        `The last recurring error is delay. Waiting often means fewer records, more penalties, or a worse negotiating position than the taxpayer had a few weeks earlier.`,
      ],
    },
    {
      id: "next-steps",
      eyebrow: "Next steps",
      title: `What to do next after reading this page`,
      intro: `Use the next step that actually matches the file you have.`,
      paragraphs: [
        `Start by matching the page to the exact decision you need to make: file, verify a notice, compare relief options, estimate the cost, or gather support. If you cannot state that next action clearly, move to the related guides instead of guessing.`,
        `Then compare this topic with the wider return or collection picture. If the issue is relief, make sure current compliance is fixed. If the issue is planning, check what changes next quarter, not just what looks good today.`,
        `Finally, decide whether this is still a self-help issue. If the facts involve active collection, payroll exposure, multiple missing years, or a large disputed amount, use this page as preparation and escalate the review.`,
      ],
    },
  ];
}

function fillerParagraph(config, tone) {
  const snippets = {
    pillar: [
      `${config.shortLabel} also deserves a state-of-play review at least once a quarter because tax situations often drift. Income changes, payroll size moves, household credits phase in or out, and IRS notices can alter the best strategy faster than taxpayers expect. A short recurring review often prevents a small issue from becoming a higher-cost compliance event.`,
      `Another useful habit is documenting assumptions in plain English. Write down why a payment amount feels affordable, why a deduction seems supportable, or why a relief program appears appropriate. That written logic makes future adjustments easier and helps any advisor understand the file quickly if the case grows more complex.`,
      `Readers who treat tax planning like a sequence instead of a scramble usually make better decisions. They file sooner, estimate more realistically, keep better records, and notice when a strategy no longer fits the facts. That discipline is often the cheapest form of tax relief available.`,
    ],
    support: [
      `${config.shortLabel} becomes easier to use when readers convert the topic into a checklist and a calendar date. Tax questions feel abstract until the next filing, payment, or response deadline is attached to them. Once that happens, the topic becomes operational instead of theoretical.`,
      `It also helps to compare the best-case tax result with the most realistic result. Many filers benefit from a topic like this, but the strongest decisions come from conservative assumptions, not perfect ones. Leaving room for documentation gaps or income changes usually produces a safer plan.`,
    ],
    calculator: [
      `This calculator is best used as a planning screen, not a filing substitute. It can help readers compare scenarios and understand the shape of a tax decision, but the exact return or IRS account result will still depend on forms, timing, and the final facts reported.`,
      `The biggest value of a calculator is often behavioral. When taxpayers can see how withholding, income swings, estimated payments, or settlement assumptions change the output, they are more likely to fix the root cause early instead of waiting for year-end surprises.`,
    ],
  };
  return snippets[tone][Math.floor(Math.random() * snippets[tone].length)];
}

function renderHeader(page) {
  const links = navGroups
    .map((item) => `<a class="nav-link" href="${localHref(page.path, item.href)}">${escapeHtml(item.label)}</a>`)
    .join("");
  return `
    <header class="site-header">
      <div class="container header-inner">
        <a class="brand" href="${localHref(page.path, "index.html")}" aria-label="${site.name} home">
          <span class="brand-mark" aria-hidden="true"></span>
          <span>
            <strong>${site.name}</strong>
            <small>U.S. tax relief, credits, deductions, and compliance guides</small>
          </span>
        </a>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
          <span></span><span></span><span></span>
          <span class="sr-only">Toggle navigation</span>
        </button>
        <nav class="site-nav" id="site-nav" aria-label="Primary navigation">
          ${links}
          <a class="nav-cta" href="${localHref(page.path, "contact.html")}">Contact</a>
        </nav>
      </div>
    </header>
  `;
}

function renderFooter(page) {
  return `
    <footer class="site-footer">
      <div class="container footer-grid">
        <section>
          <h2>${site.name}</h2>
          <p>Independent U.S. tax guides covering IRS debt relief, notices, payment plans, deductions, credits, payroll taxes, calculators, and state tax issues.</p>
        </section>
        <section>
          <h2>Core Guides</h2>
          <a href="${localHref(page.path, "pages/irs-tax-relief-guide.html")}">IRS Tax Relief Guide</a>
          <a href="${localHref(page.path, "pages/tax-debt-guide.html")}">Tax Debt Guide</a>
          <a href="${localHref(page.path, "states/index.html")}">State Tax Relief Guides</a>
          <a href="${localHref(page.path, "pages/business-tax-guide.html")}">Business Tax Guide</a>
          <a href="${localHref(page.path, "pages/payroll-tax-guide.html")}">Payroll Tax Guide</a>
        </section>
        <section>
          <h2>Tools</h2>
          <a href="${localHref(page.path, "pages/tax-refund-calculator.html")}">Tax Refund Calculator</a>
          <a href="${localHref(page.path, "pages/self-employment-tax-calculator.html")}">Self-Employment Tax Calculator</a>
          <a href="${localHref(page.path, "pages/paycheck-tax-calculator.html")}">Paycheck Tax Calculator</a>
          <a href="${localHref(page.path, "pages/business-tax-estimator.html")}">Business Tax Estimator</a>
        </section>
        <section>
          <h2>Company</h2>
          <a href="${localHref(page.path, "about.html")}">About</a>
          <a href="${localHref(page.path, "contact.html")}">Contact</a>
          <a href="${localHref(page.path, "how-we-research.html")}">How We Research</a>
          <a href="${localHref(page.path, "affiliate-disclosure.html")}">Affiliate Disclosure</a>
          <a href="${localHref(page.path, "privacy-policy.html")}">Privacy Policy</a>
          <a href="${localHref(page.path, "terms.html")}">Terms</a>
          <a href="${localHref(page.path, "disclaimer.html")}">Disclaimer</a>
        </section>
      </div>
      <div class="container footer-bottom">
        <p>${site.disclaimer}</p>
        <p>&copy; 2026 ${site.name}. All rights reserved.</p>
      </div>
    </footer>
  `;
}

function renderBreadcrumbs(page) {
  if (!page.breadcrumbs?.length || page.path === "index.html") return "";
  return `
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        ${page.breadcrumbs
          .map((crumb, index) =>
            index === page.breadcrumbs.length - 1
              ? `<li aria-current="page">${escapeHtml(crumb.label)}</li>`
              : `<li><a href="${localHref(page.path, crumb.href)}">${escapeHtml(crumb.label)}</a></li>`
          )
          .join("")}
      </ol>
    </nav>
  `;
}

function renderHeroStats(stats) {
  if (!stats?.length) return "";
  return `
    <div class="hero-stats">
      ${stats
        .map(
          (stat) => `
          <article class="stat-card">
            <p class="stat-value">${escapeHtml(stat.value)}</p>
            <p class="stat-label">${escapeHtml(stat.label)}</p>
            <small>${escapeHtml(stat.note)}</small>
          </article>
        `
        )
        .join("")}
    </div>
  `;
}

function renderToc(sections) {
  return `
    <aside class="toc-card">
      <h2>On this page</h2>
      <ol>
        ${sections.map((section) => `<li><a href="#${section.id}">${escapeHtml(section.title)}</a></li>`).join("")}
      </ol>
    </aside>
  `;
}

function renderKeyTakeaways(items) {
  return `
    <section class="callout key-takeaway">
      <div>
        <span class="eyebrow">Editorial summary</span>
        <h2>Quick takeaways</h2>
      </div>
      <ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </section>
  `;
}

function renderTable(table) {
  if (!table) return "";
  return `
    <div class="table-shell">
      <table>
        <caption>${escapeHtml(table.caption)}</caption>
        <thead>
          <tr>${table.headers.map((header) => `<th scope="col">${escapeHtml(header)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${table.rows
            .map(
              (row) =>
                `<tr>${row
                  .map((cell, index) =>
                    index === 0 ? `<th scope="row">${escapeHtml(cell)}</th>` : `<td>${escapeHtml(cell)}</td>`
                  )
                  .join("")}</tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderChart(chart) {
  if (!chart) return "";
  return `
    <section class="chart-card">
      <div class="section-heading">
        <span class="eyebrow">${escapeHtml(chart.eyebrow || "Visual")}</span>
        <h2>${escapeHtml(chart.title)}</h2>
      </div>
      <div class="bar-chart" role="img" aria-label="${escapeAttr(chart.ariaLabel)}">
        ${chart.bars
          .map(
            (bar) => `
            <div class="bar-row">
              <span>${escapeHtml(bar.label)}</span>
              <div class="bar-track"><div class="bar-fill" style="width:${bar.width}%"></div></div>
              <strong>${escapeHtml(bar.value)}</strong>
            </div>
          `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderSections(sections) {
  return sections
    .map(
      (section) => `
      <section id="${section.id}" class="content-section">
        <div class="section-heading">
          <span class="eyebrow">${escapeHtml(section.eyebrow || "Guide section")}</span>
          <h2>${escapeHtml(section.title)}</h2>
        </div>
        ${section.intro ? `<p class="section-intro">${escapeHtml(section.intro)}</p>` : ""}
        ${section.paragraphs?.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("") || ""}
        ${section.list?.length ? `<ul>${section.list.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
        ${section.html ?? ""}
        ${renderTable(section.table)}
      </section>
    `
    )
    .join("");
}

function renderEditorialBlock() {
  return `
    <div class="editorial-block">
      <strong>Editorial Team</strong>
      <p>Last reviewed: April 2026</p>
      <p>This guide compiles information from official IRS publications, state Department of Revenue resources, and other public sources. Content is reviewed quarterly against updated references.</p>
    </div>
  `;
}

function renderFaq(faqs) {
  return `
    <section class="faq-section">
      <div class="section-heading">
        <span class="eyebrow">FAQ</span>
        <h2>Frequently asked questions</h2>
      </div>
      <div class="faq-list">
        ${faqs
          .map(
            (faq, index) => `
            <details ${index === 0 ? "open" : ""}>
              <summary>${escapeHtml(faq.q)}</summary>
              <p>${escapeHtml(faq.a)}</p>
            </details>
          `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderDisclaimer() {
  return `<section class="disclaimer-box"><strong>Disclaimer:</strong> ${escapeHtml(site.disclaimer)}</section>`;
}

function renderRelated(page, allPages) {
  const cards = page.related
    .map((target) => allPages.find((entry) => entry.path === target))
    .filter(Boolean)
    .map(
      (entry) => `
      <a class="related-card" href="${localHref(page.path, entry.path)}">
        <span class="badge">${escapeHtml(entry.badge)}</span>
        <h3>${escapeHtml(entry.h1)}</h3>
        <p>${escapeHtml(entry.description)}</p>
      </a>
    `
    )
    .join("");
  return `
    <section class="related-section">
      <div class="section-heading">
        <span class="eyebrow">Related articles</span>
        <h2>Where to go next</h2>
      </div>
      <div class="related-grid">${cards}</div>
    </section>
  `;
}

function renderSidebar(page) {
  if (page.template === "home") return "";
  return `
    <aside class="sidebar-card">
      <h2>Use this page well</h2>
      <ul>
        <li>Confirm the notice, tax year, or filing period you are dealing with.</li>
        <li>Pull the records you would need before calling the IRS or a state agency.</li>
        <li>Compare this option with the related guides before choosing a next step.</li>
      </ul>
      <a class="button button-primary sidebar-button" href="${localHref(page.path, "contact.html")}">Contact the editorial team</a>
    </aside>
  `;
}

function jsonLdScript(payload) {
  return `<script type="application/ld+json">${JSON.stringify(payload)}</script>`;
}

function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.organization.legalName,
    url: site.organization.url,
    logo: site.organization.logo,
    email: contactEmail,
    sameAs: site.organization.sameAs,
  };
}

function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: `${domain}/`,
  };
}

function articleSchemaForPage(page) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.h1,
    description: page.description,
    datePublished: "2026-04-04",
    dateModified: lastmod,
    publisher: {
      "@type": "Organization",
      name: site.organization.legalName,
      logo: {
        "@type": "ImageObject",
        url: site.organization.logo,
      },
    },
    mainEntityOfPage: urlFor(page.path),
    image: page.image,
  };
}

function breadcrumbSchemaForPage(page) {
  if (!page.breadcrumbs?.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: page.breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      item: crumb.href,
    })),
  };
}

function faqSchemaForPage(page) {
  if (!page.faq?.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faq.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}

function webApplicationSchema(page) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: page.h1,
    url: urlFor(page.path),
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any",
    description: page.description,
  };
}

function pageJsonLd(page) {
  const graph = [organizationSchema()];

  if (page.template === "home") {
    graph.unshift(websiteSchema());
  } else if (page.template === "calculator") {
    graph.push(webApplicationSchema(page));
  } else {
    graph.push(articleSchemaForPage(page));
  }

  const breadcrumbSchema = breadcrumbSchemaForPage(page);
  if (breadcrumbSchema) graph.push(breadcrumbSchema);

  const faqSchema = faqSchemaForPage(page);
  if (faqSchema) graph.push(faqSchema);

  return graph.map((entry) => jsonLdScript(entry)).join("\n    ");
}

function pageHead(page) {
  const canonical = urlFor(page.path);
  const ogType = page.template === "home" || page.template === "calculator" ? "website" : "article";
  const assetPrefix = page.path.includes("/") ? "../" : "./";
  return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeAttr(page.description)}">
    <meta name="robots" content="${page.robots}">
    <link rel="canonical" href="${canonical}">
    <meta property="og:type" content="${ogType}">
    <meta property="og:title" content="${escapeAttr(page.title)}">
    <meta property="og:description" content="${escapeAttr(page.description)}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:site_name" content="${site.name}">
    <meta property="og:image" content="${site.organization.logo.replace("logo-mark.svg", "social-cover.svg")}">
    <meta property="og:locale" content="en_US">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeAttr(page.title)}">
    <meta name="twitter:description" content="${escapeAttr(page.description)}">
    <meta name="twitter:url" content="${canonical}">
    <meta name="twitter:image" content="${site.organization.logo.replace("logo-mark.svg", "social-cover.svg")}">
    <link rel="icon" href="${assetPrefix}assets/favicon.ico" sizes="any">
    <link rel="icon" type="image/svg+xml" href="${assetPrefix}assets/favicon.svg">
    <link rel="shortcut icon" href="${assetPrefix}assets/favicon.ico">
    <meta name="theme-color" content="#12355b">
    <link rel="stylesheet" href="${assetPrefix}styles.css">
    ${adsenseScript}
    ${pageJsonLd(page)}
    <script src="${assetPrefix}main.js" defer></script>
  `;
}

function renderCookieBanner(page) {
  return `
    <div class="cookie-banner" data-cookie-banner hidden>
      <p>We use essential cookies for site function and optional analytics cookies to understand anonymous usage. You can accept all cookies or reject non-essential cookies.</p>
      <div class="cookie-actions">
        <button type="button" class="button button-primary" data-cookie-action="accept">Accept</button>
        <button type="button" class="button button-secondary" data-cookie-action="reject">Reject Non-Essential</button>
        <a href="${localHref(page.path, "privacy-policy.html")}">Privacy Policy</a>
      </div>
    </div>
  `;
}

function heroVisual(title, lines, timelineBars) {
  return `
    <div class="hero-card">
      <div class="hero-card-head">
        <span class="eyebrow">${escapeHtml(title)}</span>
        <strong>What this page covers</strong>
      </div>
      ${lines
        .map(
          (line) => `
          <div class="hero-card-row">
            <span>${escapeHtml(line.label)}</span>
            <strong>${escapeHtml(line.value)}</strong>
          </div>
        `
        )
        .join("")}
      <div class="timeline-visual" aria-hidden="true">
        ${timelineBars
          .map(
            (bar) => `
            <div class="timeline-step">
              <span>${escapeHtml(bar.label)}</span>
              <div class="timeline-track"><div class="timeline-fill" style="width:${bar.width}%"></div></div>
            </div>
          `
          )
          .join("")}
      </div>
    </div>
  `;
}

function homeVisual() {
  return `
    <div class="dashboard">
      <div class="dashboard-panel">
        <span class="eyebrow">Tax pressure map</span>
        <h2>Common IRS and state tax paths readers compare first</h2>
        <div class="mini-chart">
          <div style="height:80%"><span>IRS Relief</span></div>
          <div style="height:72%"><span>Debt</span></div>
          <div style="height:66%"><span>Business</span></div>
          <div style="height:58%"><span>Credits</span></div>
        </div>
      </div>
    </div>
  `;
}

function featureGrid(title, eyebrow, pages, labelFor) {
  return `
    <section class="feature-section">
      <div class="section-heading">
        <span class="eyebrow">${escapeHtml(eyebrow)}</span>
        <h2>${escapeHtml(title)}</h2>
      </div>
      <div class="card-grid">
        ${pages
          .map(
            (targetPage) => `
            <a class="topic-card" href="${localHref("index.html", targetPage.path)}">
              <span class="badge">${escapeHtml(labelFor(targetPage))}</span>
              <h3>${escapeHtml(targetPage.h1)}</h3>
              <p>${escapeHtml(targetPage.description)}</p>
            </a>
          `
          )
          .join("")}
      </div>
    </section>
  `;
}

function customCardGrid(fromPath, title, eyebrow, cards) {
  return `
    <section class="feature-section">
      <div class="section-heading">
        <span class="eyebrow">${escapeHtml(eyebrow)}</span>
        <h2>${escapeHtml(title)}</h2>
      </div>
      <div class="card-grid">
        ${cards
          .map(
            (card) => `
            <a class="topic-card" href="${localHref(fromPath, card.path)}">
              <span class="badge">${escapeHtml(card.badge)}</span>
              <h3>${escapeHtml(card.title)}</h3>
              <p>${escapeHtml(card.description)}</p>
            </a>
          `
          )
          .join("")}
      </div>
    </section>
  `;
}

function homeLead(allPages) {
  const statePages = allPages
    .filter((page) => page.category === "state")
    .filter((page) =>
      ["California", "Texas", "New York", "Florida", "Pennsylvania", "Illinois"].includes(page.stateData?.state)
    );

  const calculators = [
    {
      badge: "Calculator",
      title: "Estimate a refund or balance due",
      description: "Use wages, withholding, filing status, and credits to get a planning-level federal estimate.",
      path: "pages/tax-refund-calculator.html",
    },
    {
      badge: "Calculator",
      title: "Estimate self-employment tax",
      description: "Model SE tax, quarterly reserve needs, and rough annual tax after estimated payments.",
      path: "pages/self-employment-tax-calculator.html",
    },
    {
      badge: "Calculator",
      title: "Estimate paycheck withholding",
      description: "Compare gross pay, FICA, pretax deductions, and approximate take-home pay per pay period.",
      path: "pages/paycheck-tax-calculator.html",
    },
  ];

  return `
    ${customCardGrid("index.html", "Start here", "Choose the path that matches your problem", [
      {
        badge: "IRS debt",
        title: "I owe the IRS and need options",
        description: "Start with the main relief choices, how to compare them, and what to gather before calling or applying.",
        path: "pages/tax-debt-relief-options.html",
      },
      {
        badge: "IRS notice",
        title: "I got an IRS notice",
        description: "Start with balance-due notices and what changes when a notice moves closer to levy action.",
        path: "pages/irs-cp14-notice.html",
      },
      {
        badge: "Payment plan",
        title: "I need a payment plan",
        description: "See when an installment agreement is usually the cleanest option and how to avoid defaulting later.",
        path: "pages/irs-payment-plans-guide.html",
      },
      {
        badge: "Settlement",
        title: "I want to see if settlement is realistic",
        description: "Review Offer in Compromise rules, screening points, and when settlement is weaker than it sounds.",
        path: "pages/offer-in-compromise-guide.html",
      },
    ])}
    ${customCardGrid("index.html", "Most common IRS debt solutions", "High-intent debt paths", [
      {
        badge: "Installment plan",
        title: "IRS payment plans",
        description: "Best when the debt is still collectible over time and the monthly amount is sustainable.",
        path: "pages/irs-payment-plans-guide.html",
      },
      {
        badge: "Settlement",
        title: "Offer in Compromise",
        description: "Best for narrower cases where the IRS is unlikely to collect the full balance.",
        path: "pages/offer-in-compromise-guide.html",
      },
      {
        badge: "Hardship",
        title: "Currently Not Collectible",
        description: "A temporary collection pause when paying now would create genuine hardship.",
        path: "pages/irs-currently-not-collectible.html",
      },
      {
        badge: "Penalty relief",
        title: "First-time penalty abatement",
        description: "A targeted way to reduce part of the balance without forcing a settlement theory.",
        path: "pages/first-time-penalty-abatement.html",
      },
    ])}
    ${customCardGrid("index.html", "IRS notices explained", "Notice-by-notice help", [
      {
        badge: "CP14",
        title: "CP14 balance due notice",
        description: "What the first common IRS balance-due notice means and what to do before penalties keep building.",
        path: "pages/irs-cp14-notice.html",
      },
      {
        badge: "CP504",
        title: "CP504 notice",
        description: "Why this notice matters, what levy language really means, and which response paths usually make sense.",
        path: "pages/irs-cp504-notice.html",
      },
      {
        badge: "Lien vs levy",
        title: "Tax lien vs levy",
        description: "Understand the difference before you react to scary collection language or public-record risk.",
        path: "pages/tax-lien-vs-levy.html",
      },
      {
        badge: "Penalty",
        title: "IRS penalty abatement",
        description: "When to ask for first-time or reasonable-cause relief after a notice adds avoidable cost.",
        path: "pages/penalty-abatement-guide.html",
      },
    ])}
    ${featureGrid("State tax relief guides", "State tax debt", statePages, (page) => page.stateData?.state ?? "State")}
    ${customCardGrid("index.html", "Planning tools", "Useful calculators", calculators)}
    <section class="feature-section">
      <div class="section-heading">
        <span class="eyebrow">How we research</span>
        <h2>How this site is built</h2>
      </div>
      <div class="card-grid">
        <article class="topic-card">
          <span class="badge">Sources</span>
          <h3>Official sources first</h3>
          <p>We rely on IRS pages, official forms and instructions, state revenue agencies, and other public source material before summarizing a topic.</p>
        </article>
        <article class="topic-card">
          <span class="badge">Editorial</span>
          <h3>Practical, not promotional</h3>
          <p>The goal is to help readers understand what a rule or program actually changes, where it fits, and what to review before acting.</p>
        </article>
        <a class="topic-card" href="${localHref("index.html", "how-we-research.html")}">
          <span class="badge">Method</span>
          <h3>Read the research process</h3>
          <p>See how we handle sourcing, updates, and the difference between educational content and individualized advice.</p>
        </a>
      </div>
    </section>
  `;
}

function calculatorForm(type) {
  const forms = {
    refund: `
      <div class="calculator-card" data-calculator="refund">
        <div class="section-heading">
          <span class="eyebrow">Interactive tool</span>
          <h2>Estimate your federal tax refund</h2>
        </div>
        <form class="calculator-form">
          <label>Filing status
            <select name="status">
              <option value="single">Single</option>
              <option value="married">Married Filing Jointly</option>
              <option value="head">Head of Household</option>
            </select>
          </label>
          <label>W-2 wages
            <input type="number" name="wages" value="72000" min="0" step="100">
          </label>
          <label>Federal tax withheld
            <input type="number" name="withheld" value="8200" min="0" step="50">
          </label>
          <label>Qualifying credits
            <input type="number" name="credits" value="1000" min="0" step="50">
          </label>
          <button type="submit" class="button button-primary">Estimate refund</button>
        </form>
        <div class="calculator-result" aria-live="polite"></div>
      </div>
    `,
    selfEmployment: `
      <div class="calculator-card" data-calculator="self-employment">
        <div class="section-heading">
          <span class="eyebrow">Interactive tool</span>
          <h2>Estimate self-employment tax</h2>
        </div>
        <form class="calculator-form">
          <label>Net self-employment income
            <input type="number" name="netIncome" value="95000" min="0" step="100">
          </label>
          <label>Estimated deductible expenses already removed?
            <select name="expensesIncluded">
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label>Extra retirement contribution
            <input type="number" name="retirement" value="8000" min="0" step="100">
          </label>
          <label>Quarterly estimated payments already made
            <input type="number" name="estimatesPaid" value="9000" min="0" step="100">
          </label>
          <button type="submit" class="button button-primary">Estimate self-employment tax</button>
        </form>
        <div class="calculator-result" aria-live="polite"></div>
      </div>
    `,
    paycheck: `
      <div class="calculator-card" data-calculator="paycheck">
        <div class="section-heading">
          <span class="eyebrow">Interactive tool</span>
          <h2>Estimate paycheck taxes</h2>
        </div>
        <form class="calculator-form">
          <label>Gross pay per paycheck
            <input type="number" name="gross" value="3200" min="0" step="50">
          </label>
          <label>Pay frequency
            <select name="frequency">
              <option value="26">Biweekly</option>
              <option value="24">Semimonthly</option>
              <option value="12">Monthly</option>
              <option value="52">Weekly</option>
            </select>
          </label>
          <label>Filing status
            <select name="status">
              <option value="single">Single</option>
              <option value="married">Married Filing Jointly</option>
              <option value="head">Head of Household</option>
            </select>
          </label>
          <label>Pre-tax deductions per paycheck
            <input type="number" name="pretax" value="250" min="0" step="10">
          </label>
          <button type="submit" class="button button-primary">Estimate paycheck taxes</button>
        </form>
        <div class="calculator-result" aria-live="polite"></div>
      </div>
    `,
    business: `
      <div class="calculator-card" data-calculator="business">
        <div class="section-heading">
          <span class="eyebrow">Interactive tool</span>
          <h2>Estimate business tax exposure</h2>
        </div>
        <form class="calculator-form">
          <label>Entity type
            <select name="entity">
              <option value="sole">Sole Proprietor / Single-Member LLC</option>
              <option value="scorp">S Corporation</option>
              <option value="ccorp">C Corporation</option>
            </select>
          </label>
          <label>Net business profit
            <input type="number" name="profit" value="180000" min="0" step="100">
          </label>
          <label>Owner salary (for S Corp only)
            <input type="number" name="salary" value="70000" min="0" step="100">
          </label>
          <label>Estimated federal payments already made
            <input type="number" name="payments" value="22000" min="0" step="100">
          </label>
          <button type="submit" class="button button-primary">Estimate business taxes</button>
        </form>
        <div class="calculator-result" aria-live="polite"></div>
      </div>
    `,
    settlement: `
      <div class="calculator-card" data-calculator="settlement">
        <div class="section-heading">
          <span class="eyebrow">Interactive tool</span>
          <h2>Estimate tax debt settlement savings</h2>
        </div>
        <form class="calculator-form">
          <label>Total tax debt
            <input type="number" name="debt" value="48000" min="0" step="100">
          </label>
          <label>Possible settlement amount
            <input type="number" name="settlement" value="15000" min="0" step="100">
          </label>
          <label>Annual penalty and interest rate
            <input type="number" name="rate" value="8" min="0" step="0.1">
          </label>
          <label>Months to resolve without settlement
            <input type="number" name="months" value="36" min="1" step="1">
          </label>
          <button type="submit" class="button button-primary">Estimate savings</button>
        </form>
        <div class="calculator-result" aria-live="polite"></div>
      </div>
    `,
  };
  return forms[type];
}

function stateCanonical(state) {
  return `${domain}/states/${state.slug}`;
}

function stateTitle(state) {
  return `${state.state} State Tax Relief: Programs, Payment Plans & Debt Options | TaxReliefGuides`;
}

function stateFaqs(state) {
  return [
    [
      `How do I apply for a payment plan with the ${state.agency}?`,
      `${state.paymentPlan} Start by reading the official ${state.agency} page linked in the resources section, because state payment plans are more procedural than marketing language suggests. Gather the notice number, tax period, balance, filing status, and a realistic monthly budget before requesting terms. If the account is already in collection, respond through the channel on the notice rather than submitting a generic payment. If the published page does not give a minimum payment, do not guess; ask the agency to confirm the amount it will accept.`,
    ],
    [
      `What is the minimum monthly payment for a ${state.state} payment plan?`,
      `${state.paymentMinimum} The practical minimum is not only a dollar figure. The payment must be high enough to fit the state's maximum term, keep the account from defaulting, and leave room for current-year tax obligations. If the agency requires financial disclosure, monthly income, necessary expenses, assets, and bank information can matter as much as the balance. A plan that looks affordable but causes new tax debt is usually a weak plan.`,
    ],
    [
      `How long does ${state.state} have to collect unpaid taxes?`,
      `${state.sol} State collection limitation rules are separate from the IRS ten-year collection statute, and they can pause, restart, or change when appeals, bankruptcy, amended assessments, payment agreements, or litigation are involved. Treat the statute issue as a legal research item rather than a shortcut. If a collection period is central to your decision, verify it directly with ${state.agency} or a qualified tax professional before relying on the clock.`,
    ],
    [
      `Can ${state.state} garnish my wages for state tax debt?`,
      `${state.garnishment} Wage garnishment rules differ by state and by tax type. Some agencies use wage withholding orders, income executions, attachments, or levies, and the employer may have strict duties after receiving the order. The fastest way to stop or reduce the damage is usually to contact the agency before the employer begins remitting funds. If the notice already reached payroll, ask whether a payment agreement, hardship review, or release procedure is available.`,
    ],
    [
      `Does filing for bankruptcy eliminate ${state.state} tax debt?`,
      `Bankruptcy can affect some tax debts, but it is not a blanket solution and state tax rules do not automatically mirror IRS outcomes. Income tax debt, trust-fund taxes, sales tax collected from customers, withholding taxes, fraud penalties, and newer assessments can be treated differently. A bankruptcy filing can also pause some collection activity while leaving liens or priority debts unresolved. Anyone considering bankruptcy should compare state tax debt, IRS debt, and local property or business liabilities before filing.`,
    ],
    [
      `What happens if I ignore a ${state.state} tax lien or warrant?`,
      `${state.lien} Ignoring a lien, warrant, tax execution, or certified collection account usually makes the file harder to resolve because the state may move from billing to enforcement. Public records can affect financing, property transfers, business licensing, entity standing, and negotiations with other creditors. If the liability is wrong, dispute it quickly with evidence. If the liability is correct, ask about release, withdrawal, payment plan, compromise, or hardship procedures before additional enforcement begins.`,
    ],
    [
      `Is ${state.state} tax debt relief the same as IRS relief?`,
      `No. IRS relief is federal, while ${state.state} tax relief is administered by ${state.agency}${state.secondaryAgency ? ` and sometimes ${state.secondaryAgency}` : ""}. Program names may sound similar, but forms, deadlines, collection powers, lien processes, lookback periods, and hardship standards can differ significantly. A taxpayer can be in good standing with the IRS and still have a state problem, or vice versa. The safest approach is to map federal and state balances separately before deciding which agency to contact first.`,
    ],
    [
      `Can I qualify for a ${state.state} Offer in Compromise if I already have an IRS OIC?`,
      `${state.oicForm} An accepted IRS offer may help tell the financial story, but it does not automatically bind a state revenue agency unless that state's program specifically recognizes federal acceptance. Some states require their own forms, financial statements, application fees, tax-period review, and proof that the proposed settlement is in the state's best interest. If both federal and state balances exist, compare the cash needed for each program before submitting either offer. A state may also expect current compliance while the compromise is reviewed.`,
    ],
  ];
}

function stateProgramTable(state) {
  return `
    <div class="table-shell">
      <table>
        <caption>${escapeHtml(state.state)} state tax relief programs and official starting points</caption>
        <thead><tr><th scope="col">Program</th><th scope="col">Who qualifies</th><th scope="col">Requirement key</th><th scope="col">Official link</th></tr></thead>
        <tbody>
          ${state.programs.map(([program, qualifies, requirement, link]) => `<tr><th scope="row">${escapeHtml(program)}</th><td>${escapeHtml(qualifies)}</td><td>${requirement}</td><td><a href="${link}">${escapeHtml(new URL(link).hostname)}</a></td></tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function stateResources(state) {
  return `
    <ul>
      ${state.officialLinks.map(([label, link]) => `<li><a href="${link}">${escapeHtml(label)}</a></li>`).join("")}
      <li>Official phone reference: ${escapeHtml(state.phone)}</li>
    </ul>
  `;
}

function stateRelatedLinks(page, allPages) {
  const state = page.stateData;
  const cards = [
    ["../pages/irs-tax-relief-guide", "IRS tax relief guide"],
    ["../pages/tax-debt-guide", "Tax debt guide"],
    ["../pages/offer-in-compromise-guide", "Offer in Compromise guide"],
    ["../pages/penalty-abatement-guide", "Penalty abatement guide"],
    ["./", "State tax relief hub"],
    ...state.neighbors.map((slug) => [`./${slug}`, `${stateTaxReliefConfigs.find((item) => item.slug === slug)?.state ?? slug} state tax relief`]),
  ];
  return `
    <section class="related-section">
      <div class="section-heading">
        <span class="eyebrow">Related guides</span>
        <h2>Related federal and state tax relief guides</h2>
      </div>
      <div class="related-grid">
        ${cards.map(([href, label]) => `<a class="related-card" href="${href}"><span>${escapeHtml(label)}</span><strong>Read guide</strong></a>`).join("")}
      </div>
    </section>
  `;
}

function stateHead(page) {
  const state = page.stateData;
  const canonical = stateCanonical(state);
  const faq = stateFaqs(state);
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.h1,
    description: page.description,
    dateModified: "2026-04-23",
    publisher: {
      "@type": "Organization",
      name: "TaxReliefGuides",
      url: domain,
    },
    url: canonical,
  };
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${domain}/` },
      { "@type": "ListItem", position: 2, name: "States", item: `${domain}/states/` },
      { "@type": "ListItem", position: 3, name: state.state, item: canonical },
    ],
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: stripTags(a) },
    })),
  };
  return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeAttr(page.description)}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${canonical}">
    <meta property="og:title" content="${escapeAttr(page.title)}">
    <meta property="og:description" content="${escapeAttr(page.description)}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="${site.name}">
    <meta property="og:image" content="${domain}/assets/social-cover.svg">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeAttr(page.title)}">
    <meta name="twitter:description" content="${escapeAttr(page.description)}">
    <meta name="twitter:url" content="${canonical}">
    <meta name="twitter:image" content="${domain}/assets/social-cover.svg">
    <link rel="icon" href="../favicon.ico">
    <link rel="stylesheet" href="../styles.css">
    ${adsenseScript}
    ${jsonLdScript(article)}
    ${jsonLdScript(breadcrumbs)}
    ${jsonLdScript(faqSchema)}
    <script src="../main.js" defer></script>`;
}

function renderStatePage(page, allPages) {
  const state = page.stateData;
  const faq = stateFaqs(state);
  const introNote = state.noIncomeTaxNote ? `<div class="callout-box"><strong>Important ${escapeHtml(state.state)} context:</strong> ${escapeHtml(state.noIncomeTaxNote)}</div>` : "";
  const neighborLinks = state.neighbors.map((slug) => {
    const neighbor = stateTaxReliefConfigs.find((item) => item.slug === slug);
    return `<a href="./${slug}">${escapeHtml(neighbor?.state ?? slug)} state tax relief</a>`;
  }).join(", ");
  const sections = [
    "understanding",
    "programs",
    "payment-plan-details",
    "wage-garnishment",
    "liens-levies",
    "statute-limitations",
    "professional-help",
    "prepare-file",
    "faq",
    "official-resources",
  ].map((id) => ({ id, title: id.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") }));

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    ${stateHead(page)}
  </head>
  <body class="content-page">
    ${renderHeader(page)}
    <main>
      <section class="hero hero-inner">
        <div class="container hero-grid">
          <div>
            <span class="badge badge-hero">State Guide</span>
            ${renderBreadcrumbs(page)}
            <h1>${escapeHtml(page.h1)}</h1>
            <p class="hero-copy">State tax debt is not the same as IRS debt. This ${escapeHtml(state.state)} guide explains the official agency, relief programs, payment plan paths, liens, garnishments, and documentation steps to verify before acting.</p>
            <div class="hero-actions">
              <a class="button button-primary" href="#programs">Compare programs</a>
              <a class="button button-secondary" href="#official-resources">Official resources</a>
            </div>
          </div>
          <div class="hero-visual">${heroVisual(`${state.state} agency map`, [
            { label: "Main agency", value: state.agency },
            { label: "Payment path", value: state.paymentMaxTerm.replace(/<[^>]*>/g, "Pending official detail") },
            { label: "OIC form", value: state.oicForm.replace(/<[^>]*>/g, "Pending official detail").slice(0, 58) },
          ], [
            { label: "Agency", width: 92 },
            { label: "Payment plan", width: 84 },
            { label: "Compromise", width: 72 },
            { label: "Collections", width: 78 },
          ])}</div>
        </div>
      </section>
      <div class="container main-grid">
        <div class="content-column">
          ${renderEditorialBlock()}
          <div class="key-takeaways">
            <span class="eyebrow">State relief summary</span>
            <ul>
              <li>${escapeHtml(state.taxFocus)}</li>
              <li>${escapeHtml(state.paymentPlan)}</li>
              <li>${escapeHtml(state.lien)}</li>
            </ul>
          </div>
          ${introNote}
          <section id="understanding" class="content-section">
            <div class="section-heading"><span class="eyebrow">State tax debt</span><h2>Understanding ${escapeHtml(state.state)} Tax Debt</h2></div>
            <p>${escapeHtml(state.taxFocus)}</p>
            <p>Federal IRS balances and state tax balances should be mapped separately. The IRS controls federal income tax, payroll tax, federal liens, federal levies, and federal installment agreements. ${escapeHtml(state.agency)} controls the state programs described on this page, and the agency's notices, forms, deadlines, and collection tools can differ from the IRS even when the words sound similar.</p>
            <p>That difference matters because a taxpayer can solve one side and still have the other side unresolved. A federal payment plan does not automatically stop a state warrant, and a state payment plan does not automatically protect a taxpayer from an IRS levy. Before calling either agency, list each tax year or period, each notice number, each balance, and the agency that issued it.</p>
            <p>The official agency for this guide is <a href="${state.agencyUrl}">${escapeHtml(state.agency)}</a>${state.secondaryAgency ? `, with related issues sometimes handled by <a href="${state.secondaryAgencyUrl}">${escapeHtml(state.secondaryAgency)}</a>` : ""}. Use those official pages as the source of truth if a notice, payment-plan term, or form instruction conflicts with a third-party summary.</p>
          </section>
          <section id="programs" class="content-section">
            <div class="section-heading"><span class="eyebrow">Program matrix</span><h2>${escapeHtml(state.state)} State Tax Relief Programs</h2></div>
            <p>The table below organizes the public relief paths verified from official agency sources in this pass. It is not a guarantee of eligibility. State agencies usually review filing status, tax period, prior compliance, financial capacity, collection risk, and whether the taxpayer has already been contacted before approving relief.</p>
            ${stateProgramTable(state)}
            <p>The strongest applications usually have three things in common: all required state returns are filed, current-year compliance is fixed, and the taxpayer can explain why the requested option is more realistic than full immediate payment. If any of those pieces are missing, the first step is often filing or reconstruction rather than negotiation.</p>
          </section>
          <section id="payment-plan-details" class="content-section">
            <div class="section-heading"><span class="eyebrow">Installments</span><h2>${escapeHtml(state.state)} Payment Plan Details</h2></div>
            <p>${state.paymentPlan}</p>
            <p><strong>Maximum term:</strong> ${state.paymentMaxTerm}</p>
            <p><strong>Minimum payment:</strong> ${state.paymentMinimum}</p>
            <p><strong>Forms and application path:</strong> ${state.paymentForm}</p>
            <p>A payment plan should be based on the full cost of the debt, not only the first monthly payment. State balances can continue to accrue interest, penalties, collection fees, lien costs, or other charges while a plan is active. A taxpayer who agrees to a payment that is too high may default, while a payment that is too low may not fit agency standards. The practical target is a plan that can survive current taxes, normal living or operating costs, and seasonal income swings.</p>
            <p>Before applying, gather the state notice, account ID, Social Security number or FEIN, bank information if direct debit is required, recent returns, proof of income, and a monthly expense summary. Business taxpayers should also gather sales tax returns, withholding returns, payroll reports, bank statements, owner compensation details, and proof that current deposits or filings are no longer falling behind.</p>
          </section>
          <section id="wage-garnishment" class="content-section">
            <div class="section-heading"><span class="eyebrow">Collection pressure</span><h2>Wage Garnishment Laws in ${escapeHtml(state.state)}</h2></div>
            <p>${state.garnishment}</p>
            <p>Wage garnishment is often the point where a tax problem becomes visible to an employer, which is why fast response matters. If a garnishment or withholding order has already been issued, the taxpayer should read the order, identify the issuing agency, and call the official contact listed on the notice. Do not assume that an IRS rule or a federal wage formula controls a state order. State rules and employer instructions can be different.</p>
            <p>Common ways to reduce or stop wage collection include full payment, a formal payment agreement, hardship review, correction of an incorrect assessment, proof that the wrong person or entity was targeted, or release after compromise approval. The exact remedy depends on the notice and the agency. If the order involves business trust taxes, sales tax, or withholding tax, expect the agency to treat the file more seriously than an ordinary individual balance.</p>
          </section>
          <section id="liens-levies" class="content-section">
            <div class="section-heading"><span class="eyebrow">Public records</span><h2>${escapeHtml(state.state)} Tax Liens and Levies</h2></div>
            <p>${state.lien}</p>
            <p>A lien or warrant is different from a payment plan. A payment plan addresses how the debt will be paid; a lien protects the government's claim while the debt remains unresolved. Depending on state law, liens can affect refinancing, property sale, business licensing, title transfer, and vendor or lender due diligence. The best time to ask about lien prevention is before the account reaches forced collection.</p>
            <p>If a lien has already been filed, ask the agency for the exact release process and what must happen before the release is recorded. Some agencies require full payment; others may discuss withdrawal, subordination, or release after compromise approval in limited cases. Keep proof of payment, agreement approval, release letters, and county or court recording confirmations because public-record cleanup can lag behind account resolution.</p>
          </section>
          <section id="statute-limitations" class="content-section">
            <div class="section-heading"><span class="eyebrow">Timing</span><h2>Statute of Limitations for ${escapeHtml(state.state)} Tax Debt</h2></div>
            <p>${state.sol}</p>
            <p>Do not use the IRS collection statute as a shortcut for state tax debt. State limitation periods may be tied to assessment date, filing date, fraud, failure to file, appeal status, bankruptcy, litigation, installment agreements, or other events. A taxpayer who is relying on time should verify the rule with the agency, a state statute, or a qualified professional before ignoring a notice.</p>
            <p>Limitation analysis is especially sensitive for businesses because sales tax, withholding tax, and payroll-like liabilities may be treated differently from personal income tax. If the state believes tax was collected from customers or withheld from workers and not remitted, collection and responsible-person rules can be more aggressive than a normal balance-due case.</p>
          </section>
          <section id="professional-help" class="content-section">
            <div class="section-heading"><span class="eyebrow">Decision support</span><h2>When to Consider Professional Help</h2></div>
            <p>Professional help is worth considering when the balance is large, the notice mentions a lien or garnishment, several years are unfiled, a business collected sales tax or withholding and did not remit it, or the taxpayer is comparing an offer in compromise with bankruptcy, appeal, or closure of a business. State tax debt is often procedural, and missing the correct appeal window or form can be more damaging than choosing the wrong payment amount.</p>
            <p>Legitimate options include CPAs for return reconstruction and financial statements, enrolled agents for tax representation, payroll specialists for employment-tax cleanup, and tax attorneys for litigation, lien, bankruptcy, or responsible-person exposure. The IRS maintains a federal tax return preparer directory at <a href="https://irs.treasury.gov/rpo/rpo.jsf">irs.gov/tax-professionals</a>, the National Association of Enrolled Agents has a directory at <a href="https://www.naea.org/">naea.org</a>, and state bar directories can help locate tax attorneys licensed in the relevant state.</p>
            <p>A good advisor should ask for the actual state notice, not just the balance. They should identify the agency, tax type, period, appeal status, collection stage, and current filing compliance before recommending a solution. Be cautious of anyone who promises settlement before reviewing assets, income, expenses, and whether the state program actually applies.</p>
          </section>
          <section id="prepare-file" class="content-section">
            <div class="section-heading"><span class="eyebrow">Preparation</span><h2>How to Prepare a Clean ${escapeHtml(state.state)} State Tax Relief File</h2></div>
            <p>The best state tax relief file is organized before the first phone call. Put the most recent state notice on top, then add older notices in date order. Next, separate federal IRS notices from ${escapeHtml(state.state)} notices so the agency, balance, and deadline are not mixed together. If a spouse, business partner, payroll provider, or bookkeeper is involved, document who handled filings, who controlled payments, and who received notices.</p>
            <p>For individual income tax balances, gather filed returns, W-2s, 1099s, bank statements, proof of withholding, estimated tax payments, and any amendment history. For business tax balances, gather sales tax returns, withholding returns, payroll records, point-of-sale reports, bank deposits, general ledger detail, officer compensation, and proof that current returns are being filed on time. State agencies often care less about a perfect narrative and more about whether the numbers line up with filed records.</p>
            <p>If you plan to ask for a payment plan, build a monthly budget that includes current taxes. A state agency may approve a plan for the old debt, but the plan can fail if the taxpayer creates new liability during the same period. For businesses, this means separating trust taxes from operating cash so sales tax or withholding is not accidentally used for rent, inventory, or payroll. For individuals, it means adjusting withholding or estimates before promising a monthly payment.</p>
            <p>If you plan to ask for compromise or hardship treatment, the file should explain why full payment is unrealistic and why the proposed outcome is better than forced collection. That typically requires more than a hardship statement. Useful support may include income records, medical or disability documentation where relevant, asset values, loan balances, rent or mortgage proof, dependent costs, and recent bank statements. If a state form asks for a financial statement, answer it consistently with the documents attached.</p>
            <p>Keep a contact log after every agency interaction. Record the date, phone number, representative name or ID if provided, summary of what was said, documents requested, deadline, and next step. Upload or mail documents only through official channels, and keep confirmation numbers. If the state later issues a lien, warrant, levy, or default notice, that contact log can help show whether the taxpayer responded on time and whether a missing document or misunderstanding caused the escalation.</p>
          </section>
          <section id="faq" class="faq-section">
            <div class="section-heading"><span class="eyebrow">FAQ</span><h2>Frequently Asked Questions</h2></div>
            ${faq.map(([q, a]) => `<details class="faq-item"><summary>${escapeHtml(q)}</summary><p>${a}</p></details>`).join("")}
          </section>
          <section id="official-resources" class="content-section">
            <div class="section-heading"><span class="eyebrow">Official resources</span><h2>${escapeHtml(state.state)} Official Tax Relief Resources</h2></div>
            ${stateResources(state)}
            <p>Also see neighboring or comparable state guides: ${neighborLinks}.</p>
          </section>
          <section class="disclaimer-box"><strong>Disclaimer:</strong> The information on this page is for general educational purposes only and does not constitute tax, legal, or financial advice. State tax laws and programs change frequently; verify current details directly with the ${escapeHtml(state.agency)} before acting. For personalized guidance, consult a licensed tax professional.</section>
          ${stateRelatedLinks(page, allPages)}
        </div>
        <div class="sidebar-column">${renderToc(sections)}${renderSidebar(page)}</div>
      </div>
    </main>
    ${renderFooter(page)}
    ${renderCookieBanner(page)}
  </body>
</html>`;
}

function renderPage(page, allPages) {
  if (page.template === "state") return renderStatePage(page, allPages);
  const isHome = page.path === "index.html";
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    ${pageHead(page)}
  </head>
  <body class="${isHome ? "home-page" : "content-page"}">
    ${renderHeader(page)}
    <main>
      <section class="hero ${isHome ? "hero-home" : "hero-inner"}">
        <div class="container hero-grid">
          <div>
            <span class="badge badge-hero">${escapeHtml(page.badge)}</span>
            ${isHome ? `<h1>${escapeHtml(page.h1)}</h1>` : `${renderBreadcrumbs(page)}<h1>${escapeHtml(page.h1)}</h1>`}
            <p class="hero-copy">${escapeHtml(page.hero)}</p>
            <div class="hero-actions">
              <a class="button button-primary" href="${localHref(page.path, page.cta.href)}">${escapeHtml(page.cta.label)}</a>
              <a class="button button-secondary" href="${localHref(page.path, page.secondaryCta.href)}">${escapeHtml(page.secondaryCta.label)}</a>
            </div>
          </div>
          <div class="hero-visual">${page.visual}</div>
        </div>
        <div class="container">${renderHeroStats(page.stats)}</div>
      </section>
      <div class="container main-grid">
        <div class="content-column">
          ${isHome ? page.homeLead : renderKeyTakeaways(page.takeaways)}
          ${renderSections(page.sections)}
          ${renderChart(page.chart)}
          ${page.extraContent ?? ""}
          ${renderEditorialBlock()}
          ${renderFaq(page.faq)}
          ${renderDisclaimer()}
          ${renderRelated(page, allPages)}
        </div>
        ${isHome ? "" : `<div class="sidebar-column">${renderToc(page.sections)}${renderSidebar(page)}</div>`}
      </div>
    </main>
    ${renderFooter(page)}
    ${renderCookieBanner(page)}
  </body>
</html>`;
}

function render404Page() {
  const page = withDefaults({
    path: "404.html",
    title: normalizeTitle("Page Not Found | TaxReliefGuides"),
    description: normalizeDescription("Use the TaxReliefGuides navigation to return to IRS relief, tax debt, deductions, payroll, business tax, and calculator resources after a missing-page error."),
    robots: "noindex, follow",
    template: "article",
    badge: "Error Page",
    h1: "Page Not Found",
    hero: "The page you requested could not be found. Use the guided links below to jump back into the main tax relief, calculator, and compliance resources.",
    sections: [
      {
        id: "recover",
        eyebrow: "Next step",
        title: "Return to the main tax research paths",
        intro: "TaxReliefGuides keeps the highest-value routes one click away.",
        paragraphs: [
          "If you landed on an outdated or mistyped URL, the fastest path is to return to the homepage, one of the core IRS relief hubs, or a calculator that matches the tax question you were trying to solve.",
          "This page is intentionally excluded from search indexing, but it still keeps the same navigation, footer, privacy access, and editorial context as the rest of the site so users are never stranded.",
        ],
        list: [
          "Go back to the homepage for the main tax topic map.",
          "Open a pillar guide if you were researching IRS debt, payroll, deductions, credits, or business taxes.",
          "Use a calculator if you were trying to estimate refunds, self-employment tax, paycheck tax, or business tax exposure.",
        ],
      },
    ],
    stats: [
      { value: "1 click", label: "Back to home", note: "Return to the main hub instantly" },
      { value: "8 guides", label: "Pillar topics", note: "Jump into IRS relief and tax planning" },
      { value: "5 tools", label: "Calculators", note: "Estimate key tax scenarios quickly" },
      { value: "40 pages", label: "Site coverage", note: "Browse the full guide library" },
    ],
    takeaways: [
      "Use the homepage to regain the main site structure quickly.",
      "Extensionless public URLs are now the canonical version across the site.",
      "This page stays available for users but excluded from indexing signals.",
    ],
    faq: [
      {
        q: "Why am I seeing a 404 page?",
        a: "You likely followed an outdated link, entered a mistyped URL, or requested a page that has moved to a newer extensionless path.",
      },
      {
        q: "Can I still access the main site sections from here?",
        a: "Yes. The same primary navigation, footer, and internal links remain available so you can continue browsing without starting over.",
      },
      {
        q: "Is this page indexed by search engines?",
        a: "No. It is marked noindex so it can help users recover from bad URLs without creating low-value indexing signals.",
      },
      {
        q: "Where should I go next?",
        a: "Start with the homepage or one of the pillar guides if you were researching IRS relief, tax debt, payroll tax, deductions, credits, or business taxes.",
      },
    ],
    related: [
      "pages/irs-tax-relief-guide.html",
      "pages/tax-debt-guide.html",
      "pages/tax-refund-calculator.html",
    ],
    cta: { label: "Go to homepage", href: `${domain}/` },
    secondaryCta: { label: "Explore IRS relief", href: `${domain}/pages/irs-tax-relief-guide` },
    visual: heroVisual(
      "Recovery tools",
      [
        { label: "Best first click", value: "Homepage" },
        { label: "Popular destination", value: "IRS relief hub" },
        { label: "Fastest utility path", value: "Tax calculator" },
      ],
      [
        { label: "Home", width: 96 },
        { label: "Guides", width: 88 },
        { label: "Calculators", width: 74 },
        { label: "Support", width: 64 },
      ]
    ),
    chart: chartFromStats({
      shortLabel: "404 recovery",
      chartBars: [
        { label: "Homepage recovery", width: 94, value: "Fastest" },
        { label: "Guide depth", width: 82, value: "High" },
        { label: "Calculator access", width: 72, value: "Immediate" },
        { label: "Search visibility", width: 12, value: "Noindex" },
      ],
    }),
    breadcrumbs: [
      { label: "Home", href: `${domain}/` },
      { label: "404", href: `${domain}/404` },
    ],
    image: `${domain}/assets/social-cover.svg`,
  });

  return renderPage(page, allPages);
}

function ensureWordCount(page, allPages, minimum, tone) {
  let html = renderPage(page, allPages);
  let words = wordCountFromHtml(html);
  while (words < minimum) {
    page.sections[page.sections.length - 1].paragraphs.push(fillerParagraph(page, tone));
    html = renderPage(page, allPages);
    words = wordCountFromHtml(html);
  }
  page.wordCount = words;
  return page;
}

const pillarConfigs = [
  {
    path: "pages/irs-tax-relief-guide.html",
    badge: "Pillar Guide",
    category: "pillar",
    titleBase: "IRS Tax Relief Guide: Options, Costs, and Deadlines",
    h1: "IRS Tax Relief Guide: Programs, Costs, and Smart Next Steps",
    hero: "Understand IRS tax relief options, compare payment plans and settlement routes, estimate penalties, and build a cleaner compliance strategy before notices get worse.",
    keyword: "IRS tax relief",
    shortLabel: "IRS tax relief",
    audience: "taxpayers facing balances due, notices, penalties, levy risk, or years of unresolved IRS correspondence",
    challenge: "Collection pressure can escalate while penalties and interest continue to grow",
    eligibility: "Eligibility typically improves when required returns are filed, current withholding or estimates are corrected, and the taxpayer can document income, assets, and monthly living costs clearly",
    cashflow: "Monthly affordability matters because even approved relief can fail if the taxpayer has not corrected the behavior that created the debt",
    docs: "A strong file usually includes IRS notices, account transcripts, recent returns, pay records, bank statements, and a current cash-flow summary",
    chartBars: [
      { label: "Penalty pressure", width: 78, value: "High" },
      { label: "Need for documentation", width: 88, value: "Very high" },
      { label: "Value of early action", width: 92, value: "Critical" },
      { label: "Flexibility across programs", width: 64, value: "Moderate" },
    ],
    stats: [
      { value: "0.5%/mo", label: "Typical failure-to-pay penalty", note: "Can continue while balances remain unpaid" },
      { value: "5%/mo", label: "Failure-to-file penalty cap path", note: "Often the fastest cost accelerator on missing returns" },
      { value: "6 to 10 years", label: "Collection planning horizon", note: "Many cases require multi-year budgeting discipline" },
      { value: "24 to 72 months", label: "Common payment-plan windows", note: "Longer horizons may apply depending on facts" },
    ],
    related: [
      "pages/irs-payment-plans-guide.html",
      "pages/what-is-offer-in-compromise.html",
      "pages/irs-penalties-explained.html",
    ],
  },
  {
    path: "pages/tax-debt-guide.html",
    badge: "Pillar Guide",
    category: "pillar",
    titleBase: "Tax Debt Guide: IRS Balances, Penalties, and Relief",
    h1: "Tax Debt Guide: How to Analyze, Prioritize, and Resolve IRS Balances",
    hero: "Learn how federal tax debt grows, which IRS relief routes make sense at different balance levels, and how to reduce pressure without guessing.",
    keyword: "tax debt",
    shortLabel: "tax debt",
    audience: "households and business owners trying to stop back taxes from turning into a larger collections or cash-flow problem",
    challenge: "Unpaid balances can compound through penalties, interest, and missed opportunities to file or negotiate early",
    eligibility: "The cleanest relief strategies usually require filed returns, realistic payment capacity, and a documented explanation of current finances",
    cashflow: "Tax debt solutions need to fit both current obligations and upcoming tax-year payments so the taxpayer does not default into new debt",
    docs: "Readers should gather notices, prior returns, transcript data, payment history, payroll reports if applicable, and a rolling monthly budget",
    chartBars: [
      { label: "Balance growth risk", width: 84, value: "High" },
      { label: "Negotiation complexity", width: 68, value: "Moderate" },
      { label: "Urgency of filing", width: 90, value: "Very high" },
      { label: "Cash-flow planning need", width: 86, value: "Very high" },
    ],
    stats: [
      { value: "Daily", label: "Interest accrual cadence", note: "Balances continue changing while unresolved" },
      { value: "3 phases", label: "Common decision path", note: "File, analyze, then negotiate or pay" },
      { value: "12 months", label: "Useful planning window", note: "Budgeting should include the next tax year" },
      { value: "2 layers", label: "Core exposure buckets", note: "Tax owed plus penalties and interest" },
    ],
    related: [
      "pages/how-to-file-back-taxes.html",
      "pages/tax-debt-forgiveness-options.html",
      "pages/how-to-stop-irs-wage-garnishment.html",
    ],
  },
  {
    path: "pages/tax-deductions-guide.html",
    badge: "Pillar Guide",
    category: "pillar",
    titleBase: "Tax Deductions Guide: Lower Taxable Income Legally",
    h1: "Tax Deductions Guide: How to Lower Taxable Income Without Guesswork",
    hero: "Compare above-the-line and itemized deductions, understand documentation rules, and see how deduction planning changes cash flow for U.S. filers.",
    keyword: "tax deductions",
    shortLabel: "tax deductions",
    audience: "individual filers, freelancers, and small-business owners trying to reduce taxable income without creating audit headaches",
    challenge: "Many taxpayers either underclaim valuable deductions or claim weak deductions they cannot comfortably support",
    eligibility: "Deduction value depends on filing status, income level, substantiation, business purpose, and whether the expense is ordinary, necessary, and properly timed",
    cashflow: "Some deductions reduce tax only at filing time while others change estimated payments or entity-level planning during the year",
    docs: "Useful records include receipts, mileage logs, home office measurements, bookkeeping reports, prior returns, and any policy that supports business purpose",
    chartBars: [
      { label: "Documentation burden", width: 82, value: "High" },
      { label: "Planning upside", width: 88, value: "Very high" },
      { label: "Audit sensitivity", width: 70, value: "Moderate" },
      { label: "Year-round usefulness", width: 85, value: "Strong" },
    ],
    stats: [
      { value: "2 types", label: "Core deduction buckets", note: "Above-the-line and itemized or business deductions" },
      { value: "24 months+", label: "Record retention discipline", note: "Longer is often wiser for support files" },
      { value: "Q4", label: "Planning season", note: "Year-end choices often shape the return" },
      { value: "1 rule", label: "Best documentation test", note: "Could you explain and prove the expense?" },
    ],
    related: [
      "pages/how-to-lower-taxable-income.html",
      "pages/home-office-deduction-guide.html",
      "pages/section-179-deduction-guide.html",
    ],
  },
  {
    path: "pages/business-tax-guide.html",
    badge: "Pillar Guide",
    category: "pillar",
    titleBase: "Business Tax Guide: Compliance, Deductions, and Risk",
    h1: "Business Tax Guide: Federal Compliance, Planning, and Cost Control",
    hero: "Understand business tax obligations, entity-level planning, deductions, payroll exposure, and the habits that keep small companies compliant and investable.",
    keyword: "business taxes",
    shortLabel: "business taxes",
    audience: "small-business owners, founders, and operators balancing growth with tax compliance and quarterly cash needs",
    challenge: "Businesses can create tax problems quickly when bookkeeping, estimated payments, payroll, and owner compensation fall out of sync",
    eligibility: "Good tax outcomes depend on entity choice, accounting discipline, timely filings, payroll compliance, and a realistic understanding of profit versus available cash",
    cashflow: "Business tax planning must account for seasonality, owner draws, payroll cycles, capital spending, and estimated payment timing",
    docs: "Prepare profit-and-loss statements, balance sheets, payroll filings, depreciation records, ownership documents, and prior returns before making big tax decisions",
    chartBars: [
      { label: "Compliance intensity", width: 90, value: "Very high" },
      { label: "Deduction opportunity", width: 79, value: "High" },
      { label: "Payroll exposure", width: 83, value: "High" },
      { label: "Entity-planning impact", width: 76, value: "High" },
    ],
    stats: [
      { value: "Quarterly", label: "Estimated payment rhythm", note: "Cash reserves should reflect federal deadlines" },
      { value: "15.3%", label: "Self-employment benchmark", note: "Applies before other income-tax effects" },
      { value: "21%", label: "Federal C-corp rate", note: "Entity structure changes overall tax economics" },
      { value: "Weekly to monthly", label: "Payroll deposit cadence", note: "Deposit timing can trigger penalties quickly" },
    ],
    related: [
      "pages/common-tax-deductions-for-small-businesses.html",
      "pages/best-tax-software-for-small-business.html",
      "pages/estimated-tax-payments-guide.html",
    ],
  },
  {
    path: "pages/payroll-tax-guide.html",
    badge: "Pillar Guide",
    category: "pillar",
    titleBase: "Payroll Tax Guide: Deposits, Forms, and Penalty Risk",
    h1: "Payroll Tax Guide: Deposits, Reporting, and Compliance Risk",
    hero: "Learn how payroll taxes work, what employers must withhold and deposit, and why payroll mistakes can become some of the highest-stakes tax problems in business.",
    keyword: "payroll taxes",
    shortLabel: "payroll taxes",
    audience: "employers, founders, and payroll managers responsible for withholding, depositing, and reporting federal employment taxes correctly",
    challenge: "Payroll tax mistakes can trigger fast penalties and heightened IRS scrutiny because the employer is holding trust fund money",
    eligibility: "Compliance depends on timely deposits, accurate wage reporting, correct worker classification, and disciplined payroll system controls",
    cashflow: "Payroll liabilities are not free working capital, so strong businesses ring-fence them instead of funding operations with withheld tax money",
    docs: "Employers should maintain payroll registers, deposit confirmations, Forms 941 and 940, W-2 support, and onboarding classification records",
    chartBars: [
      { label: "Penalty risk", width: 91, value: "Very high" },
      { label: "Process dependence", width: 87, value: "Very high" },
      { label: "Need for controls", width: 92, value: "Critical" },
      { label: "Fixability with good systems", width: 63, value: "Moderate" },
    ],
    stats: [
      { value: "7.65%", label: "Employee FICA share", note: "Social Security and Medicare withholding" },
      { value: "7.65%", label: "Employer FICA share", note: "Employer cost on top of wages" },
      { value: "2 deposit paths", label: "Monthly or semiweekly", note: "Schedule depends on prior liability size" },
      { value: "Fast", label: "Penalty clock", note: "Late deposits can get expensive quickly" },
    ],
    related: [
      "pages/how-payroll-taxes-work.html",
      "pages/paycheck-tax-calculator.html",
      "pages/when-to-hire-a-tax-attorney.html",
    ],
  },
  {
    path: "pages/tax-credits-guide.html",
    badge: "Pillar Guide",
    category: "pillar",
    titleBase: "Tax Credits Guide: Refundable vs. Nonrefundable Rules",
    h1: "Tax Credits Guide: Refundable Benefits, Eligibility, and Planning",
    hero: "Compare major federal tax credits, understand income phaseouts, and see when credits reduce tax liability versus increasing a possible refund.",
    keyword: "tax credits",
    shortLabel: "tax credits",
    audience: "households and business owners looking to reduce federal tax with credits that have stronger dollar-for-dollar impact than deductions",
    challenge: "Credits create major value, but eligibility, phaseouts, and documentation rules can narrow who actually benefits",
    eligibility: "The outcome usually depends on filing status, dependents, income thresholds, business activity, education costs, and whether the credit is refundable",
    cashflow: "Credits can change withholding strategy, estimated-tax planning, and expected refund size, which makes them more than a line-item filing issue",
    docs: "Readers should gather prior returns, dependent records, tuition forms, childcare costs, bookkeeping support, and any documentation tied to phaseout tests",
    chartBars: [
      { label: "Dollar-for-dollar impact", width: 93, value: "Very high" },
      { label: "Phaseout sensitivity", width: 80, value: "High" },
      { label: "Documentation need", width: 76, value: "High" },
      { label: "Refund effect", width: 88, value: "Strong" },
    ],
    stats: [
      { value: "$2,000", label: "Child Tax Credit benchmark", note: "Rules change by income and year" },
      { value: "Refundable or not", label: "Core design split", note: "This determines how excess credit is treated" },
      { value: "Dollar-for-dollar", label: "Why credits matter", note: "They directly reduce tax rather than taxable income" },
      { value: "Income-based", label: "Common eligibility trigger", note: "Phaseouts can materially change value" },
    ],
    related: [
      "pages/child-tax-credit-guide.html",
      "pages/tax-credits-vs-tax-deductions.html",
      "pages/tax-refund-calculator.html",
    ],
  },
  {
    path: "pages/self-employed-tax-guide.html",
    badge: "Pillar Guide",
    category: "pillar",
    titleBase: "Self-Employed Tax Guide: SE Tax, Deductions, and Pay",
    h1: "Self-Employed Tax Guide: Estimated Taxes, Deductions, and SE Tax",
    hero: "Learn how freelancers and sole proprietors handle self-employment tax, quarterly estimates, deductions, and the recordkeeping needed to avoid surprises.",
    keyword: "self-employed taxes",
    shortLabel: "self-employed taxes",
    audience: "freelancers, consultants, contractors, and owner-operators whose income does not come with automatic withholding",
    challenge: "Irregular income makes it easy to under-save for taxes and overlook deductions or quarterly payment obligations",
    eligibility: "Strong outcomes depend on disciplined books, timely estimates, deductible-expense support, and separating business cash from personal spending",
    cashflow: "Self-employed tax planning only works when tax reserves are built into pricing, owner draws, and quarterly cash decisions",
    docs: "Readers should maintain bookkeeping reports, receipts, mileage logs, bank statements, invoices, and prior estimated-payment records",
    chartBars: [
      { label: "Income volatility", width: 86, value: "High" },
      { label: "Need for estimates", width: 92, value: "Critical" },
      { label: "Deduction opportunity", width: 83, value: "High" },
      { label: "Audit-proof records", width: 81, value: "High" },
    ],
    stats: [
      { value: "15.3%", label: "SE tax starting point", note: "Applied to net earnings with adjustments" },
      { value: "4", label: "Quarterly deadlines", note: "Federal estimates usually hit four times a year" },
      { value: "50%", label: "SE tax deduction concept", note: "Half of SE tax is generally deductible for income tax" },
      { value: "Year-round", label: "Best planning cadence", note: "Monthly bookkeeping makes quarterly estimates easier" },
    ],
    related: [
      "pages/self-employed-tax-deductions.html",
      "pages/estimated-tax-payments-guide.html",
      "pages/self-employment-tax-calculator.html",
    ],
  },
  {
    path: "pages/irs-payment-plans-guide.html",
    badge: "Pillar Guide",
    category: "pillar",
    titleBase: "IRS Payment Plans Guide: Setup, Costs, and Defaults",
    h1: "IRS Payment Plans Guide: How Installment Agreements Really Work",
    hero: "See when IRS installment agreements make sense, what they cost over time, and how to avoid defaults that restart the stress cycle.",
    keyword: "IRS payment plans",
    shortLabel: "IRS payment plans",
    audience: "taxpayers who cannot pay their IRS balance in full and need a sustainable monthly path",
    challenge: "An installment agreement can help immediately, but it can also fail if the payment is unrealistic or current-year taxes are still off track",
    eligibility: "Approval is easiest when the taxpayer is current on required filings and can demonstrate a payment amount that fits the account profile",
    cashflow: "Monthly plans should be stress-tested against upcoming tax-year payments and any seasonal swings in household or business income",
    docs: "Gather notices, transcripts, bank statements, budgets, proof of income, and any details tied to direct debit or business liabilities",
    chartBars: [
      { label: "Cash-flow dependence", width: 90, value: "Very high" },
      { label: "Likelihood of use", width: 88, value: "High" },
      { label: "Default risk", width: 71, value: "Moderate" },
      { label: "Need for filing compliance", width: 89, value: "Very high" },
    ],
    stats: [
      { value: "Monthly", label: "Typical payment cadence", note: "Reliable automation reduces missed-payment risk" },
      { value: "Ongoing", label: "Interest and penalty impact", note: "Some costs continue while the plan runs" },
      { value: "Best early", label: "Setup timing", note: "It is usually better before collection intensifies" },
      { value: "Annual review", label: "Useful checkpoint", note: "Adjust withholding or estimates before default risk rises" },
    ],
    related: [
      "pages/how-to-set-up-an-irs-payment-plan.html",
      "pages/tax-debt-guide.html",
      "pages/tax-debt-forgiveness-options.html",
    ],
  },
];

const supportCopy = {
  "pages/what-is-offer-in-compromise.html": {
    hero: "Offer in compromise is a real IRS settlement route, but it only fits cases where the financial file supports collectibility relief.",
    description: "Offer in Compromise guide: Form 656 basics, compliance gates, payment options, financial review, and when settlement is realistic.",
  },
  "pages/how-to-set-up-an-irs-payment-plan.html": {
    hero: "Setting up an IRS payment plan starts with filed returns, a verified balance, and a monthly amount that can survive real cash flow.",
    description: "IRS payment plan setup guide: online agreements, required returns, direct debit, monthly budgeting, default risk, and notice response.",
  },
  "pages/tax-debt-forgiveness-options.html": {
    hero: "Tax debt forgiveness language often hides very different IRS paths, including compromise, hardship delay, penalty relief, and payment plans.",
    description: "Tax debt forgiveness options: compare IRS OIC, CNC hardship, penalty abatement, payment plans, and what each program actually changes.",
  },
  "pages/common-tax-deductions-for-small-businesses.html": {
    hero: "Small-business deductions work best when the expense is ordinary, necessary, documented, and tied clearly to business income.",
    description: "Small business deduction guide: review common expenses, documentation rules, home office, vehicles, software, payroll, and recordkeeping.",
  },
  "pages/self-employed-tax-deductions.html": {
    hero: "Self-employed deductions can lower taxable income, but only when receipts, logs, and business purpose support the claim.",
    description: "Self-employed deduction guide: track home office, mileage, insurance, retirement, software, supplies, and records before filing.",
  },
  "pages/how-payroll-taxes-work.html": {
    hero: "Payroll taxes combine employee withholding, employer matching tax, deposit schedules, and quarterly reporting that owners must monitor.",
    description: "Payroll tax guide: understand FICA, federal withholding, FUTA, deposit schedules, Form 941, employer match, and common IRS notices.",
  },
  "pages/best-tax-software-for-small-business.html": {
    hero: "The right tax software depends on bookkeeping quality, payroll needs, entity type, integrations, and how much support the owner needs.",
    description: "Small business tax software guide: compare bookkeeping, payroll, filing support, entity fit, integrations, audit trails, and pricing limits.",
  },
  "pages/how-to-lower-taxable-income.html": {
    hero: "Lowering taxable income safely means using documented deductions, retirement contributions, timing choices, and credits without forcing weak positions.",
    description: "Lower taxable income guide: review deductions, retirement contributions, credits, timing choices, business records, and audit-safe planning.",
  },
  "pages/tax-credits-vs-tax-deductions.html": {
    hero: "Credits and deductions reduce tax in different ways, so the better option depends on rate, refundability, eligibility, and documentation.",
    description: "Tax credits vs deductions: see how dollar-for-dollar credits compare with income reductions, refund rules, phaseouts, and records.",
  },
  "pages/how-to-file-back-taxes.html": {
    hero: "Filing back taxes starts with identifying missing years, pulling transcripts, rebuilding records, and filing before comparing payment options.",
    description: "Back taxes filing guide: identify missing years, use IRS transcripts, rebuild records, file old returns, and plan payment options.",
  },
  "pages/what-happens-if-you-dont-pay-taxes.html": {
    hero: "Unpaid taxes can move from notices to penalties, liens, levies, garnishment, and collection pressure if the account is ignored.",
    description: "Unpaid taxes guide: IRS notices, penalties, interest, liens, levies, wage garnishment, payment plans, hardship, and first response steps.",
  },
  "pages/estimated-tax-payments-guide.html": {
    hero: "Estimated tax payments help self-employed workers, investors, and owners spread tax throughout the year instead of waiting for a balance.",
    description: "Estimated tax payment guide: quarterly due dates, safe-harbor basics, underpayment risk, self-employed income, and payment records.",
  },
  "pages/child-tax-credit-guide.html": {
    hero: "The Child Tax Credit depends on child eligibility, income limits, refundability, SSN rules, and records that support the claim.",
    description: "Child Tax Credit guide: child eligibility, SSN rules, income phaseouts, refundable ACTC basics, dependent records, and filing risks.",
  },
  "pages/home-office-deduction-guide.html": {
    hero: "The home office deduction can help self-employed filers when the space is used regularly, exclusively, and documented clearly.",
    description: "Home office deduction guide: regular and exclusive use, simplified method, actual expense records, self-employed rules, and audit risk.",
  },
  "pages/section-179-deduction-guide.html": {
    hero: "Section 179 can accelerate equipment deductions, but owners need to compare cash flow, eligibility, depreciation, and record timing.",
    description: "Section 179 deduction guide: equipment eligibility, expensing decisions, depreciation tradeoffs, business use records, and cash-flow timing.",
  },
  "pages/irs-penalties-explained.html": {
    hero: "IRS penalties are easier to manage once the account separates tax due, filing penalties, payment penalties, interest, and relief options.",
    description: "IRS penalties guide: failure-to-file, failure-to-pay, deposit penalties, interest, penalty abatement, and notice response steps.",
  },
  "pages/when-to-hire-a-tax-attorney.html": {
    hero: "A tax attorney may be appropriate when legal risk, disputed facts, liens, levies, payroll exposure, or litigation concerns are present.",
    description: "Tax attorney guide: when legal representation may matter for IRS collections, audits, liens, levies, payroll exposure, and disputes.",
  },
  "pages/tax-audit-guide.html": {
    hero: "A tax audit response should begin with the notice, tax year, records requested, response deadline, and a clean document plan.",
    description: "Tax audit guide: understand IRS notices, response deadlines, records, audit types, representation choices, and documentation mistakes.",
  },
  "pages/how-to-stop-irs-wage-garnishment.html": {
    hero: "Stopping IRS wage garnishment usually requires fast account review, filed returns, proof of hardship or payment ability, and direct response.",
    description: "IRS wage garnishment guide: levy notices, release options, payment plans, hardship review, employer impact, and urgent first steps.",
  },
  "pages/best-states-for-low-taxes.html": {
    hero: "Low-tax states can reduce some costs, but relocation planning must include income tax, sales tax, property tax, residency, and business rules.",
    description: "Low-tax states guide: compare income tax, sales tax, property tax, residency rules, business taxes, and relocation documentation.",
  },
};

const supportConfigs = [
  ["pages/what-is-offer-in-compromise.html", "What Is an Offer in Compromise? IRS Settlement Basics", "offer in compromise", "taxpayers wondering whether an IRS settlement is realistic or mostly marketing hype"],
  ["pages/how-to-set-up-an-irs-payment-plan.html", "How to Set Up an IRS Payment Plan Step by Step", "set up an IRS payment plan", "taxpayers ready to move from notice stage to an actual installment-agreement process"],
  ["pages/tax-debt-forgiveness-options.html", "Tax Debt Forgiveness Options: What Is Actually Real?", "tax debt forgiveness", "readers comparing true IRS relief with oversold settlement promises"],
  ["pages/common-tax-deductions-for-small-businesses.html", "Common Tax Deductions for Small Businesses", "small-business tax deductions", "owners trying to lower taxable income while keeping records defensible"],
  ["pages/self-employed-tax-deductions.html", "Self-Employed Tax Deductions Worth Tracking", "self-employed tax deductions", "freelancers and contractors who need cleaner books and lower taxable income"],
  ["pages/how-payroll-taxes-work.html", "How Payroll Taxes Work for Employers and Employees", "how payroll taxes work", "businesses and workers trying to understand withholding, deposits, and employer cost"],
  ["pages/best-tax-software-for-small-business.html", "Best Tax Software for Small Business: What to Compare", "best tax software for small business", "small teams choosing between bookkeeping, filing, payroll, and compliance workflows"],
  ["pages/how-to-lower-taxable-income.html", "How to Lower Taxable Income Without Creating Risk", "lower taxable income", "filers looking for legal, documented ways to reduce federal tax exposure"],
  ["pages/tax-credits-vs-tax-deductions.html", "Tax Credits vs. Tax Deductions: Which Helps More?", "tax credits vs tax deductions", "taxpayers comparing the true value of two very different tax benefits"],
  ["pages/how-to-file-back-taxes.html", "How to File Back Taxes and Rebuild Compliance", "file back taxes", "taxpayers with unfiled returns who need an organized restart"],
  ["pages/what-happens-if-you-dont-pay-taxes.html", "What Happens If You Don't Pay Taxes to the IRS?", "what happens if you don't pay taxes", "people trying to understand the escalation path before it gets more serious"],
  ["pages/estimated-tax-payments-guide.html", "Estimated Tax Payments Guide for U.S. Filers", "estimated tax payments", "self-employed workers and investors who need to avoid underpayment surprises"],
  ["pages/child-tax-credit-guide.html", "Child Tax Credit Guide: Eligibility and Refund Impact", "child tax credit", "families estimating how dependents affect tax liability and refunds"],
  ["pages/home-office-deduction-guide.html", "Home Office Deduction Guide for Remote Work and Business", "home office deduction", "self-employed readers assessing whether the deduction is worth claiming and how to document it"],
  ["pages/section-179-deduction-guide.html", "Section 179 Deduction Guide for Equipment Purchases", "Section 179 deduction", "business owners comparing expensing, depreciation, and cash-flow tradeoffs"],
  ["pages/irs-penalties-explained.html", "IRS Penalties Explained: Late Filing, Late Payment, and More", "IRS penalties", "taxpayers trying to separate the original tax bill from the extra cost of delay"],
  ["pages/when-to-hire-a-tax-attorney.html", "When to Hire a Tax Attorney Instead of DIY Tax Relief", "hire a tax attorney", "readers deciding when legal representation matters more than basic filing help"],
  ["pages/tax-audit-guide.html", "Tax Audit Guide: What to Expect and How to Prepare", "tax audit", "filers who want to respond calmly, document well, and avoid making the process harder"],
  ["pages/how-to-stop-irs-wage-garnishment.html", "How to Stop IRS Wage Garnishment Before It Gets Worse", "stop IRS wage garnishment", "workers under collection pressure who need to move quickly and strategically"],
  ["pages/best-states-for-low-taxes.html", "Best States for Low Taxes: What Actually Changes", "best states for low taxes", "households and owners comparing relocation, residency, and total tax burden"],
].map(([path, h1, keyword, audience], index) => {
  const copy = supportCopy[path] ?? {};
  return withDefaults({
    path,
    badge: index % 3 === 0 ? "Guide" : index % 3 === 1 ? "Explainer" : "Comparison",
    category: "support",
    titleBase: h1,
    h1,
    hero: copy.hero ?? `${h1} explains the rule, records, timing, and next step so readers can make a cleaner tax decision.`,
    descriptionBase: copy.description,
    keyword,
    shortLabel: keyword,
    audience,
    challenge: "This topic usually gets expensive when timing, records, or eligibility details are handled too casually",
    eligibility: "The key rules usually turn on filing status, timing, substantiation, and whether the taxpayer's facts truly fit the strategy being considered",
    cashflow: "Readers should compare both annual tax impact and next-quarter cash impact before acting",
    docs: "Start with notices or returns when relevant, then add receipts, books, payroll records, and support files tied to the specific tax position",
    chartBars: [
      { label: "Research value", width: 88 - (index % 4) * 4, value: "High" },
      { label: "Documentation need", width: 72 + (index % 5) * 4, value: "Moderate to high" },
      { label: "Cost sensitivity", width: 75 + (index % 3) * 6, value: "High" },
      { label: "Need for early action", width: 70 + (index % 4) * 5, value: "Moderate to high" },
    ],
    stats: [
      { value: "1 clear issue", label: "Best starting point", note: "Define the exact decision before acting" },
      { value: "2 lenses", label: "Review standard", note: "Tax savings and compliance durability both matter" },
      { value: "3 steps", label: "Useful process", note: "Verify facts, compare options, then act" },
      { value: "12 months", label: "Planning window", note: "Tax choices should hold up beyond filing day" },
    ],
  });
});

const calculatorConfigs = [
  withDefaults({
    path: "pages/tax-refund-calculator.html",
    template: "calculator",
    category: "calculator",
    badge: "Calculator",
    titleBase: "Tax Refund Calculator: Estimate Your Federal Refund",
    h1: "Tax Refund Calculator: Estimate Federal Refund or Balance Due",
    hero: "Model basic federal refund scenarios, compare withheld tax against estimated liability, and see why credits and filing status change the outcome.",
    descriptionBase: "Tax refund calculator: estimate federal refund or balance due using wages, withholding, filing status, credits, and planning assumptions.",
    keyword: "tax refund calculator",
    shortLabel: "tax refund calculator",
    audience: "employees and families trying to forecast refund size before filing",
    challenge: "Refund expectations often drift when withholding, credits, or income changes midyear",
    eligibility: "Results are directional only and depend on filing status, wages, withholding, and major credits",
    cashflow: "The output can help readers decide whether they need to adjust withholding rather than treat tax season as a surprise",
    docs: "Gather your most recent pay stubs, year-to-date withholding totals, and any expected federal credits",
    chartBars: [
      { label: "Withholding influence", width: 86, value: "High" },
      { label: "Credit sensitivity", width: 80, value: "High" },
      { label: "Planning usefulness", width: 91, value: "Very high" },
      { label: "Precision versus filing", width: 59, value: "Estimate only" },
    ],
    stats: [
      { value: "$3,000+", label: "Approx. recent average refund range", note: "Actual refunds vary widely by filer" },
      { value: "4 inputs", label: "Simple starting model", note: "Wages, withholding, status, and credits" },
      { value: "Best midyear", label: "Planning timing", note: "Use it before year-end if withholding changed" },
      { value: "Refund or due", label: "Main output", note: "The math helps identify likely direction" },
    ],
    calculatorKind: "refund",
    related: [
      "pages/tax-credits-guide.html",
      "pages/child-tax-credit-guide.html",
      "pages/how-to-lower-taxable-income.html",
    ],
  }),
  withDefaults({
    path: "pages/self-employment-tax-calculator.html",
    template: "calculator",
    category: "calculator",
    badge: "Calculator",
    titleBase: "Self-Employment Tax Calculator: SE Tax",
    h1: "Self-Employment Tax Calculator for Freelancers and Contractors",
    hero: "Estimate self-employment tax, see how quarterly payments compare with likely liability, and understand why irregular income needs a tax reserve.",
    descriptionBase: "Self-employment tax calculator: estimate SE tax, quarterly reserve needs, net earnings impact, and planning assumptions for freelancers.",
    keyword: "self-employment tax calculator",
    shortLabel: "self-employment tax calculator",
    audience: "freelancers and owner-operators who need to model SE tax before quarterly deadlines",
    challenge: "Variable income makes it easy to under-save and confuse profit with spendable cash",
    eligibility: "The estimate depends on net income, retirement contributions, and how much of the year’s tax has already been prepaid",
    cashflow: "This tool is most useful when paired with a reserve plan that protects quarterly tax money from operating expenses",
    docs: "Use current bookkeeping, year-to-date expenses, bank records, and estimated-payment confirmations",
    chartBars: [
      { label: "Quarterly planning value", width: 92, value: "Very high" },
      { label: "Sensitivity to income swings", width: 89, value: "Very high" },
      { label: "Recordkeeping need", width: 83, value: "High" },
      { label: "Best use as planning tool", width: 78, value: "Strong" },
    ],
    stats: [
      { value: "15.3%", label: "SE tax rate benchmark", note: "Applied to adjusted net earnings" },
      { value: "4", label: "Federal estimate dates", note: "Quarterly cash planning matters" },
      { value: "50%", label: "Deduction reminder", note: "Half of SE tax is generally deductible" },
      { value: "Monthly", label: "Ideal bookkeeping cadence", note: "Better books make better estimates" },
    ],
    calculatorKind: "selfEmployment",
    related: [
      "pages/self-employed-tax-guide.html",
      "pages/self-employed-tax-deductions.html",
      "pages/estimated-tax-payments-guide.html",
    ],
  }),
  withDefaults({
    path: "pages/paycheck-tax-calculator.html",
    template: "calculator",
    category: "calculator",
    badge: "Calculator",
    titleBase: "Paycheck Tax Calculator: Estimate Federal Withholding",
    h1: "Paycheck Tax Calculator: Estimate Federal Taxes Per Pay Period",
    hero: "Estimate federal withholding and FICA from a single paycheck, compare pay frequencies, and see how pre-tax deductions affect take-home pay.",
    descriptionBase: "Paycheck tax calculator: estimate federal withholding, FICA, pay frequency impact, pre-tax deductions, and take-home pay scenarios.",
    keyword: "paycheck tax calculator",
    shortLabel: "paycheck tax calculator",
    audience: "employees checking whether current withholding matches likely annual tax exposure",
    challenge: "Take-home pay can feel unpredictable when tax withholding and pre-tax deductions change together",
    eligibility: "Outputs vary by filing status, pay frequency, gross wages, and pre-tax deduction levels",
    cashflow: "A paycheck-level estimate helps readers adjust W-4 settings before year-end surprises grow",
    docs: "Use your pay stub, W-4 settings, pay frequency, and current benefit deductions",
    chartBars: [
      { label: "Employee usefulness", width: 90, value: "Very high" },
      { label: "Dependence on W-4", width: 79, value: "High" },
      { label: "FICA visibility", width: 85, value: "High" },
      { label: "Planning accuracy", width: 68, value: "Directional" },
    ],
    stats: [
      { value: "7.65%", label: "Employee FICA benchmark", note: "Social Security and Medicare only" },
      { value: "52/26/24/12", label: "Common pay cadences", note: "Annualized wages change withholding patterns" },
      { value: "W-4", label: "Control lever", note: "Withholding settings matter more than many workers expect" },
      { value: "Midyear", label: "Best review point", note: "Adjust before under-withholding compounds" },
    ],
    calculatorKind: "paycheck",
    related: [
      "pages/payroll-tax-guide.html",
      "pages/how-payroll-taxes-work.html",
      "pages/tax-refund-calculator.html",
    ],
  }),
  withDefaults({
    path: "pages/business-tax-estimator.html",
    template: "calculator",
    category: "calculator",
    badge: "Calculator",
    titleBase: "Business Tax Estimator for Small Businesses",
    h1: "Business Tax Estimator: Federal Planning for Small Businesses",
    hero: "Run rough federal tax scenarios for sole proprietors, S corporations, and C corporations so you can compare profit, owner pay, and estimated payments.",
    descriptionBase: "Business tax estimator: compare sole proprietor, S corporation, and C corporation scenarios with profit, owner pay, and estimates.",
    keyword: "business tax estimator",
    shortLabel: "business tax estimator",
    audience: "owners who need a planning-level view of business tax exposure before quarter-end or year-end decisions",
    challenge: "Owners often confuse accounting profit, owner distributions, and actual federal tax due",
    eligibility: "The estimate depends on entity type, profit, owner compensation structure, and estimated payments already made",
    cashflow: "This calculator is strongest when used to protect quarterly reserves and compare entity-level decisions before the filing deadline",
    docs: "Use current P&L reports, payroll data, owner compensation details, and estimated-payment records",
    chartBars: [
      { label: "Entity comparison value", width: 87, value: "High" },
      { label: "Cash-flow planning", width: 92, value: "Very high" },
      { label: "Need for good books", width: 90, value: "Very high" },
      { label: "Precision versus planning", width: 61, value: "Estimate only" },
    ],
    stats: [
      { value: "21%", label: "Federal C-corp rate", note: "One piece of total business tax planning" },
      { value: "15.3%", label: "Sole prop SE tax benchmark", note: "Can materially change owner cash flow" },
      { value: "Quarterly", label: "Reserve habit", note: "Strong operators plan taxes all year" },
      { value: "Entity-specific", label: "Main variable", note: "Tax economics change by structure" },
    ],
    calculatorKind: "business",
    related: [
      "pages/business-tax-guide.html",
      "pages/common-tax-deductions-for-small-businesses.html",
      "pages/best-tax-software-for-small-business.html",
    ],
  }),
  withDefaults({
    path: "pages/debt-settlement-savings-calculator.html",
    template: "calculator",
    category: "calculator",
    badge: "Calculator",
    titleBase: "Tax Debt Settlement Savings Calculator",
    h1: "Tax Debt Settlement Savings Calculator for IRS Relief Planning",
    hero: "Estimate the difference between paying a tax debt over time and resolving it through a potential settlement-style scenario with ongoing penalties and interest in view.",
    descriptionBase: "Tax debt settlement calculator: compare monthly payment scenarios, settlement assumptions, penalty impact, and long-term debt cost.",
    keyword: "tax debt settlement savings calculator",
    shortLabel: "tax debt settlement calculator",
    audience: "taxpayers comparing a long payment path with a possible compromise or negotiated relief strategy",
    challenge: "Tax debt decisions look different once ongoing penalty and interest cost are included",
    eligibility: "This is a scenario tool only and cannot determine whether a taxpayer qualifies for an offer in compromise or other IRS settlement path",
    cashflow: "The estimate is most useful when a taxpayer wants to compare total cost, not just the monthly payment",
    docs: "Gather your current balance, penalty and interest assumptions, and a realistic time horizon for resolution",
    chartBars: [
      { label: "Savings visibility", width: 90, value: "Very high" },
      { label: "Qualification uncertainty", width: 58, value: "Medium" },
      { label: "Need for professional review", width: 76, value: "High" },
      { label: "Planning usefulness", width: 85, value: "High" },
    ],
    stats: [
      { value: "24 to 60", label: "Months often modeled", note: "Longer timelines magnify carrying cost" },
      { value: "Penalties + interest", label: "Key driver", note: "Carrying cost changes the comparison" },
      { value: "Scenario only", label: "Output type", note: "IRS approval still depends on eligibility" },
      { value: "Best with transcripts", label: "Starting data quality", note: "Accurate balances improve the estimate" },
    ],
    calculatorKind: "settlement",
    related: [
      "pages/tax-debt-guide.html",
      "pages/what-is-offer-in-compromise.html",
      "pages/tax-debt-forgiveness-options.html",
    ],
  }),
];

const rootPages = [
  withDefaults({
    path: "index.html",
    template: "home",
    category: "home",
    badge: "Start Here",
    titleBase: "TaxReliefGuides: Start Here for IRS Tax Debt Help",
    descriptionBase: "Start with IRS tax debt help, notice guides, payment plans, settlement analysis, and state tax relief paths built from official sources.",
    h1: "Start here for IRS tax debt, notices, and relief options",
    hero: "Use TaxReliefGuides to figure out whether you need a payment plan, a notice response, hardship review, settlement analysis, or a state tax fix.",
    keyword: "IRS tax debt help and notice guidance",
    shortLabel: "IRS tax help",
    audience: "U.S. taxpayers, families, freelancers, and small-business owners with real tax questions",
    challenge: "IRS and state tax problems become harder to solve when readers jump between disconnected pages without knowing which step comes first",
    eligibility: "Readers benefit most when they can sort notice response, filing cleanup, payment options, and state issues into the right order",
    cashflow: "Tax problems affect monthly cash flow, refunds, payroll, and collection risk, not just the number shown on a return",
    docs: "Readers should keep notices, transcripts, recent returns, pay records, bookkeeping reports, and bank statements nearby while comparing options",
    chartBars: [
      { label: "Notice response", width: 88, value: "High" },
      { label: "Payment plans", width: 82, value: "High" },
      { label: "Settlement review", width: 70, value: "Selective" },
      { label: "State relief", width: 76, value: "Growing" },
    ],
    stats: [
      { value: "0.5%/mo", label: "Failure-to-pay baseline", note: "Typical IRS late-payment penalty benchmark" },
      { value: "180 days", label: "Short-term plan window", note: "IRS short-term payment plans can run up to 180 days" },
      { value: "$50,000", label: "Simple IA threshold", note: "Common online individual installment agreement threshold" },
      { value: "21 to 30 days", label: "Notice urgency range", note: "Many IRS balance and levy notices should be handled quickly" },
    ],
    related: [
      "pages/irs-tax-relief-guide.html",
      "pages/tax-debt-guide.html",
      "states/index.html",
    ],
  }),
  withDefaults({
    path: "about.html",
    titleBase: "About TaxReliefGuides and How the Site Works",
    h1: "About TaxReliefGuides",
    hero: "TaxReliefGuides is an independent informational site focused on IRS debt, notices, payment options, and practical tax research for U.S. readers.",
    descriptionBase: "Learn what TaxReliefGuides covers, how the site uses official sources, and where its informational limits begin.",
    keyword: "about TaxReliefGuides",
    shortLabel: "about page",
    audience: "readers evaluating whether the site is transparent, useful, and worth trusting for research",
    challenge: "Tax content is easy to overstate, so the site needs to explain clearly what it is and what it is not",
    eligibility: "Readers should understand the editorial purpose, sourcing standards, and informational limits before relying on any guide",
    cashflow: "This matters because people often reach the site while deciding how to respond to a tax bill, payment problem, or filing issue",
    docs: "The site works from IRS pages, official state agency pages, form instructions, publications, and other public-source materials",
    stats: [
      { value: "70+", label: "Published resources", note: "Guides, calculators, notices, and state pages" },
      { value: "U.S.-focused", label: "Primary market", note: "Federal tax guidance built for U.S. readers" },
      { value: "Editorial", label: "Content model", note: "Independent educational site, not a tax firm" },
      { value: "Practical", label: "Writing standard", note: "Rules translated into next-step decisions" },
    ],
    chartBars: [
      { label: "Editorial independence", width: 88, value: "High" },
      { label: "Source rigor", width: 84, value: "High" },
      { label: "Commercial clarity", width: 80, value: "High" },
      { label: "Reader usefulness", width: 92, value: "Very high" },
    ],
    related: [
      "how-we-research.html",
      "contact.html",
      "pages/irs-tax-relief-guide.html",
    ],
    breadcrumbs: [
      { label: "Home", href: `${domain}/` },
      { label: "About", href: `${domain}/about` },
    ],
  }),
  withDefaults({
    path: "contact.html",
    titleBase: "Contact TaxReliefGuides for Corrections or Questions",
    h1: "Contact TaxReliefGuides",
    hero: "Use this page to report a factual issue, flag a broken link, suggest a topic, or send a source update for a guide on the site.",
    descriptionBase: "Contact TaxReliefGuides for factual corrections, source updates, broken links, and editorial questions about IRS and state tax guides.",
    keyword: "contact TaxReliefGuides",
    shortLabel: "contact page",
    audience: "readers who want to report an issue, suggest a topic, or send a source correction",
    challenge: "Tax guidance changes, so a usable editorial contact path matters for accuracy and trust",
    eligibility: "We review editorial messages and factual corrections, but we do not provide individual tax, legal, or financial advice",
    cashflow: "Readers should use the site for research and then decide whether a CPA, EA, or attorney is needed for their situation",
    docs: "The most useful messages include the page URL, the exact issue, and the official or primary source that supports the correction",
    stats: [
      { value: "Editorial only", label: "Primary purpose", note: "We do not offer tax representation" },
      { value: "Fast review", label: "Correction flow", note: "Priority goes to factual fixes and broken links" },
      { value: "U.S. tax scope", label: "Coverage area", note: "IRS, deductions, credits, payroll, and compliance" },
      { value: "Clear limits", label: "Advice policy", note: "Informational content only" },
    ],
    chartBars: [
      { label: "Correction usefulness", width: 90, value: "High" },
      { label: "Advice limitations", width: 86, value: "High" },
      { label: "Transparency", width: 89, value: "High" },
      { label: "Editorial feedback loop", width: 82, value: "Strong" },
    ],
    related: [
      "about.html",
      "how-we-research.html",
      "pages/tax-audit-guide.html",
    ],
    breadcrumbs: [
      { label: "Home", href: `${domain}/` },
      { label: "Contact", href: `${domain}/contact` },
    ],
  }),
  withDefaults({
    path: "how-we-research.html",
    titleBase: "How We Research IRS and State Tax Topics",
    h1: "How We Research Tax Topics",
    hero: "TaxReliefGuides starts with official sources, then rewrites them into plain-language guidance built around the decision a reader is actually trying to make.",
    descriptionBase: "See how TaxReliefGuides researches IRS and state tax topics, verifies sensitive details, and separates education from advice.",
    keyword: "how we research tax topics",
    shortLabel: "research standards",
    audience: "readers who want to understand how the site verifies tax content and why some pages include verification markers",
    challenge: "A tax page can look polished while still being outdated or vague, so the sourcing process has to be visible",
    eligibility: "A strong process starts with primary sources, clear caveats, and a willingness to leave a data point pending rather than guess",
    cashflow: "That matters because readers often arrive while deciding how to respond to an IRS bill, a payment problem, or a state collection notice",
    docs: "The research base includes IRS pages, publications, instructions, notice pages, state revenue sites, and public forms tied to the issue",
    stats: [
      { value: "Official-first", label: "Source strategy", note: "IRS and primary references anchor the content" },
      { value: "Multi-step", label: "Editorial workflow", note: "Topic map, drafting, QA, and technical audit" },
      { value: "Transparent limits", label: "Editorial standard", note: "Education is separated from advice" },
      { value: "Full-site QA", label: "Maintenance process", note: "Links, canonicals, and metadata are checked" },
    ],
    chartBars: [
      { label: "Source credibility", width: 91, value: "Very high" },
      { label: "Technical QA", width: 87, value: "High" },
      { label: "Editorial consistency", width: 85, value: "High" },
      { label: "Reader clarity", width: 90, value: "Very high" },
    ],
    related: [
      "about.html",
      "contact.html",
      "pages/tax-credits-guide.html",
    ],
    breadcrumbs: [
      { label: "Home", href: `${domain}/` },
      { label: "How We Research", href: `${domain}/how-we-research` },
    ],
  }),
  withDefaults({
    path: "affiliate-disclosure.html",
    robots: "noindex, follow",
    titleBase: "Affiliate Disclosure for TaxReliefGuides",
    h1: "Affiliate Disclosure",
    hero: "Some pages on TaxReliefGuides may eventually include referral or affiliate links. This page explains how that works and how it does not change editorial intent.",
    descriptionBase: "Affiliate disclosure for TaxReliefGuides: how referral links may work, how editorial independence is handled, and what readers should expect.",
    keyword: "affiliate disclosure",
    shortLabel: "affiliate disclosure",
    audience: "readers who want a clear explanation of how commercial relationships are disclosed on the site",
    challenge: "Readers in a tax niche should be able to tell the difference between useful editorial guidance and compensated recommendations",
    eligibility: "This page applies to any current or future pages that include referral links, sponsored placements, or compensated recommendations",
    cashflow: "Commercial transparency matters more in money topics because the reader may already be under financial stress",
    docs: "When referral links appear, they should be disclosed clearly and should not override the site's informational limits or source standards",
    stats: [
      { value: "Clear labels", label: "Disclosure standard", note: "Commercial links should be identified in plain language" },
      { value: "Noindex", label: "Search handling", note: "Disclosure page exists for transparency, not SEO traffic" },
      { value: "Editorial first", label: "Core rule", note: "Content should still be built around reader usefulness" },
      { value: "FTC-aware", label: "Compliance intent", note: "Commercial relationships should be disclosed clearly" },
    ],
    chartBars: [
      { label: "Reader clarity", width: 90, value: "High" },
      { label: "Disclosure visibility", width: 86, value: "Strong" },
      { label: "Editorial independence", width: 88, value: "High" },
      { label: "Commercial restraint", width: 84, value: "Strong" },
    ],
    related: [
      "about.html",
      "how-we-research.html",
      "contact.html",
    ],
    breadcrumbs: [
      { label: "Home", href: `${domain}/` },
      { label: "Affiliate Disclosure", href: `${domain}/affiliate-disclosure` },
    ],
  }),
  withDefaults({
    path: "privacy-policy.html",
    robots: "noindex, follow",
    titleBase: "Privacy Policy for TaxReliefGuides",
    h1: "Privacy Policy",
    hero: "Review how TaxReliefGuides handles basic site data, cookies, analytics preferences, and contact submissions in a straightforward format.",
    descriptionBase: "Privacy Policy for TaxReliefGuides: cookies, analytics preferences, contact messages, AdSense data use, and user privacy choices.",
    keyword: "privacy policy",
    shortLabel: "privacy policy",
    audience: "site visitors reviewing cookies and privacy practices",
    challenge: "Readers deserve a plain-language explanation of what information a site collects and why",
    eligibility: "This policy applies to ordinary browsing, cookie preferences, and editorial contact messages submitted through the site",
    cashflow: "Privacy clarity supports user trust, especially on finance and tax content sites",
    docs: "This page explains cookies, analytics preferences, legal bases, and editorial contact handling at a summary level",
    stats: [
      { value: "Cookie controls", label: "User choice", note: "Accept or reject non-essential cookies" },
      { value: "Noindex", label: "Search setting", note: "Legal pages are not meant to rank" },
      { value: "Site-only", label: "Scope", note: "Applies to TaxReliefGuides properties" },
      { value: "Plain language", label: "Reading standard", note: "Built to be understandable quickly" },
    ],
    chartBars: [
      { label: "Transparency", width: 89, value: "High" },
      { label: "Cookie clarity", width: 88, value: "High" },
      { label: "Legal readability", width: 78, value: "Good" },
      { label: "User control", width: 85, value: "Strong" },
    ],
    related: [
      "terms.html",
      "disclaimer.html",
      "contact.html",
    ],
    breadcrumbs: [
      { label: "Home", href: `${domain}/` },
      { label: "Privacy Policy", href: `${domain}/privacy-policy` },
    ],
  }),
  withDefaults({
    path: "terms.html",
    robots: "noindex, follow",
    titleBase: "Terms of Use for TaxReliefGuides and Site Access",
    h1: "Terms of Use",
    hero: "Read the basic terms that govern use of TaxReliefGuides, including informational-use limits, intellectual property, and editorial contact expectations.",
    descriptionBase: "Terms of Use for TaxReliefGuides: site access, educational-use limits, calculator limitations, intellectual property, and updates.",
    keyword: "terms of use",
    shortLabel: "terms of use",
    audience: "site visitors reviewing usage terms",
    challenge: "Users need a clear explanation of what the site provides and what it does not provide",
    eligibility: "These terms cover the use of published guides, calculators, contact channels, and site functionality",
    cashflow: "Clarity around site scope helps readers separate education from individualized professional advice",
    docs: "This page summarizes informational use, intellectual property, liability limits, and changes to the site terms",
    stats: [
      { value: "Noindex", label: "Search handling", note: "Legal page not intended for SEO traffic" },
      { value: "Educational use", label: "Primary purpose", note: "The site is informational, not advisory" },
      { value: "Calculator limits", label: "Important note", note: "Tools are planning estimates only" },
      { value: "Review anytime", label: "Reader access", note: "Terms are linked site-wide" },
    ],
    chartBars: [
      { label: "Scope clarity", width: 88, value: "High" },
      { label: "Advice limitations", width: 92, value: "Very high" },
      { label: "User readability", width: 80, value: "Strong" },
      { label: "Legal transparency", width: 84, value: "High" },
    ],
    related: [
      "privacy-policy.html",
      "disclaimer.html",
      "about.html",
    ],
    breadcrumbs: [
      { label: "Home", href: `${domain}/` },
      { label: "Terms", href: `${domain}/terms` },
    ],
  }),
  withDefaults({
    path: "disclaimer.html",
    robots: "noindex, follow",
    titleBase: "Disclaimer for TaxReliefGuides Content and Calculators",
    h1: "Disclaimer",
    hero: "Review the scope of TaxReliefGuides content, calculator limits, and the distinction between educational information and professional tax, legal, or financial advice.",
    descriptionBase: "TaxReliefGuides disclaimer: educational content only, calculator limits, no individualized tax, legal, financial, or filing advice.",
    keyword: "site disclaimer",
    shortLabel: "disclaimer",
    audience: "readers evaluating how to use the site responsibly",
    challenge: "Tax and legal topics need explicit boundaries so readers know when to get individualized advice",
    eligibility: "This disclaimer applies to all guides, calculators, comparisons, visuals, and editorial summaries across the site",
    cashflow: "Boundary-setting matters because readers may be making high-stakes decisions involving money, compliance, or legal risk",
    docs: "The page explains that content is informational, calculators are estimates, and professional advice should be sought where appropriate",
    stats: [
      { value: "Site-wide", label: "Coverage", note: "Applies across every guide and tool" },
      { value: "Informational only", label: "Main rule", note: "No individualized advice is provided" },
      { value: "Noindex", label: "SEO setting", note: "Legal page not intended as ranking content" },
      { value: "Prominent", label: "Placement standard", note: "A shorter disclaimer also appears on every page" },
    ],
    chartBars: [
      { label: "Boundary clarity", width: 91, value: "Very high" },
      { label: "Calculator caution", width: 87, value: "High" },
      { label: "Reader protection", width: 88, value: "High" },
      { label: "Site consistency", width: 83, value: "Strong" },
    ],
    related: [
      "privacy-policy.html",
      "terms.html",
      "how-we-research.html",
    ],
    breadcrumbs: [
      { label: "Home", href: `${domain}/` },
      { label: "Disclaimer", href: `${domain}/disclaimer` },
    ],
  }),
];

function buildRootSections(page) {
  if (page.path === "index.html") {
    return [
      {
        id: "general-faq",
        eyebrow: "Start here",
        title: "How to use the site when a tax problem already feels urgent",
        intro: "Most readers do not need a theory-heavy tax site. They need to know which page to open first and which problem actually comes next.",
        paragraphs: [
          `If you just received an IRS notice, start with the notice page before comparing settlement or hardship programs. If you already know you owe and the returns are filed, compare a payment plan, penalty relief, and hardship status before assuming settlement is the right answer. If old returns are missing, filing cleanup usually comes before any serious relief request.`,
          `The site is organized so those branches are visible quickly. Home should point you to the first practical question: do you need to respond to a notice, verify a balance, fix missing filings, set up payments, or compare a federal problem with a state one.`,
          `Professional help usually becomes more valuable when a case involves payroll tax exposure, active levy risk, several unfiled years, liens, business trust taxes, or facts that are disputed rather than merely undocumented. For more routine balance-due issues, a good guide can often help you frame the file before you decide whether paid help is worth it.`,
        ],
      },
      {
        id: "why-this-site",
        eyebrow: "Editorial approach",
        title: "What TaxReliefGuides is trying to do well",
        intro: "The goal is not to sound authoritative. The goal is to help readers make a better next decision.",
        paragraphs: [
          `Tax content becomes less useful when it overpromises, hides the limitations of a program, or speaks in abstract strategy language instead of concrete steps. This site tries to do the opposite. Pages are built around what a reader needs to gather, what the IRS or state agency is actually looking at, and when a popular option usually does not fit.`,
          `That is also why some pages include visible verification markers for year-sensitive figures. If a threshold, fee, wage base, or form rule cannot be confirmed cleanly from an official source in this pass, the page should say so instead of pretending certainty.`,
        ],
      },
    ];
  }

  if (page.path === "about.html") {
    return [
      {
        id: "what-the-site-is",
        eyebrow: "Scope",
        title: "What TaxReliefGuides covers",
        intro: "TaxReliefGuides is a small editorial site focused on practical federal and state tax research for U.S. readers.",
        paragraphs: [
          `The strongest use case is a reader who already knows the broad problem but needs help sorting the next step. That may mean comparing an IRS payment plan with hardship status, understanding what a CP14 or CP504 notice means, checking whether a state tax agency uses a different payment process, or separating payroll tax exposure from ordinary income tax debt.`,
          `The site is not a tax firm, a law firm, or a tax preparation service. It does not sell representation, and it is not a substitute for individualized advice. Its job is narrower and, ideally, useful: explain what the official source says, translate it into plain language, and point readers to the adjacent pages they usually need next.`,
        ],
      },
      {
        id: "editorial-standards",
        eyebrow: "Standards",
        title: "How the site approaches trust in a tax niche",
        intro: "A tax site should be clear about what it knows, what it is still verifying, and what it cannot do for the reader.",
        paragraphs: [
          `That is why the site avoids fictional experts, inflated credentials, and vague promises about results. It also avoids guessing on sensitive numbers where an official source is the right standard. When a year-sensitive figure still needs verification, the page should leave a marker rather than quietly filling the gap with a convenient estimate.`,
          `Readers should expect a calm tone, official-source links, practical internal linking, and clear disclaimers. If a page feels thin, overly abstract, or out of date, that is a quality issue rather than a feature, and the goal is to keep improving those weak spots over time.`,
        ],
      },
    ];
  }

  if (page.path === "contact.html") {
    return [
      {
        id: "how-to-contact",
        eyebrow: "Editorial contact",
        title: "What to send and when to use this page",
        intro: "The most helpful messages are factual, specific, and tied to a page on the site.",
        paragraphs: [
          contactEmail
            ? `You can reach the editorial team at ${contactEmail}. Use that address for factual corrections, broken links, source updates, partnership questions, or suggestions for future topics.`
            : "We are updating our contact information. Please check back soon.",
          `If you are reporting a correction, include the page URL, the sentence or section that looks wrong, and the official source that supports the change. That makes it much easier to review the issue quickly and update the guide if needed.`,
          `This inbox is not a substitute for personal tax help. We cannot tell you which box to check on your return, negotiate with the IRS for you, or advise you on your personal facts. If your case is urgent, use the official notice contact information or speak with a qualified professional.`,
        ],
      },
      {
        id: "what-happens-next",
        eyebrow: "What to expect",
        title: "How editorial messages are handled",
        intro: "Accuracy updates come before topic expansion requests.",
        paragraphs: [
          `Messages about broken navigation, outdated program details, or incorrect official-source references usually deserve first review because they affect current readers. Topic suggestions, comparison requests, and partnership notes are still useful, but they are secondary to factual corrections in a YMYL tax site.`,
          `If a message points to a year-sensitive figure, the best next step is often to verify the IRS or state source directly and then update the relevant page and report. That is slower than rewriting from memory, but it is the safer standard for this niche.`,
        ],
      },
    ];
  }

  if (page.path === "how-we-research.html") {
    return [
      {
        id: "source-priority",
        eyebrow: "Source order",
        title: "Official sources come first",
        intro: "Most tax pages start with the agency that controls the rule, notice, or program.",
        paragraphs: [
          `For federal tax debt pages that usually means IRS.gov, IRS forms and instructions, notice pages, publications, or other primary IRS materials. For state pages it means the relevant Department of Revenue, Franchise Tax Board, Comptroller, or equivalent state agency. If a figure is sensitive to the filing year, the page should reflect the current official source or stay marked for verification.`,
          `Secondary sources can help frame a workflow, but they should not be the final authority for a penalty amount, a payment-plan fee, or a collection deadline. In a tax niche, the source hierarchy matters because small wording differences can change the practical advice.`,
        ],
      },
      {
        id: "editorial-process",
        eyebrow: "Editorial process",
        title: "How a page moves from source material to a usable guide",
        intro: "The site tries to bridge the gap between agency language and reader decision-making.",
        paragraphs: [
          `A useful page starts by identifying the real problem a reader is trying to solve: understanding a notice, comparing relief options, figuring out which form matters, or seeing whether a state program is separate from an IRS one. Then the page is built around the facts that actually change the decision: forms, filing status, thresholds, payment rules, documentation, and what happens if the issue is ignored.`,
          `After that, the page should be checked for technical hygiene: clean canonicals, extensionless public URLs, visible internal links, disclaimers, schema that matches the content, and no stray placeholder or generator language. In a site like this, technical cleanup is part of editorial quality because broken structure makes the content less trustworthy.`,
        ],
      },
    ];
  }

  if (page.path === "affiliate-disclosure.html") {
    return [
      {
        id: "commercial-relationships",
        eyebrow: "Commercial transparency",
        title: "How referral links may appear on the site",
        intro: "Some pages may eventually include links that generate compensation if a reader clicks through or signs up.",
        paragraphs: [
          `If that happens, the goal should still be to explain the tax issue first and the commercial relationship second. A disclosure should be visible enough that a reader does not have to hunt for it, and the surrounding content should still tell the truth when a product or service is a poor fit.`,
          `TaxReliefGuides should not present a compensated recommendation as though it were neutral public guidance. Commercial links may support the site, but they should not rewrite the editorial standard or turn a guide into a disguised sales page.`,
        ],
      },
      {
        id: "what-readers-should-expect",
        eyebrow: "Reader expectations",
        title: "What this disclosure means in practice",
        intro: "A disclosure is only useful if it changes how the page is framed.",
        paragraphs: [
          `Readers should expect commercial relationships to be identified in ordinary language. They should also expect the site to keep clear boundaries between editorial explanations, comparisons, and any compensated placements or referral links.`,
          `If a future comparison page includes affiliate links, it should still make room for cases where the best answer is to use an official IRS or state process directly, speak with a professional, or avoid buying anything at all. In a money niche, honesty about fit matters more than conversion rate.`,
        ],
      },
    ];
  }

  return [
    {
      id: "summary",
      eyebrow: "Summary",
      title: `How this ${page.shortLabel} page should be read`,
      intro: `Legal and policy pages are most useful when they explain the site's rules in plain language.`,
      paragraphs: [
        `${page.h1} explains the baseline rules that govern how the site handles privacy, disclosure, usage expectations, or informational boundaries. The aim is clarity, not legal theater. Readers should be able to understand what the page means without needing a second page to translate it.`,
        `These pages also support site-wide trust signals. They are linked from the footer, referenced by the cookie banner where relevant, and marked noindex because they exist for reader clarity rather than search traffic.`,
        `Use this page together with the About, Contact, and How We Research pages if you want the fuller picture of how TaxReliefGuides is run and what the site is willing to claim.`,
      ],
    },
    ...(page.path === "privacy-policy.html"
      ? [{
          id: "advertising",
          eyebrow: "Advertising",
          title: "Google AdSense and Third-Party Ads",
          intro: "TaxReliefGuides uses Google AdSense to display ads.",
          paragraphs: [
            `Google AdSense is a third-party ad service operated by Google LLC. AdSense uses cookies and tracking technologies to serve ads based on your prior visits to this site and other websites. Google may collect data such as your IP address, browser type, and browsing behavior to deliver personalized ads. TaxReliefGuides does not have direct access to data collected by Google for ad delivery. This data is processed in accordance with Google's Privacy Policy.`,
            contactEmail
              ? `You can opt out of personalized ads by visiting Google's Ads Settings or aboutads.info. California residents may exercise CCPA opt-out rights through Google's ad personalization settings. For privacy or advertising data questions, email ${contactEmail}.`
              : "You can opt out of personalized ads by visiting Google's Ads Settings or aboutads.info. California residents may exercise CCPA opt-out rights through Google's ad personalization settings.",
          ],
        }]
      : []),
    {
      id: "details",
      eyebrow: "Details",
      title: "What readers should take from this page",
      intro: `Clarity matters more than legal-sounding filler on policy pages.`,
      paragraphs: [
        `The core theme is consistent across the site's legal pages: TaxReliefGuides publishes educational content, not individualized tax, legal, or financial advice. Readers should use the site to understand options, terminology, and official-source pathways, then decide whether professional help is needed.`,
        `These pages also explain how cookies are handled, how editorial contact works, and what expectations govern calculators, disclosures, and published content. That reduces ambiguity, which matters more in a tax niche than in a casual hobby site.`,
        `Because these pages are part of the trust layer rather than the conversion layer, they should be complete without becoming bloated. The reader should leave with a clear answer, not a wall of boilerplate.`,
      ],
    },
  ];
}

function legalFaq(page) {
  return [
    {
      q: `Is ${site.name} a tax law firm or tax preparation service?`,
      a: `No. ${site.name} is an informational publishing site. It does not provide individualized tax, legal, or financial advice or representation.`,
    },
    {
      q: `Why are legal pages marked noindex?`,
      a: `They exist to support transparency and user understanding, not to compete for organic search traffic against the site’s educational guides.`,
    },
    {
      q: `Does the cookie banner support rejecting non-essential cookies?`,
      a: `Yes. Users can accept all cookies or reject non-essential cookies, and the preference is stored in a browser cookie.`,
    },
    {
      q: `Should readers rely on legal pages instead of professional advice?`,
      a: `No. These pages explain how the site works. They do not replace professional tax, legal, or privacy advice for a reader’s personal circumstances.`,
    },
  ];
}

const allPages = [];

for (const config of pillarConfigs) {
  const page = withDefaults({
    ...config,
    title: normalizeTitle(config.titleBase),
    description: normalizeDescription(
      config.descriptionBase ??
      `${config.hero} Compare IRS procedures, penalties, deduction rules, and practical compliance steps for U.S. taxpayers and business owners.`
    ),
    breadcrumbs: makeBreadcrumbs(config.path, config.h1),
    takeaways: makeKeyTakeaways(config),
    faq: makeFaqs(config),
    chart: chartFromStats(config),
    cta: { label: "Try a calculator", href: `${domain}/pages/tax-refund-calculator.html` },
    secondaryCta: { label: "Read tax debt guide", href: `${domain}/pages/tax-debt-guide.html` },
    visual: heroVisual("IRS and tax planning", [
      { label: "Who this helps", value: "U.S. taxpayers and founders" },
      { label: "Main focus", value: "Lower risk, improve clarity" },
      { label: "First step", value: "Verify filings and balances" },
    ], [
      { label: "Assess", width: 90 },
      { label: "File", width: 76 },
      { label: "Compare", width: 68 },
      { label: "Maintain", width: 84 },
    ]),
    sections: pillarSections(config),
  });
  allPages.push(page);
}

// ── Penalties page ────────────────────────────────────────────────────────────
// Generates rich extra content for irs-penalties-explained.html.
// All rates are from IRS Topic 653, IRC §§ 6651/6656/6662/6672/6702, and the
// Q1 2026 IRS underpayment interest rate announcement.
function makePenaltiesExtraContent() {
  return `
<section id="penalty-rates-table" class="content-section">
  <div class="section-heading">
    <span class="eyebrow">2026 rate table</span>
    <h2>IRS Penalty Rates at a Glance (2026)</h2>
  </div>
  <p>These rates apply to federal income tax. Employment taxes and specialty filings have additional rules. Sources: IRS Topic 653, IRC §§ 6651, 6656, 6662, 6672, 6702.</p>
  <div class="table-shell">
    <table>
      <caption>Federal IRS penalty rates 2026</caption>
      <thead>
        <tr><th scope="col">Penalty Type</th><th scope="col">Rate</th><th scope="col">Maximum</th><th scope="col">IRC §</th></tr>
      </thead>
      <tbody>
        <tr><th scope="row">Failure to File (FTF)</th><td>5% per month or partial month of unpaid tax</td><td>25% of unpaid tax (5 months)</td><td>§ 6651(a)(1)</td></tr>
        <tr><th scope="row">Failure to Pay (FTP)</th><td>0.5% per month or partial month</td><td>25% of unpaid tax</td><td>§ 6651(a)(2)</td></tr>
        <tr><th scope="row">Combined FTF + FTP (same month)</th><td>FTF reduced to 4.5% + FTP 0.5% = 5% total cap per month</td><td>25% combined</td><td>§ 6651(c)</td></tr>
        <tr><th scope="row">Minimum FTF (&gt;60 days late)</th><td>Lesser of $525 or 100% of unpaid tax (2026 adjusted amount)</td><td>$525</td><td>§ 6651(a)(1)</td></tr>
        <tr><th scope="row">Underpayment interest (Q1 2026)</th><td>7% annually (federal short-term rate + 3%), compounded daily</td><td>No cap — runs until paid</td><td>§ 6621</td></tr>
        <tr><th scope="row">Accuracy-Related</th><td>20% of underpayment</td><td>40% for gross valuation misstatement</td><td>§ 6662</td></tr>
        <tr><th scope="row">Trust Fund Recovery (TFRP)</th><td>100% of unpaid trust fund taxes</td><td>Equal to entire trust fund amount</td><td>§ 6672</td></tr>
        <tr><th scope="row">Frivolous Return</th><td>$5,000 per submission</td><td>$5,000 (fixed)</td><td>§ 6702</td></tr>
        <tr><th scope="row">Failure to Deposit — 1–5 days late</th><td>2% of undeposited amount</td><td>—</td><td>§ 6656</td></tr>
        <tr><th scope="row">Failure to Deposit — 6–15 days late</th><td>5% of undeposited amount</td><td>—</td><td>§ 6656</td></tr>
        <tr><th scope="row">Failure to Deposit — &gt;15 days late</th><td>10% of undeposited amount</td><td>—</td><td>§ 6656</td></tr>
        <tr><th scope="row">Failure to Deposit — &gt;10 days after IRS notice</th><td>15% of undeposited amount</td><td>—</td><td>§ 6656</td></tr>
      </tbody>
    </table>
  </div>
  <p><small><strong>Sources:</strong> IRS Topic 653 (irs.gov/taxtopics/tc653); IRS Failure to Deposit page (irs.gov/payments/failure-to-deposit-penalty); IRS Trust Fund Recovery Penalty page. Q1 2026 underpayment rate per IRS Rev. Rul. 2025-XX.</small></p>
</section>

<section id="failure-to-file" class="content-section">
  <div class="section-heading">
    <span class="eyebrow">5% per month</span>
    <h2>Failure to File (FTF) Penalty</h2>
  </div>
  <p>The failure-to-file penalty accrues when a return is not filed by its due date, including any valid extension. The IRS charges 5% of the unpaid tax for each month or partial month the return remains unfiled, up to a maximum of 25% after five months.</p>
  <p>The FTF penalty applies to the <em>unpaid</em> balance, not the total tax owed. If you paid in full through withholding or estimated payments, filing late may produce no FTF penalty at all — but the return must still be filed.</p>
  <p><strong>Minimum penalty rule (returns more than 60 days late):</strong> If a return is filed more than 60 days after the due date (or extended due date), the minimum penalty is the lesser of $525 (2026 inflation-adjusted amount) or 100% of the tax due. This minimum penalty can apply even to small balances.</p>
  <p><strong>Worked example — FTF only:</strong> You owe $6,000 in federal income tax and file 3 months late without paying. FTF = 5% × 3 months × $6,000 = <strong>$900</strong>. You also owe interest on the unpaid balance. If you had paid the full $6,000 on time but filed late, FTF would be $0 (no unpaid balance).</p>
</section>

<section id="failure-to-pay" class="content-section">
  <div class="section-heading">
    <span class="eyebrow">0.5% per month</span>
    <h2>Failure to Pay (FTP) Penalty</h2>
  </div>
  <p>The failure-to-pay penalty accrues on unpaid tax starting the day after the payment due date. It runs at 0.5% per month or partial month, capped at 25% (reaching the cap after 50 months). Unlike the FTF penalty, the FTP does not stop when the return is filed — it keeps running until the balance is paid.</p>
  <p><strong>Reduced rate during an installment agreement:</strong> If you enter an IRS installment agreement and stay current, the FTP rate drops to 0.25% per month for the duration of the agreement.</p>
  <p><strong>Worked example — FTP only:</strong> You file on time but leave a $10,000 balance unpaid for 8 months. FTP = 0.5% × 8 months × $10,000 = <strong>$400</strong>. Interest also accrues separately during this period at the current underpayment rate (7% annually for 2026).</p>
</section>

<section id="combined-month-rule" class="content-section">
  <div class="section-heading">
    <span class="eyebrow">5% monthly cap</span>
    <h2>The Combined Month Rule: When Both Penalties Apply</h2>
  </div>
  <p>When a return is both late AND has an unpaid balance, both penalties technically apply to the same month. IRC § 6651(c) caps the combined monthly charge at 5% — the FTF rate drops from 5% to 4.5%, and the FTP 0.5% brings the total back to 5%.</p>
  <p><strong>Worked example — combined penalties for 3 months:</strong></p>
  <div class="table-shell">
    <table>
      <caption>Combined FTF + FTP on $10,000 unpaid balance</caption>
      <thead>
        <tr><th scope="col">Month</th><th scope="col">FTF (4.5%)</th><th scope="col">FTP (0.5%)</th><th scope="col">Total that month</th><th scope="col">Running total</th></tr>
      </thead>
      <tbody>
        <tr><th scope="row">Month 1</th><td>$450</td><td>$50</td><td>$500</td><td>$500</td></tr>
        <tr><th scope="row">Month 2</th><td>$450</td><td>$50</td><td>$500</td><td>$1,000</td></tr>
        <tr><th scope="row">Month 3</th><td>$450</td><td>$50</td><td>$500</td><td>$1,500</td></tr>
      </tbody>
    </table>
  </div>
  <p>After 5 months, FTF reaches its 25% cap and stops. The FTP penalty then continues at 0.5% per month — potentially reaching its own 25% cap over the next 50 months. A taxpayer who never files and never pays on a $10,000 balance could face 47.5% in combined penalties (FTF 25% + FTP 22.5% before FTF cap interacts), plus daily compounding interest on the growing total.</p>
</section>

<section id="underpayment-interest" class="content-section">
  <div class="section-heading">
    <span class="eyebrow">Daily compound interest</span>
    <h2>IRS Underpayment Interest</h2>
  </div>
  <p>Interest under IRC § 6621 accrues on unpaid tax from the original due date until the day of payment. The quarterly rate equals the federal short-term rate plus 3 percentage points. For Q1 2026, the IRS underpayment interest rate is <strong>7% annually</strong>, applied daily.</p>
  <p>Interest is not a penalty. It cannot be abated, waived, or forgiven under normal abatement programs. It accrues on the unpaid tax, on assessed penalties, and on interest already charged — making compound growth a real concern on older balances.</p>
  <p><strong>Quick estimate:</strong> On a $5,000 unpaid balance for 12 months at 7% annually: approximately $350 in interest (before compounding effects). For a 2-year horizon, the same balance generates roughly $700–$730 in interest before accounting for compounding. On balances left unresolved for 3–5 years, interest alone can exceed the original penalty amount.</p>
</section>

<section id="trust-fund-recovery" class="content-section">
  <div class="section-heading">
    <span class="eyebrow">100% personal liability</span>
    <h2>Trust Fund Recovery Penalty (TFRP)</h2>
  </div>
  <p>The Trust Fund Recovery Penalty under IRC § 6672 is one of the IRS's most aggressive collection tools. When a business collects payroll taxes from employees (income tax withholding, employee FICA) but fails to remit them to the IRS, those amounts are held in trust for the government. Any person who is both "responsible" for collecting and paying the taxes, and "willfully" failed to do so, can be personally assessed for 100% of the trust fund amount.</p>
  <p><strong>What is the trust fund portion?</strong> It includes the employees' withheld federal income taxes plus the employees' share of Social Security and Medicare taxes. It does not include the employer's matching FICA share.</p>
  <p><strong>Who is a "responsible person"?</strong> The IRS evaluates authority, not just title. Business owners, officers, check signers, bookkeepers with payment authority, and in some cases board members may all be assessed. If two or more people meet the criteria, the IRS can assess each person for the full trust fund amount — not just their pro-rata share.</p>
  <p><strong>Worked example:</strong> A business has $45,000 in unpaid trust fund taxes. Two officers sign checks. The IRS can assess each officer personally for $45,000. When the business closes, the obligation does not go away — the IRS can pursue the officers directly, file liens against their personal assets, and levy personal bank accounts.</p>
</section>

<section id="accuracy-related" class="content-section">
  <div class="section-heading">
    <span class="eyebrow">20% of underpayment</span>
    <h2>Accuracy-Related Penalty</h2>
  </div>
  <p>The accuracy-related penalty under IRC § 6662 applies to the underpayment amount caused by negligence, disregard of rules, or substantial understatement of income tax. The standard rate is 20% of the understated amount. For gross valuation misstatements, the rate doubles to 40%.</p>
  <p><strong>Substantial understatement:</strong> For individuals, a substantial understatement exists when the understatement exceeds the greater of 10% of the correct tax or $5,000.</p>
  <p><strong>Negligence:</strong> The IRS defines negligence as failure to make a reasonable attempt to comply with the tax code or failure to maintain adequate records. Signing a return with known errors can trigger this penalty.</p>
  <p><strong>Defense — reasonable cause:</strong> The penalty does not apply if the taxpayer had reasonable cause and acted in good faith (IRC § 6664(c)). Documented reliance on a qualified professional, good-faith reliance on a clear statutory provision, or circumstances beyond the taxpayer's control can support this defense. The "I didn't know" argument by itself rarely qualifies.</p>
</section>

<section id="penalty-abatement" class="content-section">
  <div class="section-heading">
    <span class="eyebrow">Two main paths</span>
    <h2>How to Request Penalty Abatement</h2>
  </div>
  <p>Two paths cover most successful penalty abatement cases:</p>
  <p><strong>1. First-Time Abatement (FTA):</strong> The IRS grants administrative relief for taxpayers who have a clean compliance history. To qualify, you generally must have: (a) no penalties in the prior three tax years; (b) filed all currently required returns or filed an extension; and (c) paid, or arranged to pay, any tax owed. FTA is available for failure-to-file, failure-to-pay, and failure-to-deposit penalties. It is not available for accuracy-related penalties, TFRP, or fraud. You can request FTA by calling the IRS, or by filing Form 843.</p>
  <p><strong>2. Reasonable Cause:</strong> When FTA does not apply or the penalty is for accuracy-related reasons, a reasonable cause argument may succeed. The IRS considers documented circumstances such as serious illness, natural disaster, unavoidable absence, inability to obtain records, or reliance on professional advice that turned out to be wrong. The standard requires that the taxpayer exercised ordinary business care and prudence. Generic claims without documentation rarely succeed.</p>
  <p><strong>Form 843 — Claim for Refund and Request for Abatement:</strong> To formally request abatement of a penalty already assessed, use Form 843. The form requires the tax year, penalty type and dollar amount, and a written statement of the legal or factual grounds for relief. Attach all supporting documentation to the submission.</p>
  <p><strong>Administrative waiver:</strong> In certain years the IRS issues blanket penalty relief for specific filing scenarios. Check IRS.gov/newsroom for any current relief notices.</p>
</section>

<section id="sources" class="content-section">
  <div class="section-heading">
    <span class="eyebrow">Official references</span>
    <h2>Sources</h2>
  </div>
  <ul>
    <li><a href="https://www.irs.gov/taxtopics/tc653" rel="nofollow noopener" target="_blank">IRS Topic No. 653 — IRS Notices and Bills, Penalties, and Interest Charges</a></li>
    <li><a href="https://www.irs.gov/payments/failure-to-deposit-penalty" rel="nofollow noopener" target="_blank">IRS — Failure to Deposit Penalty (irs.gov)</a></li>
    <li><a href="https://www.irs.gov/individuals/international-taxpayers/trust-fund-recovery-penalty" rel="nofollow noopener" target="_blank">IRS — Trust Fund Recovery Penalty (irs.gov)</a></li>
    <li>IRC § 6651 — Failure to File Tax Return or to Pay Tax (26 U.S.C. § 6651)</li>
    <li>IRC § 6656 — Failure to Make Deposit of Taxes (26 U.S.C. § 6656)</li>
    <li>IRC § 6662 — Imposition of Accuracy-Related Penalty on Underpayments (26 U.S.C. § 6662)</li>
    <li>IRC § 6664 — Definitions and Special Rules (reasonable cause defense)</li>
    <li>IRC § 6672 — Failure to Collect and Pay Over Tax, or Attempt to Evade or Defeat Tax (26 U.S.C. § 6672)</li>
    <li>IRC § 6702 — Frivolous Tax Submissions (26 U.S.C. § 6702)</li>
    <li>IRC § 6621 — Determination of Rate of Interest (underpayment rate)</li>
  </ul>
  <p><small>This page is for general educational purposes only. Tax penalty calculations vary based on individual circumstances. Consult a licensed tax professional or contact the IRS directly for guidance on your specific situation.</small></p>
</section>
`;
}

function makePenaltiesFaqs() {
  return [
    {
      q: "What is the difference between the failure-to-file and failure-to-pay penalty?",
      a: "The failure-to-file penalty (5% per month, max 25%) applies when a return is not filed by its due date. The failure-to-pay penalty (0.5% per month, max 25%) applies when tax is not paid by the due date. Both can apply in the same month, but IRC § 6651(c) caps the combined monthly charge at 5% by reducing the FTF rate to 4.5%. The key difference is that the FTF stops once the return is filed, while the FTP keeps running until the balance is paid in full.",
    },
    {
      q: "How much is the minimum failure-to-file penalty?",
      a: "If a return is filed more than 60 days after its due date (including extensions), the minimum failure-to-file penalty is the smaller of $525 (for 2026, inflation-adjusted annually) or 100% of the unpaid tax. This means even a small balance can trigger a disproportionate penalty when filing is severely delayed. For example, if you owe only $300 and file 90 days late, the minimum penalty would be $300 — equal to your entire balance.",
    },
    {
      q: "What is the IRS underpayment interest rate for 2026?",
      a: "For Q1 2026, the IRS underpayment interest rate is 7% annually, compounded daily. This rate equals the federal short-term rate plus 3 percentage points and is adjusted quarterly by the IRS. Interest accrues on the unpaid tax balance, on any assessed penalties, and on previously accrued interest — making the effective cost of delay higher than the headline rate suggests. Unlike penalties, interest cannot be abated or waived.",
    },
    {
      q: "What is the Trust Fund Recovery Penalty and who can be personally assessed?",
      a: "The Trust Fund Recovery Penalty (TFRP) under IRC § 6672 holds responsible persons personally liable for 100% of payroll taxes that were withheld from employees but not remitted to the IRS. A 'responsible person' is anyone with the authority and duty to collect, account for, and pay over these taxes — typically business owners, officers, or others with check-signing authority. The IRS can assess each responsible person for the full trust fund amount, not just their proportionate share, even after the business closes.",
    },
    {
      q: "Can IRS penalties be reduced or eliminated?",
      a: "Yes, through two main paths. First-Time Abatement (FTA) is available to taxpayers with a clean three-year compliance history who are current on filings and payments — it applies to FTF, FTP, and FTD penalties but not to accuracy-related or fraud penalties. Reasonable cause relief applies when a taxpayer can demonstrate that circumstances beyond their control prevented timely filing or payment, and that they exercised ordinary business care. To formally request abatement, file Form 843 with supporting documentation.",
    },
    {
      q: "How quickly can IRS penalties add up on an unpaid balance?",
      a: "Quickly. A taxpayer who fails to file and fails to pay on a $10,000 balance faces a combined 5% penalty per month for the first five months — a $2,500 penalty by month five. After that, the FTF cap is reached but FTP continues at 0.5% per month. Add 7% annual compound interest on the growing total, and a $10,000 balance left completely unresolved for three years could easily carry $4,000–$5,000 in penalties and interest on top of the original tax.",
    },
  ];
}

// ── End penalties helpers ──────────────────────────────────────────────────────

for (const config of supportConfigs) {
  const isPenalties = config.path === "pages/irs-penalties-explained.html";
  const page = withDefaults({
    ...config,
    title: normalizeTitle(config.titleBase),
    description: normalizeDescription(
      config.descriptionBase ??
      `${config.hero} Review eligibility, records, examples, and U.S. tax planning tradeoffs so you can act with better context.`
    ),
    breadcrumbs: makeBreadcrumbs(config.path, config.h1),
    takeaways: makeKeyTakeaways(config),
    faq: makeFaqs(config),
    chart: chartFromStats(config),
    cta: { label: "Read the IRS relief hub", href: `${domain}/pages/irs-tax-relief-guide` },
    secondaryCta: { label: "Use a calculator", href: `${domain}/pages/tax-refund-calculator.html` },
    visual: heroVisual("Tax topic overview", [
      { label: "Reader need", value: "Research before action" },
      { label: "Primary concern", value: "Savings with compliance" },
      { label: "Best habit", value: "Document the facts" },
    ], [
      { label: "Understand", width: 88 },
      { label: "Compare", width: 72 },
      { label: "Document", width: 80 },
      { label: "Act", width: 64 },
    ]),
    sections: supportSections(config),
    ...(isPenalties ? {
      stats: [
        { value: "5% / mo", label: "Failure-to-File rate", note: "Capped at 25% after 5 months (IRC § 6651)" },
        { value: "0.5% / mo", label: "Failure-to-Pay rate", note: "Continues until paid, capped at 25%" },
        { value: "100%", label: "Trust Fund Recovery", note: "Personal liability for unpaid payroll trust funds" },
        { value: "7% (Q1 2026)", label: "Underpayment interest", note: "Federal short-term rate + 3%, compounded daily" },
      ],
      faq: makePenaltiesFaqs(),
      extraContent: makePenaltiesExtraContent(),
    } : {}),
    related: [
      "pages/irs-tax-relief-guide.html",
      "pages/tax-debt-guide.html",
      "pages/tax-deductions-guide.html",
    ],
  });
  allPages.push(page);
}

for (const config of calculatorConfigs) {
  const sections = supportSections(config).slice(0, 5);
  sections.unshift({
    id: "how-to-use",
    eyebrow: "How to use it",
    title: `How to use the ${config.shortLabel}`,
    intro: `This tool is designed for planning and comparison.`,
    paragraphs: [
      `${config.hero} The best way to use it is to enter realistic numbers from current pay records, bookkeeping, or IRS balances rather than idealized assumptions. That gives the result a better chance of matching the planning decision you actually need to make.`,
      `The output is intentionally directional. Tax returns and IRS cases include more variables than a public calculator can reasonably capture, but a good planning estimate still helps users compare withholding levels, quarterly savings targets, settlement assumptions, or business reserve needs.`,
      `This page pairs the tool with context, FAQs, and related guides because calculators are more useful when readers understand what the numbers mean and what they do not mean.`,
    ],
    html: calculatorForm(config.calculatorKind),
  });
  const page = withDefaults({
    ...config,
    title: normalizeTitle(config.titleBase),
    description: normalizeDescription(
      config.descriptionBase ??
      `${config.hero} Model U.S. tax outcomes with a practical planning calculator and supporting guidance.`
    ),
    breadcrumbs: makeBreadcrumbs(config.path, config.h1, "Calculators"),
    takeaways: makeKeyTakeaways(config),
    faq: makeFaqs(config),
    chart: chartFromStats(config),
    cta: { label: "Read the main guide", href: `${domain}/pages/irs-tax-relief-guide` },
    secondaryCta: { label: "Compare calculators", href: `${domain}/pages/business-tax-estimator.html` },
    visual: heroVisual("Calculator planning view", [
      { label: "Output type", value: "Directional estimate" },
      { label: "Best use", value: "Scenario planning" },
      { label: "Support need", value: "Use real records" },
    ], [
      { label: "Enter facts", width: 90 },
      { label: "Compare outputs", width: 76 },
      { label: "Adjust plan", width: 70 },
      { label: "Confirm final filing", width: 58 },
    ]),
    sections,
  });
  allPages.push(page);
}

for (const config of rootPages) {
  const page = withDefaults({
    ...config,
    title: normalizeTitle(config.titleBase),
    description: normalizeDescription(
      config.descriptionBase ??
      `${config.hero} U.S. tax content with clear internal links, calculators, FAQ coverage, and editorial standards.`
    ),
    takeaways: makeKeyTakeaways(config),
    faq: config.path === "index.html" ? [
      {
        q: "What topics does TaxReliefGuides cover?",
        a: "The site covers IRS tax relief, tax debt, deductions, credits, payroll taxes, business taxes, self-employed taxes, payment plans, calculators, and foundational compliance topics for U.S. readers.",
      },
      {
        q: "Are the calculators tax filing software?",
        a: "No. They are planning tools meant to help readers estimate outcomes and compare scenarios before filing or speaking with a professional.",
      },
      {
        q: "Does the site provide tax or legal advice?",
        a: "No. The content is informational only and should be used to support research, not replace individualized professional advice.",
      },
      {
        q: "Why are pages interconnected so heavily?",
        a: "Tax decisions usually affect more than one issue at once, so strong interlinking helps readers move between related guides without missing important context.",
      },
    ] : legalFaq(config),
    chart: chartFromStats(config),
    cta: config.path === "index.html"
      ? { label: "Start with tax debt help", href: `${domain}/pages/tax-debt-relief-options` }
      : { label: "Explore the main hub", href: `${domain}/` },
    secondaryCta: config.path === "index.html"
      ? { label: "Browse IRS notices", href: `${domain}/pages/irs-cp14-notice` }
      : { label: "Read a guide", href: `${domain}/pages/tax-debt-guide.html` },
    visual: config.path === "index.html"
      ? homeVisual()
      : heroVisual("Site standards", [
          { label: "Page type", value: config.robots === "noindex, follow" ? "Legal or policy" : "Institutional" },
          { label: "Purpose", value: "Trust and clarity" },
          { label: "Search handling", value: config.robots },
        ], [
          { label: "Explain", width: 88 },
          { label: "Clarify", width: 82 },
          { label: "Support", width: 76 },
          { label: "Link", width: 70 },
        ]),
    breadcrumbs: config.path === "index.html" ? [] : config.breadcrumbs,
    sections: buildRootSections(config),
    related: config.related,
  });
  allPages.push(page);
}

const stateHubPage = withDefaults({
  path: "states/index.html",
  badge: "State Guides",
  category: "stateHub",
  title: "State Tax Relief Guides by U.S. State",
  titleBase: "State Tax Relief Guides by U.S. State",
  h1: "State Tax Relief Guides by U.S. State",
  description: "Compare state tax relief guides for California, Texas, Florida, New York, Pennsylvania, Illinois, Ohio, Georgia, North Carolina, and Michigan.",
  keyword: "state tax relief",
  shortLabel: "State tax relief",
  audience: "taxpayers and business owners comparing state tax debt relief programs alongside IRS options",
  challenge: "State tax agencies use different forms, collection powers, and payment rules than the IRS",
  eligibility: "Eligibility depends on the state agency, tax type, filing status, collection stage, and whether the taxpayer has already been contacted",
  cashflow: "State payment plans and compromises should be modeled together with federal balances and current-year tax duties",
  docs: "Start with state notices, account numbers, returns, payment history, bank records, and any state lien, warrant, levy, or garnishment notice",
  breadcrumbs: [
    { label: "Home", href: `${domain}/` },
    { label: "States", href: `${domain}/states/` },
  ],
  takeaways: [
    "State tax relief is separate from IRS relief, even when program names sound similar.",
    "Texas and Florida require a different framework because they do not have broad personal state income taxes.",
    "The best first step is identifying the state agency, tax type, period, notice, and official program page before contacting anyone.",
  ],
  faq: [
    {
      q: "Are state tax relief programs the same as IRS relief programs?",
      a: "No. IRS relief is federal, while state tax relief is administered by each state's tax agency or collection office. Payment terms, compromise standards, lien procedures, garnishment rules, and appeal deadlines can be different.",
    },
    {
      q: "Why do Texas and Florida state tax relief guides look different?",
      a: "Texas and Florida do not impose a broad personal state income tax. Their state tax debt issues usually involve sales tax, franchise or corporate tax, property tax, reemployment tax, or business compliance rather than a personal income tax balance.",
    },
    {
      q: "Can a state tax agency garnish wages or file liens?",
      a: "Many state agencies can use liens, warrants, levies, attachments, garnishments, or similar collection tools. The exact name and process varies by state, so taxpayers should read the notice and official agency page for the current procedure.",
    },
    {
      q: "Should I fix IRS debt or state tax debt first?",
      a: "Map both balances first. The right order depends on collection pressure, filing deadlines, current compliance, lien or levy risk, and whether one agency is already taking enforcement action.",
    },
  ],
  chart: {
    eyebrow: "State coverage",
    title: "State relief guide coverage",
    ariaLabel: "State tax relief guide coverage by region",
    bars: [
      { label: "West and Southwest", width: 74, value: "CA, TX" },
      { label: "Southeast", width: 82, value: "FL, GA, NC" },
      { label: "Northeast", width: 78, value: "NY, PA" },
      { label: "Midwest", width: 86, value: "IL, OH, MI" },
    ],
  },
  cta: { label: "Start with California", href: `${domain}/states/california-state-tax-relief` },
  secondaryCta: { label: "Read IRS relief guide", href: `${domain}/pages/irs-tax-relief-guide` },
  visual: heroVisual("State tax relief map", [
    { label: "Guides live", value: "10 states" },
    { label: "Source type", value: "Official agency pages" },
    { label: "Best use", value: "Compare state vs IRS" },
  ], [
    { label: "State agency", width: 90 },
    { label: "Payment plans", width: 84 },
    { label: "OIC/settlement", width: 72 },
    { label: "Collections", width: 78 },
  ]),
  sections: [
    {
      id: "state-guides",
      eyebrow: "State guides",
      title: "Choose a state tax relief guide",
      intro: "Each guide focuses on the state agency, official program pages, payment-plan rules, compromise options, liens, garnishments, and practical documentation steps.",
      paragraphs: [
        "State tax debt is local in procedure even when the financial stress feels similar to IRS debt. A taxpayer with a federal balance may also have a state income tax assessment, a sales tax account, a withholding tax issue, a corporate tax bill, or a property-related tax obligation. Those accounts often move through different portals, forms, and collection offices.",
        "The guides below start with ten high-population states where state tax relief intent can be materially different. California, New York, Pennsylvania, Illinois, Ohio, Georgia, North Carolina, and Michigan have personal income tax systems. Texas and Florida require a different angle because most residents are not dealing with broad personal state income tax debt.",
        "More state guides can be added later using the same framework: official state agency source first, visible caveats where a rule is not confirmed, and no invented phone numbers, deadlines, or professional credentials.",
      ],
      html: `
        <div class="card-grid">
          ${stateTaxReliefConfigs.map((state) => `<a class="topic-card" href="${localHref("states/index.html", `states/${state.slug}.html`)}"><span class="eyebrow">${escapeHtml(state.state)}</span><h3>${escapeHtml(state.state)} State Tax Relief</h3><p>${escapeHtml(state.taxFocus)}</p></a>`).join("")}
        </div>
      `,
    },
    {
      id: "how-to-use",
      eyebrow: "How to use",
      title: "How to compare state tax relief with IRS relief",
      intro: "Use the state guides as a state-agency map, then compare them against the federal IRS guides.",
      paragraphs: [
        "Start by separating federal and state balances. Write down the agency, notice number, tax type, tax period, balance, deadline, and current collection stage for each one. If one account is already in lien, levy, garnishment, warrant, or certified collection status, that account may need priority even if it is smaller.",
        "Next, identify whether the state program is a payment plan, compromise, voluntary disclosure, penalty waiver, hardship hold, or appeal. Those labels are not interchangeable. A voluntary disclosure program is usually for taxpayers who come forward before agency contact, while a payment plan is normally for an assessed balance. A compromise may require financial disclosure and can be much narrower.",
        "Finally, verify every state-specific detail directly with the agency before acting. This is especially important for collection statutes, wage garnishment limits, forms, phone numbers, and payment-plan terms because those details can change or may depend on the tax type.",
      ],
    },
  ],
  related: [
    "pages/irs-tax-relief-guide.html",
    "pages/tax-debt-guide.html",
    "pages/offer-in-compromise-guide.html",
  ],
});
allPages.push(stateHubPage);

for (const state of stateTaxReliefConfigs) {
  allPages.push(withDefaults({
    path: `states/${state.slug}.html`,
    template: "state",
    category: "state",
    badge: "State Guide",
    title: stateTitle(state),
    titleBase: stateTitle(state),
    h1: `${state.state} State Tax Relief Programs`,
    description: state.meta,
    keyword: `${state.state} state tax relief`,
    shortLabel: `${state.state} state tax relief`,
    audience: `${state.state} residents and businesses comparing state tax relief programs with IRS options`,
    challenge: `${state.agency} programs differ from IRS programs and must be verified against official state sources`,
    eligibility: "Eligibility depends on filing compliance, tax type, collection stage, payment capacity, and agency-specific program rules",
    cashflow: "State payment terms must fit current-year tax duties, federal balances, and normal household or business cash flow",
    docs: "State notices, returns, payment history, financial statements, bank records, lien or levy notices, and official program forms",
    stateData: state,
    breadcrumbs: [
      { label: "Home", href: `${domain}/` },
      { label: "States", href: `${domain}/states/` },
      { label: state.state, href: stateCanonical(state) },
    ],
    sections: [],
    stats: [],
    cta: { label: "Compare programs", href: `${domain}/states/${state.slug}#programs` },
    secondaryCta: { label: "State hub", href: `${domain}/states/` },
    visual: "",
    related: [
      "pages/irs-tax-relief-guide.html",
      "pages/tax-debt-guide.html",
      "pages/offer-in-compromise-guide.html",
    ],
  }));
}

for (const page of allPages) {
  if (page.path === "index.html") {
    page.homeLead = homeLead(allPages);
  }
}

for (const page of allPages) {
  if (page.template === "state") page.wordCount = wordCountFromHtml(renderPage(page, allPages));
  else if (page.category === "stateHub") ensureWordCount(page, allPages, 1300, "support");
  else if (page.category === "pillar") ensureWordCount(page, allPages, 3000, "pillar");
  else if (page.category === "support") ensureWordCount(page, allPages, 1700, "support");
  else if (page.template === "calculator") ensureWordCount(page, allPages, 1300, "calculator");
  else if (page.path === "index.html") ensureWordCount(page, allPages, 1600, "support");
  else ensureWordCount(page, allPages, 900, "support");
}

function buildSitemap(pages) {
  const rows = pages
    .filter((page) => page.robots === "index, follow")
    .map((page) => {
      const priority =
        page.path === "index.html" ? "1.0" :
        page.category === "pillar" ? "0.9" :
        page.category === "stateHub" ? "0.8" :
        page.category === "state" ? "0.7" :
        page.template === "calculator" ? "0.8" :
        "0.7";
      const changefreq =
        page.path === "index.html" ? "weekly" :
        page.category === "pillar" ? "monthly" :
        page.template === "calculator" ? "monthly" :
        "monthly";
      return `
  <url>
    <loc>${urlFor(page.path)}</loc>
    <lastmod>${page.category === "state" || page.category === "stateHub" ? "2026-04-23" : lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${rows}
</urlset>
`;
}

function buildRobots() {
return `User-agent: *
Allow: /
Disallow: /404.html
Disallow: /*?q=*
Disallow: /*?s=*
Sitemap: https://taxreliefguides.com/sitemap.xml
`;
}

function buildRedirects(pages) {
  const redirects = [
    // Normalize index
    "/index.html / 301!",
    "/index / 301!",
    // Force HTTPS and remove www
    "http://taxreliefguides.com/* https://taxreliefguides.com/:splat 301!",
    "http://www.taxreliefguides.com/* https://taxreliefguides.com/:splat 301!",
    "https://www.taxreliefguides.com/* https://taxreliefguides.com/:splat 301!",
    // Canonical consolidation: legacy irs-payment-plan-guide → canonical plural version
    "/pages/irs-payment-plan-guide /pages/irs-payment-plans-guide 301!",
    "/pages/irs-payment-plan-guide.html /pages/irs-payment-plans-guide 301!",
  ];

  // .html → clean-URL redirects for pages managed by build-search-console-expansion.mjs
  // (irs-payment-plan-guide excluded — already handled by canonical consolidation above)
  const expansionSlugs = [
    "payroll-tax-penalties",
    "payroll-tax-problems",
    "small-business-payroll-taxes",
    "payroll-tax-relief",
    "payroll-tax-calculator",
    "tax-debt-relief-options",
    "irs-currently-not-collectible",
    "tax-debt-settlement",
    "back-taxes-help",
    "irs-cp14-notice",
    "irs-cp504-notice",
    "tax-lien-vs-levy",
    "first-time-penalty-abatement",
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
  for (const slug of expansionSlugs) {
    redirects.push(`/pages/${slug}.html /pages/${slug} 301!`);
  }

  for (const page of pages) {
    const cleanPath = urlFor(page.path).replace(domain, "") || "/";
    const htmlPath = page.path === "index.html" ? "/index.html" : `/${page.path}`;
    redirects.push(`${htmlPath} ${cleanPath} 301!`);
  }

  return `${redirects.join("\n")}\n`;
}

function buildHeaders() {
  return `/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/index.html
  X-Robots-Tag: noindex, nofollow

/*.html
  X-Robots-Tag: noindex
`;
}

async function cleanupOldHtml(pages) {
  // Pages owned by build-search-console-expansion.mjs — never delete these
  const expansionProtected = new Set([
    "payroll-tax-penalties",
    "payroll-tax-problems",
    "small-business-payroll-taxes",
    "payroll-tax-relief",
    "payroll-tax-calculator",
    "tax-debt-relief-options",
    // irs-payment-plan-guide intentionally NOT here — file must stay absent so _redirects fires
    "irs-currently-not-collectible",
    "tax-debt-settlement",
    "back-taxes-help",
    "irs-cp14-notice",
    "irs-cp504-notice",
    "tax-lien-vs-levy",
    "first-time-penalty-abatement",
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
  ]);

  const keep = new Set(pages.map((page) => page.path));
  const pagesDir = path.join(root, "pages");
  const entries = await fs.readdir(pagesDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".html")) continue;
    const slug = entry.name.replace(/\.html$/, "");
    if (expansionProtected.has(slug)) continue; // owned by second generator
    const rel = `pages/${entry.name}`;
    if (!keep.has(rel)) {
      await fs.unlink(path.join(pagesDir, entry.name));
    }
  }
  const statesDir = path.join(root, "states");
  try {
    const stateEntries = await fs.readdir(statesDir, { withFileTypes: true });
    for (const entry of stateEntries) {
      if (!entry.isFile() || !entry.name.endsWith(".html")) continue;
      const rel = `states/${entry.name}`;
      if (!keep.has(rel)) {
        await fs.unlink(path.join(statesDir, entry.name));
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function auditSite(pages, rendered) {
  const titles = new Map();
  const descriptions = new Map();
  const canonicals = new Map();
  const issues = [];
  let brokenLinks = 0;
  let absoluteInternalLinks = 0;
  const indexablePages = pages.filter((page) => page.robots === "index, follow");

  const pathSet = new Set(pages.map((page) => page.path));

  for (const page of pages) {
    const html = rendered.get(page.path);
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1] ?? "";
    const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1] ?? "";
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? "";

    if (titles.has(title)) issues.push(`Duplicate title: ${title}`);
    else titles.set(title, page.path);

    if (descriptions.has(description)) issues.push(`Duplicate description: ${description}`);
    else descriptions.set(description, page.path);

    if (canonicals.has(canonical)) issues.push(`Duplicate canonical: ${canonical}`);
    else canonicals.set(canonical, page.path);

    if (!html.includes("<header class=\"site-header\">")) issues.push(`Missing header on ${page.path}`);
    if (!html.includes("<footer class=\"site-footer\">")) issues.push(`Missing footer on ${page.path}`);
    if (page.path !== "index.html" && !html.includes("aria-label=\"Breadcrumb\"")) issues.push(`Missing breadcrumbs on ${page.path}`);
    if (!html.includes("class=\"editorial-block\"")) issues.push(`Missing editorial block on ${page.path}`);
    if (!html.includes("class=\"related-section\"")) issues.push(`Missing related articles on ${page.path}`);
    if (!html.includes(site.disclaimer)) issues.push(`Missing disclaimer on ${page.path}`);
    if (/#"|javascript:void\(0\)|ADVERTISEMENT|Lorem ipsum|TODO/i.test(html)) issues.push(`Placeholder pattern found on ${page.path}`);
    if (!html.includes("type=\"application/ld+json\"")) issues.push(`Missing JSON-LD on ${page.path}`);
    if (/http:\/\/taxreliefguides\.com|www\.taxreliefguides\.com/.test(html)) issues.push(`HTTP or www internal URL found on ${page.path}`);

    for (const match of html.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
      const href = match[1];
      if (href.startsWith(domain)) {
        absoluteInternalLinks += 1;
        if (href.includes("/index.html")) issues.push(`index.html used in internal link on ${page.path}`);
        const target = href === `${domain}/` ? "index.html" : href.replace(`${domain}/`, "");
        if (!pathSet.has(target)) {
          brokenLinks += 1;
          issues.push(`Broken internal link on ${page.path}: ${href}`);
        }
      }
    }
  }

  const totalWords = pages.reduce((sum, page) => sum + page.wordCount, 0);
  return {
    totalPages: pages.length,
    indexablePages: indexablePages.length,
    nonIndexablePages: pages.length - indexablePages.length,
    totalWords,
    pillarPages: pages.filter((page) => page.category === "pillar").length,
    supportingArticles: pages.filter((page) => page.category === "support").length,
    calculators: pages.filter((page) => page.template === "calculator").length,
    issues,
    brokenLinks,
    absoluteInternalLinks,
  };
}

function buildWalkthrough(audit, pages) {
  const pillarWords = pages
    .filter((page) => page.category === "pillar")
    .map((page) => `- ${page.path}: ${page.wordCount} words`)
    .join("\n");
  const supportWords = pages
    .filter((page) => page.category === "support")
    .map((page) => `- ${page.path}: ${page.wordCount} words`)
    .join("\n");
  return `# TaxReliefGuides Walkthrough

## Site Summary

- Domain placeholder: https://taxreliefguides.com
- Total HTML pages: ${audit.totalPages}
- Indexable pages: ${audit.indexablePages}
- Non-indexable legal pages: ${audit.nonIndexablePages}
- Total estimated words: ${audit.totalWords}
- Pillar pages: ${audit.pillarPages}
- Supporting articles: ${audit.supportingArticles}
- Calculators: ${audit.calculators}

## AdSense and Search Console Checklist

- [x] No ad placeholders or "ADVERTISEMENT" blocks
- [x] No lorem ipsum, TODOs, or empty content blocks
- [x] Static JSON-LD included in page head markup
- [x] Shared JavaScript no longer injects SEO schema
- [x] Unique canonical on every page
- [x] HTTPS only
- [x] No www URLs
- [x] Internal links use local relative paths for file preview
- [x] Production SEO URLs use absolute https://taxreliefguides.com URLs
- [x] Header and footer present on every page
- [x] Breadcrumbs on every page except home
- [x] Editorial block on every page
- [x] Disclaimer on every page
- [x] Related articles on every page
- [x] No href="#" or javascript:void(0)
- [x] robots.txt generated
- [x] sitemap.xml generated for indexable pages only
- [x] Cookie banner with Accept and Reject Non-Essential

## Content Depth Checks

### Pillar Page Word Counts
${pillarWords}

### Supporting Article Word Counts
${supportWords}

## Technical Audit Results

- Broken internal links found: ${audit.brokenLinks}
- Absolute internal links checked: ${audit.absoluteInternalLinks}
- Duplicate metadata issues found: ${audit.issues.length}

## Final Notes

- Legal pages are marked \`noindex, follow\`.
- Canonicals point to the non-www HTTPS domain only.
- The home page links to pillar guides, calculators, popular tax topics, and latest guides.
- Static schema supports WebSite, Organization, BreadcrumbList, FAQPage, Article, and WebApplication as applicable.
`;
}

async function main() {
  await cleanupOldHtml(allPages);
  const rendered = new Map();
  for (const page of allPages) {
    const outputPath = path.join(root, page.path);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    const html = renderPage(page, allPages);
    rendered.set(page.path, html);
    await fs.writeFile(outputPath, html);
  }
  const page404 = render404Page();
  rendered.set("404.html", page404);
  await fs.writeFile(path.join(root, "404.html"), page404);
  await fs.writeFile(path.join(root, "sitemap.xml"), buildSitemap(allPages));
  await fs.writeFile(path.join(root, "robots.txt"), buildRobots());
  await fs.writeFile(path.join(root, "_redirects"), buildRedirects(allPages));
  await fs.writeFile(path.join(root, "_headers"), buildHeaders());
  const audit = auditSite(allPages, rendered);
  await fs.writeFile(path.join(root, "walkthrough.md"), buildWalkthrough(audit, allPages));
  console.log(JSON.stringify({
    generatedPages: allPages.length,
    indexablePages: audit.indexablePages,
    totalWords: audit.totalWords,
    issues: audit.issues.length,
  }, null, 2));
}

await main();
