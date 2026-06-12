// Markdown parsing for the standards catalog.
//
// Guideline files are structured as:  # file title / ## section / ### `rule-id`
// with an optional SID line immediately under each rule heading. Pattern and tooling
// docs are whole-document units with an optional SID line under the # title.
//
// We parse to an mdast (via unified/remark-parse) only to locate heading boundaries
// reliably, then slice the *original source* by byte offset so rule bodies keep their
// exact markdown.

import { unified } from 'unified';
import remarkParse from 'remark-parse';

const processor = unified().use(remarkParse);

/** Extract `{{id|default|label}}` placeholders from a markdown string. */
export function extractParams(markdown) {
  const re = /\{\{\s*([^|{}]+?)\s*\|([^|{}]*)\|([^{}]*?)\}\}/g;
  const params = [];
  const seen = new Set();
  let m;
  while ((m = re.exec(markdown)) !== null) {
    const id = m[1].trim();
    if (seen.has(id)) continue; // first definition wins; duplicates share the value
    seen.add(id);
    params.push({ id, default: m[2].trim(), label: m[3].trim() });
  }
  return params;
}

// Matches a leading SID line: <a id="SDLC-..."></a>**`SDLC-...`**
const SID_LINE_RE =
  /^\s*(?:<a\s+id="(SDLC-[A-Z-]+-\d{4,})"\s*>\s*<\/a>\s*)?\*\*`?(SDLC-[A-Z-]+-\d{4,})`?\*\*\s*$/;

/**
 * If `body` begins with a SID line, strip it and return the SID. Otherwise return the
 * body unchanged with sid: null.
 */
export function stripSidLine(body) {
  const lines = body.split('\n');
  // skip leading blank lines
  let i = 0;
  while (i < lines.length && lines[i].trim() === '') i++;
  const m = lines[i] != null ? SID_LINE_RE.exec(lines[i]) : null;
  if (!m) return { sid: null, body };
  const sid = m[1] || m[2];
  const rest = lines.slice(i + 1).join('\n').replace(/^\n+/, '');
  return { sid, body: rest };
}

function headingText(node) {
  // concatenate text/inlineCode children
  return (node.children || [])
    .map((c) => (c.type === 'text' || c.type === 'inlineCode' ? c.value : ''))
    .join('')
    .trim();
}

/** A rule heading is `### `rule-id`` — exactly one inlineCode child. */
function ruleSlugFromHeading(node) {
  const kids = (node.children || []).filter((c) => c.type !== 'text' || c.value.trim() !== '');
  if (kids.length === 1 && kids[0].type === 'inlineCode') {
    return kids[0].value.trim();
  }
  return null;
}

/**
 * Parse a guideline file. Returns { file, title, fileSid, sections: [{title, rules}] }.
 * Each rule: { slug, title, sid, bodyMarkdown, params }.
 */
export function parseGuidelineFile(file, source) {
  const tree = processor.parse(source);
  const kids = tree.children;

  // Collect heading nodes with their source offsets.
  const headings = [];
  for (const node of kids) {
    if (node.type === 'heading') {
      headings.push({
        depth: node.depth,
        text: headingText(node),
        slug: node.depth === 3 ? ruleSlugFromHeading(node) : null,
        start: node.position.start.offset,
        end: node.position.end.offset,
      });
    }
  }

  const title = headings.find((h) => h.depth === 1)?.text ?? file;
  const sections = [];
  let currentSection = null;

  for (let i = 0; i < headings.length; i++) {
    const h = headings[i];
    if (h.depth === 2) {
      currentSection = { title: h.text, rules: [] };
      sections.push(currentSection);
    } else if (h.depth === 3 && h.slug) {
      // body runs from end of this heading to the start of the next heading of depth <= 3
      let bodyEnd = source.length;
      for (let j = i + 1; j < headings.length; j++) {
        if (headings[j].depth <= 3) {
          bodyEnd = headings[j].start;
          break;
        }
      }
      const rawBody = source.slice(h.end, bodyEnd).replace(/^\n+/, '').replace(/\s+$/, '');
      const { sid, body } = stripSidLine(rawBody);
      const rule = {
        slug: h.slug,
        title: h.text,
        sid,
        bodyMarkdown: body,
        params: extractParams(body),
      };
      if (!currentSection) {
        currentSection = { title: '', rules: [] };
        sections.push(currentSection);
      }
      currentSection.rules.push(rule);
    }
  }

  // file-level SID (rare; under the H1) — look at content right after the H1
  let fileSid = null;
  const h1 = headings.find((h) => h.depth === 1);
  if (h1) {
    const nextHeadingStart = headings.find((h) => h.start > h1.end)?.start ?? source.length;
    const between = source.slice(h1.end, nextHeadingStart).replace(/^\n+/, '');
    fileSid = stripSidLine(between).sid;
  }

  return { file, title, fileSid, sections };
}

/**
 * Parse a whole-document item (pattern or tooling).
 * Returns { file, kind, slug, title, sid, bodyMarkdown }.
 */
export function parseDocFile(file, source, { kind, slug }) {
  const tree = processor.parse(source);
  const h1 = tree.children.find((n) => n.type === 'heading' && n.depth === 1);
  const title = h1 ? headingText(h1) : slug;

  let sid = null;
  let bodyMarkdown = source.trim();
  if (h1) {
    const after = source.slice(h1.position.end.offset).replace(/^\n+/, '');
    const stripped = stripSidLine(after);
    sid = stripped.sid;
  }
  return { file, kind, slug, title, sid, bodyMarkdown };
}
