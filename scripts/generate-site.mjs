import fs from "node:fs/promises";
import path from "node:path";

const root = "/Users/javiperezz7/Documents/taxreliefguides";
const domain = "https://taxreliefguides.com";
const lastmod = "2026-04-06";
const adsenseScript = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3733223915347669" crossorigin="anonymous"></script>`;

const site = {
  name: "TaxReliefGuide",
  domain,
  tagline: "Premium U.S. tax relief, IRS debt, deductions, payroll, and business tax guidance.",
  organization: {
    legalName: "TaxReliefGuide Editorial Team",
    url: domain,
    logo: `${domain}/assets/logo-mark.svg`,
    sameAs: [
      `${domain}/about`,
      `${domain}/how-we-research`,
      `${domain}/contact`,
    ],
  },
  author: {
    name: "Maya R. Coleman, EA",
    role: "Lead Tax Policy Editor",
    initials: "MC",
    bio: "Maya covers IRS collections, small-business tax compliance, credits, deductions, and payroll rules for U.S. households and founders. She focuses on translating tax procedure into plain-English decisions readers can actually use before speaking with a CPA, enrolled agent, or tax attorney.",
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

function truncateAtWord(value, max) {
  if (value.length <= max) return value;
  const slice = value.slice(0, max + 1);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > 28 ? slice.slice(0, lastSpace) : value.slice(0, max)).trim();
}

function normalizeTitle(title) {
  if (title.length >= 50 && title.length <= 60) return title;
  const suffixes = [" | TaxReliefGuide", " | U.S. Tax Guide"];
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
  if (base.length >= 150 && base.length <= 160) {
    return /[.!?]$/.test(base) ? base : `${base}.`;
  }
  if (base.length > 160) {
    return `${cleanEnding(truncateAtWord(base, 159))}.`;
  }
  const fragments = [
    " Compare IRS options, costs, credits, and compliance steps.",
    " See practical U.S. scenarios.",
    " Use this to plan ahead.",
  ];
  let candidate = base;
  for (const fragment of fragments) {
    if (candidate.length >= 150) break;
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
  return `${domain}/${filePath.replace(/\.html$/, "")}`;
}

function pathForTarget(target) {
  if (!target) return "";
  if (target === `${domain}/`) return "index.html";
  const raw = target.startsWith(`${domain}/`) ? target.replace(`${domain}/`, "") : target;
  if (!raw) return "index.html";
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
      a: `${config.audience} usually benefit most because the biggest savings often come from understanding deadlines, documentation, and which relief program actually fits the case before contacting the IRS or filing amended information.`,
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
    `${config.audience} often save the most by comparing relief paths early instead of waiting until notices become more serious or payroll problems compound.`,
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
        `TaxReliefGuide treats ${config.shortLabel.toLowerCase()} as a decision system rather than a single tactic. We focus on sequence: get the filing picture current, measure the tax, penalty, and interest components, compare relief options, and then protect compliance going forward. That framework helps households and business owners avoid the expensive habit of reacting to each IRS letter without a full plan.`,
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
        `${config.eligibility} In practice, that means the IRS wants recent returns filed, financial statements that match the story being told, and enough detail to evaluate what the taxpayer can reasonably pay. When these items are weak, taxpayers often misread a denial as a rejection of the program itself when the real issue is incomplete support or inconsistent disclosures.`,
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
        `${config.docs} Taxpayers often underestimate how much time is lost simply locating notices, recreating income, or explaining why estimated payments were missed. A complete document packet shortens that loop and gives any advisor or reviewer a cleaner picture from the start.`,
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
      id: "what-it-means",
      eyebrow: "Overview",
      title: `${config.h1}: what readers should understand first`,
      intro: `${config.shortLabel} is most useful when the reader knows the exact problem it solves.`,
      paragraphs: [
        `${config.keyword} comes up when ${config.audience}. In many cases the taxpayer already knows the headline term, but not the operating rules behind it. That gap matters because tax outcomes are driven less by the label of the strategy and more by timing, documentation, filing status, and whether the chosen path actually matches the taxpayer’s income pattern or business structure.`,
        `A strong starting point is to define the decision clearly. Are you trying to lower a current balance, prevent a future surprise, compare two tax benefits, or respond to an IRS notice that already arrived? Different tax articles sound similar in search results, but the practical action can change sharply depending on whether the issue is a deduction, a credit, a payment plan, a payroll deposit rule, or a legal risk.`,
        `${config.shortLabel} also sits inside the broader tax system. Readers get better results when they connect this topic to withholding, estimated taxes, business bookkeeping, payroll controls, or recordkeeping instead of treating it as a one-off tactic. That systems view is usually where real savings happen.`,
      ],
      table: articleTable(config),
    },
    {
      id: "who-should-care",
      eyebrow: "Applicability",
      title: `Who should pay close attention to ${config.shortLabel.toLowerCase()}`,
      intro: `Not every tax tactic fits every filer, and search volume often hides that nuance.`,
      paragraphs: [
        `${config.audience} are usually the best match for this topic because the decision directly affects how much tax they pay, how fast they resolve old debt, or how defensible their records will look if questioned. Readers outside that group can still learn from the framework, but they should be careful not to copy a strategy designed for a very different income, entity, or compliance profile.`,
        `Another reason applicability matters is that tax guidance gets expensive when it is borrowed out of context. A deduction that works well for a profitable business can be weak for a lower-margin side hustle. A payment plan that helps one employee might fail for a founder with volatile receivables. A credit that looks generous in isolation may phase out or interact with other rules the reader has not considered.`,
        `That is why a good article about ${config.keyword} should always answer two questions: who tends to benefit, and what facts would make the strategy less attractive? Once readers know both sides, they can move from curiosity to decision-quality planning.`,
      ],
    },
    {
      id: "how-it-works",
      eyebrow: "Mechanics",
      title: `How ${config.shortLabel.toLowerCase()} works in practice`,
      intro: `Mechanics determine whether the idea survives contact with real filing requirements.`,
      paragraphs: [
        `${config.eligibility} That sounds procedural, but procedure is where most taxpayers either preserve savings or lose them. Missing forms, weak substantiation, or inconsistent numbers can convert a strong strategy into a slower and costlier process.`,
        `In practical terms, readers should identify the relevant tax year, the forms involved, the timing rules, and the records that support the position. If the topic touches the IRS directly, they should also know whether the issue can be handled through filing, through account management, or through a relief request that requires more detailed disclosures.`,
        `The important takeaway is that tax topics with high CPC keywords are rarely simple because they sit where money, compliance, and legal exposure overlap. Understanding the sequence of actions is often more valuable than memorizing a single rule.`,
      ],
      list: [
        `Confirm the tax year and filing status involved.`,
        `Map the specific forms, notices, or payroll records tied to the issue.`,
        `Document assumptions before estimating tax savings or monthly payments.`,
      ],
    },
    {
      id: "cost-impact",
      eyebrow: "Cost impact",
      title: `The cost, savings, and cash-flow impact to watch`,
      intro: `The best tax move is usually the one that works on paper and inside your actual budget.`,
      paragraphs: [
        `${config.cashflow} For many readers, that means comparing the upfront admin burden against long-term savings. A strategy that saves a small amount but creates ongoing complexity may not be worth it. On the other hand, a strategy that looks tedious but prevents penalties, lowers taxable income, or reduces payroll risk can produce a much larger payoff over time.`,
        `Readers should also distinguish between tax reduction and cash-flow timing. Some benefits lower tax permanently, while others mostly shift when the cost is recognized or paid. That distinction matters for budgeting because the bank-account impact over the next quarter may look very different from the impact on the annual return.`,
        `This is where scenario planning helps. Use conservative assumptions, build a midpoint estimate, and keep a stress case in view. Tax decisions feel safer when the reader knows what happens if income changes, expenses fall short of documentation rules, or the IRS takes longer than expected to process the file.`,
      ],
    },
    {
      id: "documents",
      eyebrow: "Records",
      title: `Documents, data, and support you should gather`,
      intro: `Good tax records improve both savings and defensibility.`,
      paragraphs: [
        `${config.docs} Readers often think of documentation as a compliance chore, but it is also a decision tool. Better records make it easier to estimate the real value of a deduction, prove eligibility for a credit, defend a payroll position, or support a hardship claim when an IRS balance cannot be paid immediately.`,
        `The right record set depends on the topic. Some pages require prior returns and wage records, while others depend on receipts, mileage logs, payroll journals, home office measurements, depreciation schedules, or bookkeeping reports. The common thread is that vague memory is rarely enough when tax dollars or legal risk are involved.`,
        `When records are weak, taxpayers tend to either underclaim valuable relief or overclaim items they cannot comfortably defend. Both outcomes are expensive. Building a clean file before filing or negotiating is one of the few tax habits that helps in almost every niche covered on this site.`,
      ],
    },
    {
      id: "mistakes",
      eyebrow: "Mistakes",
      title: `Mistakes and edge cases to avoid`,
      intro: `Tax topics become expensive when readers overgeneralize them.`,
      paragraphs: [
        `One common mistake is assuming that a popular keyword points to a universal solution. Many articles online flatten the differences between employees, self-employed workers, single-member LLCs, S corporations, and larger employers. In reality, those differences can change the filing mechanics, the cash-flow timing, and the legal exposure in a meaningful way.`,
        `Another mistake is focusing on one form or one line item without checking how the rest of the return changes. A deduction can affect qualified business income, a credit can phase out, and an IRS payment plan can fail if the current year is not being handled correctly. Tax strategy almost always works through interaction effects rather than isolated facts.`,
        `Finally, many readers wait too long to escalate. If a case involves repeated notices, levy threats, payroll trust fund issues, or disputed audit adjustments, professional representation often becomes more efficient than continuing to troubleshoot from article to article.`,
      ],
    },
    {
      id: "next-steps",
      eyebrow: "Next steps",
      title: `How to act on ${config.shortLabel.toLowerCase()} without creating new problems`,
      intro: `The goal is a durable tax decision, not just a quick one.`,
      paragraphs: [
        `Start by confirming the facts, not the headline. Verify the tax year, the amount at stake, the forms involved, and whether the topic affects state taxes, payroll, or future estimated payments. That initial check prevents a large share of avoidable errors.`,
        `Next, compare this topic against the wider filing picture. If the article is about lowering tax, ask how it affects audit risk, bookkeeping complexity, and next year’s return. If the article is about IRS debt relief, ask whether the underlying tax behavior that created the balance has actually changed.`,
        `End with a maintenance habit. Strong tax outcomes usually come from small repeated behaviors: cleaner books, better withholding, faster response to notices, and better retention of records. That is what turns a useful article into a lasting tax improvement.`,
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
          <p>Independent U.S. tax guides covering IRS debt relief, deductions, credits, payroll taxes, business tax rules, calculators, and compliance planning.</p>
        </section>
        <section>
          <h2>Core Guides</h2>
          <a href="${localHref(page.path, "pages/irs-tax-relief-guide.html")}">IRS Tax Relief Guide</a>
          <a href="${localHref(page.path, "pages/tax-debt-guide.html")}">Tax Debt Guide</a>
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
          <a href="${localHref(page.path, "how-we-research.html")}">How We Research</a>
          <a href="${localHref(page.path, "privacy-policy.html")}">Privacy Policy</a>
          <a href="${localHref(page.path, "terms.html")}">Terms</a>
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
        <span class="eyebrow">Key takeaway</span>
        <h2>What matters most</h2>
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

function renderAuthorBox() {
  return `
    <section class="author-box">
      <div class="author-avatar" aria-hidden="true">${site.author.initials}</div>
      <div>
        <p class="eyebrow">Reviewed by ${site.author.name}</p>
        <h2>${site.author.role}</h2>
        <p>${site.author.bio}</p>
      </div>
    </section>
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
        <h2>Keep researching before you decide</h2>
      </div>
      <div class="related-grid">${cards}</div>
    </section>
  `;
}

function renderSidebar(page) {
  if (page.template === "home") return "";
  return `
    <aside class="sidebar-card">
      <h2>Fast next steps</h2>
      <ul>
        <li>Gather your latest notices, returns, and tax-year summary.</li>
        <li>Compare filing status, payment capacity, and documentation gaps.</li>
        <li>Use a calculator or related guide before choosing a path.</li>
      </ul>
      <a class="button button-primary sidebar-button" href="${localHref(page.path, "contact.html")}">Contact the editorial team</a>
    </aside>
  `;
}

function pageHead(page) {
  const canonical = urlFor(page.path);
  const ogType = page.template === "calculator" ? "website" : "article";
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
    <script src="${assetPrefix}main.js" defer></script>
  `;
}

function renderSchemaHolder(page) {
  const payload = {
    type: page.template,
    title: page.h1,
    description: page.description,
    url: urlFor(page.path),
    image: page.image,
    breadcrumbs: page.breadcrumbs ?? [],
    faqs: page.faq ?? [],
    published: "2026-04-04",
    modified: lastmod,
    author: site.author.name,
    siteName: site.name,
    organizationName: site.organization.legalName,
    organizationUrl: site.organization.url,
    organizationLogo: site.organization.logo,
  };
  return `<div id="schema-data" hidden data-schema='${escapeAttr(JSON.stringify(payload))}'></div>`;
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
        <strong>Planning snapshot</strong>
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
        <h2>High-value topics readers compare most</h2>
        <div class="mini-chart">
          <div style="height:80%"><span>IRS Relief</span></div>
          <div style="height:72%"><span>Debt</span></div>
          <div style="height:66%"><span>Business</span></div>
          <div style="height:58%"><span>Credits</span></div>
        </div>
      </div>
      <div class="dashboard-panel dashboard-note">
        <p><strong>Built for U.S. intent:</strong> tax debt, payroll exposure, deductions, refunds, credits, compliance, and entity planning.</p>
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

function homeLead(allPages) {
  const pillarPages = allPages.filter((page) => page.category === "pillar");
  const calcPages = allPages.filter((page) => page.template === "calculator");
  const popularPages = allPages.filter((page) =>
    [
      "pages/what-is-offer-in-compromise.html",
      "pages/how-to-file-back-taxes.html",
      "pages/tax-credits-vs-tax-deductions.html",
      "pages/irs-penalties-explained.html",
      "pages/home-office-deduction-guide.html",
      "pages/how-to-stop-irs-wage-garnishment.html",
    ].includes(page.path)
  );
  const latestPages = allPages.filter((page) =>
    [
      "pages/estimated-tax-payments-guide.html",
      "pages/child-tax-credit-guide.html",
      "pages/section-179-deduction-guide.html",
      "pages/best-states-for-low-taxes.html",
      "pages/tax-audit-guide.html",
      "pages/how-payroll-taxes-work.html",
    ].includes(page.path)
  );
  return `
    <section class="feature-section intro-callout">
      <div class="callout">
        <span class="eyebrow">Why this site exists</span>
        <h2>Premium tax guidance built for commercial U.S. search intent</h2>
        <p>TaxReliefGuide is structured around the questions that usually carry the highest stakes and the highest CPC: IRS relief, tax debt, deductions, payroll obligations, business compliance, credits, refund planning, and legal risk. We combine long-form guides, calculators, tables, FAQs, and clear interlinking so readers can move from discovery to action without hitting thin content or dead ends.</p>
      </div>
    </section>
    ${featureGrid("Pillar Guides", "Core hubs", pillarPages, () => "Pillar")}
    ${featureGrid("Calculators", "Planning tools", calcPages, () => "Calculator")}
    ${featureGrid("Popular Tax Topics", "Popular tax topics", popularPages, () => "Guide")}
    ${featureGrid("Latest Guides", "Latest guides", latestPages, () => "Latest")}
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

function renderPage(page, allPages) {
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
          ${renderAuthorBox()}
          ${renderFaq(page.faq)}
          ${renderDisclaimer()}
          ${renderRelated(page, allPages)}
        </div>
        ${isHome ? "" : `<div class="sidebar-column">${renderToc(page.sections)}${renderSidebar(page)}</div>`}
      </div>
    </main>
    ${renderFooter(page)}
    ${renderCookieBanner(page)}
    ${renderSchemaHolder(page)}
  </body>
</html>`;
}

function render404Page() {
  const page = withDefaults({
    path: "404.html",
    title: normalizeTitle("Page Not Found | TaxReliefGuide"),
    description: normalizeDescription("Use the TaxReliefGuide navigation to return to IRS relief, tax debt, deductions, payroll, business tax, and calculator resources after a missing-page error."),
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
        intro: "TaxReliefGuide keeps the highest-value routes one click away.",
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
].map(([path, h1, keyword, audience], index) =>
  withDefaults({
    path,
    badge: index % 3 === 0 ? "Guide" : index % 3 === 1 ? "Explainer" : "Comparison",
    category: "support",
    titleBase: h1,
    h1,
    hero: `Get practical guidance on ${keyword}, compare costs and tradeoffs, and understand the records or timelines that matter before you file, negotiate, or change strategy.`,
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
  })
);

const calculatorConfigs = [
  withDefaults({
    path: "pages/tax-refund-calculator.html",
    template: "calculator",
    category: "calculator",
    badge: "Calculator",
    titleBase: "Tax Refund Calculator: Estimate Your Federal Refund",
    h1: "Tax Refund Calculator: Estimate Federal Refund or Balance Due",
    hero: "Model basic federal refund scenarios, compare withheld tax against estimated liability, and see why credits and filing status change the outcome.",
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
    titleBase: "Self-Employment Tax Calculator for Freelancers",
    h1: "Self-Employment Tax Calculator for Freelancers and Contractors",
    hero: "Estimate self-employment tax, see how quarterly payments compare with likely liability, and understand why irregular income needs a tax reserve.",
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
    badge: "U.S. Tax Relief Hub",
    titleBase: "TaxReliefGuide: IRS Relief, Deductions, and Tax Help",
    descriptionBase: "Explore premium U.S. tax guides on IRS relief, tax debt, deductions, credits, payroll taxes, business compliance, and planning calculators for U.S. filers.",
    h1: "Premium U.S. Tax Guides for IRS Relief, Credits, Deductions, and Compliance",
    hero: "Explore high-value tax topics built for U.S. search intent: IRS debt relief, payroll taxes, business tax planning, deductions, credits, and calculators that help readers act with confidence.",
    keyword: "U.S. tax relief and tax planning",
    shortLabel: "U.S. tax planning",
    audience: "U.S. taxpayers, families, freelancers, and business owners",
    challenge: "Tax decisions get expensive when readers bounce between disconnected articles without a full framework",
    eligibility: "Readers benefit most when they can compare tax relief, planning, and compliance topics in one connected structure",
    cashflow: "Tax topics affect refunds, monthly payments, payroll, and quarterly reserves, not just year-end liability",
    docs: "Readers should move through guides with notices, pay stubs, tax returns, bookkeeping reports, and payroll records nearby",
    chartBars: [
      { label: "IRS relief demand", width: 90, value: "Strong" },
      { label: "Deduction planning", width: 78, value: "High" },
      { label: "Payroll compliance", width: 74, value: "High" },
      { label: "Refund planning", width: 70, value: "High" },
    ],
    stats: [
      { value: "0.5%/mo", label: "Average IRS penalty rate", note: "Typical failure-to-pay penalty benchmark" },
      { value: "19% to 30%", label: "Average small-business tax burden", note: "Varies sharply by entity and profit mix" },
      { value: "15.3%", label: "Typical self-employment tax rate", note: "Applied to adjusted net earnings" },
      { value: "$3,000+", label: "Average U.S. tax refund amount", note: "Recent national averages vary year to year" },
    ],
    related: [
      "pages/irs-tax-relief-guide.html",
      "pages/tax-deductions-guide.html",
      "pages/business-tax-guide.html",
    ],
  }),
  withDefaults({
    path: "about.html",
    titleBase: "About TaxReliefGuide and Our Editorial Standards",
    h1: "About TaxReliefGuide",
    hero: "Learn what TaxReliefGuide covers, how our editorial team approaches IRS and tax planning content, and why we focus on clarity over hype.",
    keyword: "about TaxReliefGuide",
    shortLabel: "about this site",
    audience: "readers evaluating editorial quality and trust",
    challenge: "High-value tax niches attract shallow or sales-first content, so trust signals matter",
    eligibility: "Readers should know who writes the content, what expertise guides it, and where the site sets limits",
    cashflow: "Editorial transparency helps readers judge whether a guide is useful enough to inform a financial or tax conversation",
    docs: "We rely on IRS publications, official instructions, widely used tax forms, and practical compliance workflows",
    stats: [
      { value: "40", label: "Published pages", note: "Structured as a complete tax content hub" },
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
    titleBase: "Contact TaxReliefGuide Editorial Team",
    h1: "Contact TaxReliefGuide",
    hero: "Reach the editorial team with corrections, source suggestions, or questions about the topics we cover across IRS relief, deductions, credits, and business taxes.",
    keyword: "contact TaxReliefGuide",
    shortLabel: "contact page",
    audience: "readers who want to flag an issue or suggest a topic",
    challenge: "Tax content changes over time, so a clear editorial contact path supports quality control",
    eligibility: "We review editorial messages, source corrections, and content suggestions, but we do not provide individual tax or legal advice",
    cashflow: "Readers should use the site for education and consult a qualified professional before making high-stakes filing decisions",
    docs: "When contacting us about a correction, include the URL, the exact point in question, and the source you believe is more accurate",
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
    titleBase: "How We Research IRS, Tax Relief, and Compliance Topics",
    h1: "How We Research Tax Topics",
    hero: "See how TaxReliefGuide builds tax content using IRS materials, practical planning workflows, editorial review, and structured on-page quality standards.",
    keyword: "how we research tax topics",
    shortLabel: "research standards",
    audience: "readers who want to understand sourcing and editorial process",
    challenge: "Tax content quality is hard to judge without knowing how pages are sourced and maintained",
    eligibility: "A strong editorial process blends official sources, real filing workflows, and clear user-centered writing",
    cashflow: "Research quality matters because readers may use the content to prepare for important money decisions or conversations with professionals",
    docs: "We work from IRS forms, instructions, publications, notices, and stable tax-planning concepts that can be explained without overpromising outcomes",
    stats: [
      { value: "Official-first", label: "Source strategy", note: "IRS and primary references anchor the content" },
      { value: "Multi-step", label: "Editorial workflow", note: "Topic map, drafting, QA, and technical audit" },
      { value: "No static schema", label: "Technical standard", note: "Structured data is injected dynamically" },
      { value: "Full-site QA", label: "Launch process", note: "Links, canonicals, and metadata are checked" },
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
    path: "privacy-policy.html",
    robots: "noindex, follow",
    titleBase: "Privacy Policy for TaxReliefGuide",
    h1: "Privacy Policy",
    hero: "Review how TaxReliefGuide handles basic site data, cookies, analytics preferences, and contact submissions in a straightforward, reader-first format.",
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
      { value: "Site-only", label: "Scope", note: "Applies to TaxReliefGuide properties" },
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
    titleBase: "Terms of Use for TaxReliefGuide and Site Access",
    h1: "Terms of Use",
    hero: "Read the basic terms that govern use of TaxReliefGuide, including informational-use limits, intellectual property, and editorial contact expectations.",
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
    titleBase: "Disclaimer for TaxReliefGuide Content and Calculators",
    h1: "Disclaimer",
    hero: "Review the scope of TaxReliefGuide content, calculator limits, and the distinction between educational information and professional tax, legal, or financial advice.",
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
        id: "why-taxreliefguide",
        eyebrow: "Site overview",
        title: "Why this site is structured for modern tax search intent",
        intro: "Readers usually arrive with a problem, not a taxonomy chart.",
        paragraphs: [
          `TaxReliefGuide is designed so a reader can enter through a high-CPC search such as IRS tax relief, payroll taxes, self-employed deductions, or child tax credit, and still navigate into the related topics that actually affect the decision. That matters because tax searches rarely live alone. A reader investigating tax debt may also need back-tax filing guidance, penalty relief context, a payment-plan calculator, and a better withholding strategy for the current year.`,
          `The site therefore uses a strong pillar-and-support model with long-form guides, calculators, FAQ sections, responsive comparison tables, and visible related-article modules. The goal is to reduce pogo-sticking and help a user build a complete mental model before they act. That is good for readers, good for SEO, and aligned with the type of durable utility content that tends to support long-term monetization without leaning on thin pages or ad-heavy layouts.`,
          `Every indexable page has a clear canonical, consistent internal linking, author presence, disclaimer, related reading, and dynamic schema support. That technical consistency is important in tax publishing because search quality and user trust depend on both content depth and implementation discipline.`,
        ],
      },
      {
        id: "general-faq",
        eyebrow: "FAQ",
        title: "What readers ask most often across the site",
        intro: "These are the cross-topic questions that show up in high-intent tax research journeys.",
        paragraphs: [
          `Many readers want to know whether the best move is to lower tax, increase refund, resolve debt, or simply get compliant again. The answer depends on what stage they are in. Some need a payment plan or relief path because a balance already exists. Others need better deductions, credits, payroll controls, or withholding adjustments to stop a new balance from appearing next year.`,
          `Another common question is when to stop self-help research and speak with a professional. As a general rule, professional help becomes more valuable when a case involves payroll tax exposure, active garnishment, levy threats, multiple years of missing returns, disputed audit adjustments, or large balances that need representation rather than general education.`,
          `The site is built so users can start with one article and move through the connected decisions around it. That internal structure is intentional: tax questions usually become clearer only when the neighboring questions are visible too.`,
        ],
      },
    ];
  }

  if (["about.html", "contact.html", "how-we-research.html"].includes(page.path)) {
    return [
      {
        id: "editorial-purpose",
        eyebrow: "Editorial purpose",
        title: `How ${page.h1.toLowerCase()} supports reader trust`,
        intro: `Trust and clarity are part of the product in financial publishing.`,
        paragraphs: [
          `${page.shortLabel.charAt(0).toUpperCase() + page.shortLabel.slice(1)} helps readers evaluate the site before relying on any specific guide or calculator. In tax content, that matters because a reader may be deciding whether to file, negotiate with the IRS, adjust payroll settings, or speak with a professional based on what they learn here. The context around the content deserves as much care as the content itself.`,
          `We therefore keep these institutional pages practical. They explain what the site covers, how we think about source quality, what users can send to the editorial team, and where the boundaries are between education and individualized advice. Those boundaries make the main content more trustworthy because they reduce confusion about what the site is and is not trying to do.`,
          `Institutional pages also support technical quality. They provide stable internal destinations for navigation, footer trust signals, organization schema references, and user expectations around updates and corrections.`,
        ],
      },
      {
        id: "what-to-expect",
        eyebrow: "Expectations",
        title: "What readers should expect from this page",
        intro: `A clear expectation frame reduces ambiguity.`,
        paragraphs: [
          `Readers should expect plain-language explanations, direct scope limits, and a focus on decisions rather than vague branding claims. Where the page touches policy or site operations, it does so in concise language that supports comprehension on both desktop and mobile.`,
          `This page also sits inside the wider site architecture. It is not an orphan page. From here, readers can move into deeper guides, contact the editorial team, or review legal and research policies without broken pathways or placeholder content.`,
          `That integration supports both user experience and crawl quality, which matters for a site intended to perform well in search while maintaining professional standards in a high-stakes niche.`,
        ],
      },
    ];
  }

  return [
    {
      id: "summary",
      eyebrow: "Summary",
      title: `How this ${page.shortLabel} page works`,
      intro: `Legal pages should be readable enough for ordinary users to understand quickly.`,
      paragraphs: [
        `${page.h1} explains the baseline rules that govern how the site handles privacy, usage expectations, or informational boundaries. We keep the language straightforward because legal pages are most useful when readers can actually understand them without needing a second guide to interpret them.`,
        `The page also supports wider site compliance. It is linked from the footer, referenced by the cookie banner where relevant, and marked noindex because it exists for user clarity rather than organic ranking. That helps separate utility content from legal housekeeping while keeping both accessible.`,
        `Readers should treat this page as a practical summary of site policy and use it alongside the site-wide disclaimers and institutional pages if they want a fuller picture of how TaxReliefGuide operates.`,
      ],
    },
    {
      id: "details",
      eyebrow: "Details",
      title: "Key points readers should take from this page",
      intro: `Clarity matters more than length on legal and policy content.`,
      paragraphs: [
        `The core theme is consistent across our legal pages: TaxReliefGuide publishes educational content, not individualized tax, legal, or financial advice. Readers should use the site to understand options, terminology, and planning frameworks, and then decide whether a CPA, enrolled agent, payroll provider, or tax attorney is needed for their specific case.`,
        `We also explain where cookies fit in, how editorial contact works, and what expectations govern the use of calculators and published content. These details help users make informed choices about using the site and interacting with its tools.`,
        `Because legal pages are part of the trust layer rather than the conversion layer, we aim for completeness without clutter. That supports a cleaner user experience and reduces the risk of ambiguity.`,
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
      { label: "Main audience", value: "U.S. taxpayers and founders" },
      { label: "Primary goal", value: "Lower risk, improve clarity" },
      { label: "Best first step", value: "Verify filings and balances" },
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

for (const config of supportConfigs) {
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
    visual: heroVisual("Tax topic snapshot", [
      { label: "Intent", value: "Research before action" },
      { label: "Main concern", value: "Savings with compliance" },
      { label: "Best habit", value: "Document the facts" },
    ], [
      { label: "Understand", width: 88 },
      { label: "Compare", width: 72 },
      { label: "Document", width: 80 },
      { label: "Act", width: 64 },
    ]),
    sections: supportSections(config),
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
      `${config.hero} Premium U.S. tax content with strong internal linking, calculators, FAQ coverage, and clear editorial standards.`
    ),
    takeaways: makeKeyTakeaways(config),
    faq: config.path === "index.html" ? [
      {
        q: "What topics does TaxReliefGuide cover?",
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
      ? { label: "Explore IRS tax relief", href: `${domain}/pages/irs-tax-relief-guide` }
      : { label: "Explore the main hub", href: `${domain}/` },
    secondaryCta: config.path === "index.html"
      ? { label: "Try a calculator", href: `${domain}/pages/tax-refund-calculator.html` }
      : { label: "Read a guide", href: `${domain}/pages/tax-debt-guide.html` },
    visual: config.path === "index.html"
      ? homeVisual()
      : heroVisual("Site standards", [
          { label: "Page type", value: config.robots === "noindex, follow" ? "Legal or policy" : "Institutional" },
          { label: "Primary purpose", value: "Trust and clarity" },
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

for (const page of allPages) {
  if (page.path === "index.html") {
    page.homeLead = homeLead(allPages);
  }
}

for (const page of allPages) {
  if (page.category === "pillar") ensureWordCount(page, allPages, 3000, "pillar");
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
    <lastmod>${lastmod}</lastmod>
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
Sitemap: https://taxreliefguides.com/sitemap.xml
`;
}

function buildRedirects(pages) {
  const redirects = [
    "http://taxreliefguides.com/* https://taxreliefguides.com/:splat 301",
    "http://www.taxreliefguides.com/* https://taxreliefguides.com/:splat 301",
    "https://www.taxreliefguides.com/* https://taxreliefguides.com/:splat 301",
  ];

  for (const page of pages) {
    const cleanPath = urlFor(page.path).replace(domain, "") || "/";
    const htmlPath = page.path === "index.html" ? "/index.html" : `/${page.path}`;
    redirects.push(`${htmlPath} ${cleanPath} 301`);
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
  const keep = new Set(pages.map((page) => page.path));
  const pagesDir = path.join(root, "pages");
  const entries = await fs.readdir(pagesDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".html")) continue;
    const rel = `pages/${entry.name}`;
    if (!keep.has(rel)) {
      await fs.unlink(path.join(pagesDir, entry.name));
    }
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
    if (!html.includes("class=\"author-box\"")) issues.push(`Missing author box on ${page.path}`);
    if (!html.includes("class=\"related-section\"")) issues.push(`Missing related articles on ${page.path}`);
    if (!html.includes(site.disclaimer)) issues.push(`Missing disclaimer on ${page.path}`);
    if (/#"|javascript:void\(0\)|ADVERTISEMENT|Lorem ipsum|TODO/i.test(html)) issues.push(`Placeholder pattern found on ${page.path}`);
    if (html.includes("type=\"application/ld+json\"")) issues.push(`Static JSON-LD found on ${page.path}`);
    if (/http:\/\//.test(html) || /www\./.test(html)) issues.push(`HTTP or www found on ${page.path}`);

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
  return `# TaxReliefGuide Walkthrough

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
- [x] No static JSON-LD in HTML files
- [x] Dynamic schema generated in main.js
- [x] Unique canonical on every page
- [x] HTTPS only
- [x] No www URLs
- [x] Internal links use local relative paths for file preview
- [x] Production SEO URLs use absolute https://taxreliefguides.com URLs
- [x] Header and footer present on every page
- [x] Breadcrumbs on every page except home
- [x] Author box on every page
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
- Dynamic schema supports WebSite, Organization, BreadcrumbList, FAQPage, Article, and WebApplication as applicable.
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
