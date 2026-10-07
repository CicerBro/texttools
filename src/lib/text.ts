const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

export function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

export function graphemes(text: string): string[] {
  return [...segmenter.segment(text)].map((part) => part.segment);
}

export function lineStats(text: string): { lines: number; chars: number } {
  if (text === "") return { lines: 0, chars: 0 };
  return { lines: text.split("\n").length, chars: graphemes(text).length };
}

export function formatStats(text: string): string {
  const { lines, chars } = lineStats(text);
  if (lines === 0) return "Empty";
  const lineLabel = lines === 1 ? "line" : "lines";
  const charLabel = chars === 1 ? "char" : "chars";
  return `${lines.toLocaleString()} ${lineLabel} · ${chars.toLocaleString()} ${charLabel}`;
}

export function addPrefixSuffix(
  text: string,
  prefix: string,
  suffix: string,
  skipEmpty: boolean,
): { text: string; updated: number; skipped: number } {
  const lines = normalizeNewlines(text).split("\n");
  let updated = 0;
  let skipped = 0;
  const next = lines.map((line) => {
    if (skipEmpty && line === "") {
      skipped += 1;
      return line;
    }
    updated += 1;
    return prefix + line + suffix;
  });
  if (text === "") return { text: "", updated: 0, skipped: 0 };
  return { text: next.join("\n"), updated, skipped };
}

export function removePrefixSuffix(
  text: string,
  prefix: string,
  suffix: string,
  skipEmpty: boolean,
): { text: string; updated: number; skipped: number; unchanged: number } {
  if (text === "") return { text: "", updated: 0, skipped: 0, unchanged: 0 };
  const lines = normalizeNewlines(text).split("\n");
  let updated = 0;
  let skipped = 0;
  let unchanged = 0;
  const next = lines.map((line) => {
    if (skipEmpty && line === "") {
      skipped += 1;
      return line;
    }
    let value = line;
    if (prefix !== "" && value.startsWith(prefix)) value = value.slice(prefix.length);
    if (suffix !== "" && value.endsWith(suffix)) value = value.slice(0, value.length - suffix.length);
    if (value === line) unchanged += 1;
    else updated += 1;
    return value;
  });
  return { text: next.join("\n"), updated, skipped, unchanged };
}

export function removeLineBreaks(
  text: string,
  replacement: string,
): { text: string; replaced: number } {
  const normalized = normalizeNewlines(text);
  const replaced = normalized.match(/\n/g)?.length ?? 0;
  return { text: normalized.replaceAll("\n", replacement), replaced };
}

export function breakOnText(
  text: string,
  needle: string,
  position: "before" | "after",
  caseSensitive: boolean,
  removeExisting: boolean,
): { text: string; inserted: number } {
  let next = normalizeNewlines(text);
  if (removeExisting) next = next.replaceAll("\n", "");
  if (needle === "") return { text: next, inserted: 0 };

  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const flags = caseSensitive ? "g" : "gi";
  const pattern = new RegExp(escaped, flags);
  const inserted = next.match(pattern)?.length ?? 0;
  const replacement = position === "before" ? "\n$&" : "$&\n";
  return { text: next.replace(pattern, replacement), inserted };
}

export function wrapLines(
  text: string,
  width: number,
  wordWrap: boolean,
  escapeExisting: boolean,
): { text: string; lines: number } {
  let next = normalizeNewlines(text);
  if (!Number.isInteger(width) || width < 1) {
    return { text: next, lines: next === "" ? 0 : next.split("\n").length };
  }
  if (escapeExisting) next = next.replaceAll("\n", "\\n");

  const wrapped = next
    .split("\n")
    .map((line) => (wordWrap ? wrapWords(line, width) : hardWrap(line, width)))
    .join("\n");

  return {
    text: wrapped,
    lines: wrapped === "" ? 0 : wrapped.split("\n").length,
  };
}

function hardWrap(line: string, width: number): string {
  const chars = graphemes(line);
  if (chars.length <= width) return line;
  const parts: string[] = [];
  for (let index = 0; index < chars.length; index += width) {
    parts.push(chars.slice(index, index + width).join(""));
  }
  return parts.join("\n").replace(/\n /g, "\n");
}

function wrapWords(line: string, width: number): string {
  const chars = graphemes(line);
  if (chars.length <= width) return line;

  const tokens = tokenize(chars);
  const lines: string[] = [];
  let current: string[] = [];

  const flush = () => {
    while (current.length > 0 && /\s/.test(current[current.length - 1])) current.pop();
    if (current.length > 0) lines.push(current.join(""));
    current = [];
  };

  for (const token of tokens) {
    const isSpace = /\s/.test(token[0] ?? "");
    if (isSpace) {
      if (current.length === 0) continue;
      if (current.length + token.length <= width) current.push(...token);
      else flush();
      continue;
    }

    if (token.length > width) {
      if (current.length > 0) flush();
      for (let index = 0; index < token.length; index += width) {
        const slice = token.slice(index, index + width);
        if (index + width < token.length) lines.push(slice.join(""));
        else current = slice;
      }
      continue;
    }

    if (current.length + token.length > width) flush();
    current.push(...token);
  }

  if (current.length > 0) flush();
  return lines.join("\n");
}

function tokenize(chars: string[]): string[][] {
  const tokens: string[][] = [];
  let buffer: string[] = [];
  let bufferIsSpace: boolean | null = null;

  for (const char of chars) {
    const isSpace = /\s/.test(char);
    if (bufferIsSpace === null || bufferIsSpace === isSpace) {
      buffer.push(char);
      bufferIsSpace = isSpace;
    } else {
      tokens.push(buffer);
      buffer = [char];
      bufferIsSpace = isSpace;
    }
  }

  if (buffer.length > 0) tokens.push(buffer);
  return tokens;
}

export type RemovedLine = {
  line: number;
  reason: "empty" | "duplicate";
  duplicateOf?: number;
  text: string;
};

export function removeDuplicateLines(
  text: string,
  caseSensitive: boolean,
  removeEmpty: boolean,
): { text: string; removed: RemovedLine[] } {
  if (text === "") return { text: "", removed: [] };

  const normalized = normalizeNewlines(text);
  const lines = normalized.endsWith("\n") ? normalized.slice(0, -1).split("\n") : normalized.split("\n");
  const seen = new Map<string, number>();
  const kept: string[] = [];
  const removed: RemovedLine[] = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    if (line === "") {
      if (removeEmpty) {
        removed.push({ line: lineNumber, reason: "empty", text: "" });
      } else {
        kept.push(line);
      }
      return;
    }

    const key = caseSensitive ? line : line.toUpperCase();
    const first = seen.get(key);
    if (first === undefined) {
      seen.set(key, lineNumber);
      kept.push(line);
      return;
    }

    removed.push({
      line: lineNumber,
      reason: "duplicate",
      duplicateOf: first,
      text: line,
    });
  });

  return { text: kept.join("\n"), removed };
}

export function formatRemovedLine(item: RemovedLine): string {
  if (item.reason === "empty") return `Line ${item.line} — empty`;
  return `Line ${item.line} — duplicate of line ${item.duplicateOf}: ${item.text}`;
}
