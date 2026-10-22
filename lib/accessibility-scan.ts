import { parse } from "parse5";
import type { FindingExample, ScanFinding } from "@/lib/scan-types";

type HtmlNode = {
  nodeName: string;
  tagName?: string;
  attrs?: { name: string; value: string }[];
  childNodes?: HtmlNode[];
  parentNode?: HtmlNode;
  value?: string;
};

type CheckCounts = Record<string, number>;

function attr(node: HtmlNode, name: string) {
  return node.attrs?.find((item) => item.name === name)?.value ?? null;
}

function nodes(root: HtmlNode): HtmlNode[] {
  const result: HtmlNode[] = [];
  const stack = [root];
  while (stack.length) {
    const node = stack.pop();
    if (!node) continue;
    if (node.tagName) result.push(node);
    if (node.childNodes) stack.push(...node.childNodes.slice().reverse());
  }
  return result;
}

function textContent(node: HtmlNode): string {
  const chunks: string[] = [];
  const stack = [node];
  while (stack.length) {
    const current = stack.pop();
    if (!current) continue;
    if (current.nodeName === "#text") chunks.push(current.value ?? "");
    if (current.childNodes) stack.push(...current.childNodes.slice().reverse());
  }
  return chunks.join(" ").replace(/\s+/g, " ").trim();
}

function hasNamedSvg(node: HtmlNode) {
  const stack = [...(node.childNodes ?? [])];
  while (stack.length) {
    const child = stack.pop();
    if (!child) continue;
    if (child.tagName === "svg" && (child.childNodes ?? []).some((item) => item.tagName === "title" && textContent(item))) return true;
    if (child.childNodes) stack.push(...child.childNodes);
  }
  return false;
}

function hasAccessibleName(node: HtmlNode, allNodes: HtmlNode[], ids: Map<string, string[]>) {
  if (attr(node, "aria-label")?.trim()) return true;
  const labelledBy = attr(node, "aria-labelledby")?.split(/\s+/).filter(Boolean) ?? [];
  if (labelledBy.some((id) => Boolean(ids.get(id)?.some((value) => value.trim())))) return true;
  if (attr(node, "title")?.trim()) return true;

  const tag = node.tagName;
  if (tag === "img" && attr(node, "alt")?.trim()) return true;
  if (tag === "input") {
    const type = (attr(node, "type") ?? "text").toLowerCase();
    if (["submit", "button", "reset"].includes(type)) return Boolean((attr(node, "value") ?? "").trim());
    if (type === "image") return Boolean(attr(node, "alt")?.trim());
  }
  if ((tag === "button" || tag === "a") && hasNamedSvg(node)) return true;
  if (["button", "a"].includes(tag ?? "") && textContent(node)) return true;
  if (tag === "a" && (node.childNodes ?? []).some((child) => child.tagName === "img" && Boolean(attr(child, "alt")?.trim()))) return true;

  const id = attr(node, "id");
  if (id && allNodes.some((candidate) => candidate.tagName === "label" && attr(candidate, "for") === id && textContent(candidate))) return true;
  if (tag && ["input", "select", "textarea"].includes(tag)) {
    let parent = node.parentNode;
    while (parent) {
      if (parent.tagName === "label" && textContent(parent)) return true;
      parent = parent.parentNode;
    }
  }
  return false;
}

function makeFinding(
  id: string,
  count: number,
  title: string,
  whyItMatters: string,
  fix: string,
  wcag: string,
  example: FindingExample,
  severity: ScanFinding["severity"] = "needs-attention",
): ScanFinding | null {
  return count ? { id, severity, title, whyItMatters, fix, wcag, count, example } : null;
}

const examples: Record<string, FindingExample> = {
  lang: { before: "<html>", after: '<html lang="en">', note: "Replace en with the language used for most of the page content." },
  title: { before: "<head>\n  <meta charset=\"utf-8\">\n</head>", after: "<head>\n  <meta charset=\"utf-8\">\n  <title>Contact us | Acme</title>\n</head>", note: "Use a useful, unique title that identifies both the page and site." },
  viewport: { before: '<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">', after: '<meta name="viewport" content="width=device-width, initial-scale=1">', note: "Do not prevent users from zooming the page." },
  image: { before: '<img src="/team-photo.jpg">', after: '<img src="/team-photo.jpg" alt="The Acme team outside their workshop">', note: "Describe useful information in context. Use alt=\"\" for decorative images." },
  control: { before: '<input type="email" placeholder="Email">', after: '<label for="email">Email address</label>\n<input id="email" name="email" type="email" autocomplete="email">', note: "Placeholder text alone is not a reliable label." },
  button: { before: '<button type="button"><svg><!-- icon --></svg></button>', after: '<button type="button" aria-label="Open menu"><svg aria-hidden="true"><!-- icon --></svg></button>', note: "Name the action. Prefer visible text when it fits." },
  link: { before: '<a href="/contact">Click here</a>', after: '<a href="/contact">Contact our team</a>', note: "The link should make sense when read on its own." },
  vagueLink: { before: '<a href="/services">Read more</a>', after: '<a href="/services">Explore our services</a>', note: "Include the destination or purpose in the link text." },
  duplicateId: { before: '<h2 id="details">Details</h2>\n<p id="details">More details</p>', after: '<h2 id="details-heading">Details</h2>\n<p id="details-copy">More details</p>', note: "Every id value must be unique on the page." },
  ariaReference: { before: '<input aria-describedby="email-help">', after: '<p id="email-help">We will only use this to reply.</p>\n<input aria-describedby="email-help">', note: "Every referenced ID must exist on this page." },
  heading: { before: '<h2>Services</h2>\n<h4>Repairs</h4>', after: '<h2>Services</h2>\n<h3>Repairs</h3>', note: "Use heading levels to express the content outline, not to style text." },
  main: { before: '<div class="content">…</div>', after: '<main class="content">…</main>', note: "Use one main landmark for the page’s primary content." },
  iframe: { before: '<iframe src="https://video.example/embed/123"></iframe>', after: '<iframe title="Product introduction video" src="https://video.example/embed/123"></iframe>', note: "Describe the embedded content, not just that it is an iframe." },
  table: { before: '<table><tr><td>April</td><td>$120</td></tr></table>', after: '<table><tr><th scope="col">Month</th><th scope="col">Amount</th></tr><tr><td>April</td><td>$120</td></tr></table>', note: "Use proper row or column headers for data tables. Confirm the table is not layout-only." },
  tabIndex: { before: '<a href="/help" tabindex="4">Help</a>', after: '<a href="/help">Help</a>', note: "Let controls follow their natural DOM order; use tabindex=\"0\" only when required for custom widgets." },
  hiddenControl: { before: '<button aria-hidden="true">Open menu</button>', after: '<button>Open menu</button>', note: "Do not hide a usable control from assistive technology. If it is inactive, remove it or disable it appropriately." },
  videoCaptions: { before: '<video controls src="/intro.mp4"></video>', after: '<video controls><source src="/intro.mp4" type="video/mp4"><track kind="captions" src="/intro.en.vtt" srclang="en" label="English"></video>', note: "Confirm captions are accurate and synchronized; a track’s presence alone does not prove caption quality." },
};

export function scanHtml(html: string) {
  const document = parse(html) as unknown as HtmlNode;
  const allNodes = nodes(document);
  const ids = new Map<string, string[]>();
  for (const node of allNodes) {
    const id = attr(node, "id");
    if (id) ids.set(id, [...(ids.get(id) ?? []), textContent(node)]);
  }

  const counts: CheckCounts = {
    lang: 0, title: 0, viewport: 0, imageAlt: 0, controlName: 0, buttonName: 0, linkName: 0,
    vagueLink: 0, duplicateId: 0, ariaReference: 0, headingOrder: 0, mainLandmark: 0,
    iframeTitle: 0, tableHeaders: 0, positiveTabIndex: 0, hiddenControl: 0, videoCaptions: 0,
  };
  const htmlNode = allNodes.find((node) => node.tagName === "html");
  if (!attr(htmlNode ?? document, "lang")?.trim()) counts.lang = 1;
  if (!allNodes.some((node) => node.tagName === "title" && textContent(node))) counts.title = 1;

  const viewport = allNodes.find((node) => node.tagName === "meta" && attr(node, "name")?.toLowerCase() === "viewport");
  const viewportContent = attr(viewport ?? document, "content")?.toLowerCase() ?? "";
  if (/(user-scalable\s*=\s*no|maximum-scale\s*=\s*(?:0?\.[0-9]+|1(?:\.0*)?)(?:[,;\s]|$))/.test(viewportContent)) counts.viewport = 1;

  for (const values of ids.values()) if (values.length > 1) counts.duplicateId += values.length - 1;
  for (const node of allNodes) {
    for (const attribute of ["aria-labelledby", "aria-describedby", "aria-controls", "aria-owns", "aria-activedescendant"]) {
      const references = attr(node, attribute)?.split(/\s+/).filter(Boolean) ?? [];
      if (references.some((id) => !ids.has(id))) counts.ariaReference += 1;
    }

    if (node.tagName === "img") {
      const role = attr(node, "role")?.toLowerCase();
      if (attr(node, "alt") === null && role !== "presentation" && role !== "none") counts.imageAlt += 1;
    }
    if (["input", "select", "textarea"].includes(node.tagName ?? "")) {
      const inputType = (attr(node, "type") ?? "text").toLowerCase();
      const hidden = node.tagName === "input" && ["hidden", "submit", "button", "reset"].includes(inputType);
      if (!hidden && !hasAccessibleName(node, allNodes, ids)) counts.controlName += 1;
    }
    if (node.tagName === "button" && !hasAccessibleName(node, allNodes, ids)) counts.buttonName += 1;
    if (node.tagName === "a" && attr(node, "href") !== null) {
      if (!hasAccessibleName(node, allNodes, ids)) counts.linkName += 1;
      else if (!attr(node, "aria-label") && !attr(node, "aria-labelledby")) {
        const label = textContent(node).toLowerCase().replace(/[.!?…]+$/g, "").trim();
        if (/^(click here|here|read more|learn more|more|more info|this link|continue|details)$/.test(label)) counts.vagueLink += 1;
      }
    }
    if (node.tagName === "iframe" && !hasAccessibleName(node, allNodes, ids)) counts.iframeTitle += 1;
    if (node.tagName === "table" && nodes(node).some((child) => child.tagName === "td") && !nodes(node).some((child) => child.tagName === "th")) counts.tableHeaders += 1;

    const tabIndex = Number(attr(node, "tabindex"));
    if (attr(node, "tabindex") !== null && Number.isFinite(tabIndex) && tabIndex > 0) counts.positiveTabIndex += 1;
    if (attr(node, "aria-hidden")?.toLowerCase() === "true" && (node.tagName === "button" || node.tagName === "a" || ["input", "select", "textarea"].includes(node.tagName ?? "") || attr(node, "tabindex") !== null)) counts.hiddenControl += 1;
    if (node.tagName === "video" && !nodes(node).some((child) => child.tagName === "track" && attr(child, "kind")?.toLowerCase() === "captions")) counts.videoCaptions += 1;
  }

  let previousHeading = 0;
  for (const node of allNodes) {
    const level = /^h[1-6]$/.test(node.tagName ?? "") ? Number(node.tagName?.slice(1)) : 0;
    if (level) {
      if (previousHeading && level > previousHeading + 1) counts.headingOrder += 1;
      previousHeading = level;
    }
  }

  const mainLandmarks = allNodes.filter((node) => node.tagName === "main" || attr(node, "role")?.split(/\s+/).includes("main"));
  if (mainLandmarks.length !== 1) counts.mainLandmark = 1;

  const findings = [
    makeFinding("document-language", counts.lang, "Set the page language", "Assistive technology uses the page language to pronounce words and interpret text correctly.", "Add the correct language to the opening html element, for example <html lang=\"en\">.", "3.1.1 · A", examples.lang),
    makeFinding("document-title", counts.title, "Add a page title", "A clear title helps people identify the page in browser tabs, search results, and assistive technology.", "Add a short, specific <title> inside the page head.", "2.4.2 · A", examples.title),
    makeFinding("viewport-zoom", counts.viewport, "Allow users to zoom", "Disabling zoom makes it harder for people with low vision to read and use the page.", "Remove user-scalable=no and avoid a maximum-scale value that prevents zooming.", "1.4.4 · AA", examples.viewport),
    makeFinding("image-alternative", counts.imageAlt, "Check images for text alternatives", "An image without an alt attribute may be announced as a filename or may hide information it conveys.", "Add concise alt text to informative images. Use alt=\"\" for decorative images.", "1.1.1 · A", examples.image),
    makeFinding("form-control-name", counts.controlName, "Give form fields a clear label", "People need to know what information belongs in each field, including when using a screen reader or voice input.", "Add a visible <label> connected to each field. Placeholder text alone is not enough.", "1.3.1, 3.3.2 · A", examples.control),
    makeFinding("button-name", counts.buttonName, "Name buttons clearly", "A button without a name can be announced without telling someone what it does.", "Add descriptive visible text or a concise aria-label.", "4.1.2 · A", examples.button),
    makeFinding("link-name", counts.linkName, "Give links an accessible name", "Unnamed links are difficult to understand and use with assistive technology.", "Add descriptive text or an accessible name to every link with a destination.", "2.4.4 · A", examples.link),
    makeFinding("vague-link-text", counts.vagueLink, "Make link text understandable on its own", "People often browse links out of context, where phrases like ‘read more’ do not identify the destination.", "Use link text that describes the destination or action.", "2.4.4 · A", examples.vagueLink, "review"),
    makeFinding("duplicate-id", counts.duplicateId, "Make each ID unique", "Duplicate IDs can make labels, links, and ARIA relationships point to the wrong content.", "Give every element a unique id value.", "4.1.2 · A", examples.duplicateId),
    makeFinding("broken-aria-reference", counts.ariaReference, "Repair missing ARIA references", "A reference to a missing ID cannot provide its intended label, description, or control relationship.", "Ensure every ID in aria-labelledby, aria-describedby, aria-controls, aria-owns, or aria-activedescendant exists.", "4.1.2 · A", examples.ariaReference),
    makeFinding("heading-order", counts.headingOrder, "Keep heading levels in sequence", "A logical heading outline helps people scan and navigate the page.", "Avoid skipping levels, such as moving from h2 directly to h4. Choose levels based on structure, then style with CSS.", "1.3.1 · A", examples.heading),
    makeFinding("main-landmark", counts.mainLandmark, "Provide one main landmark", "A main landmark gives screen-reader users a direct way to jump to the page’s primary content.", "Use exactly one <main> element, or one element with role=\"main\", for the page’s main content.", "1.3.1 · A", examples.main),
    makeFinding("iframe-title", counts.iframeTitle, "Name embedded content", "People using assistive technology need to identify the purpose of each embedded frame.", "Add a concise title attribute that describes the frame’s content.", "4.1.2 · A", examples.iframe),
    makeFinding("table-headers", counts.tableHeaders, "Check data table headers", "Without header cells, the relationship between data and its row or column label can be unclear.", "If this is a data table, add header cells (<th>) and appropriate scope. If it is layout-only, use CSS layout instead.", "1.3.1 · A", examples.table, "review"),
    makeFinding("positive-tabindex", counts.positiveTabIndex, "Remove positive tabindex values", "Positive values can create a keyboard order that differs from the page’s visual and reading order.", "Remove positive tabindex values and keep the DOM order aligned with the intended keyboard order.", "2.4.3 · A", examples.tabIndex),
    makeFinding("aria-hidden-control", counts.hiddenControl, "Keep usable controls available to assistive technology", "A keyboard-focusable control hidden from the accessibility tree can leave people without its name or purpose.", "Do not put aria-hidden=\"true\" on a usable control or its focusable container.", "4.1.2 · A", examples.hiddenControl),
    makeFinding("video-captions", counts.videoCaptions, "Review video captions", "Captions provide spoken information to people who are deaf or hard of hearing.", "Provide synchronized captions and verify they accurately represent speech and meaningful sounds.", "1.2.2 · A", examples.videoCaptions, "review"),
  ].filter((finding): finding is ScanFinding => finding !== null);

  const titleNode = allNodes.find((node) => node.tagName === "title");
  return { findings, checksRun: Object.keys(counts).length, pageTitle: titleNode ? textContent(titleNode).slice(0, 120) : null };
}
