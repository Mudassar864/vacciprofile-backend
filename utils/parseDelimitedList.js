function pickTrimmed(value) {
  if (value == null) return '';
  return String(value).trim();
}

/** Split on comma, semicolon, or pipe — not inside parentheses. */
function splitDelimitedRespectingParentheses(text) {
  const parts = [];
  let current = '';
  let depth = 0;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (char === '(') {
      depth += 1;
      current += char;
      continue;
    }

    if (char === ')') {
      depth = Math.max(0, depth - 1);
      current += char;
      continue;
    }

    if (depth === 0 && (char === ',' || char === ';' || char === '|')) {
      parts.push(current);
      current = '';
      while (i + 1 < text.length && /\s/.test(text[i + 1])) {
        i += 1;
      }
      continue;
    }

    current += char;
  }

  if (current.length > 0) {
    parts.push(current);
  }

  return parts;
}

function parseDelimitedList(value) {
  if (value == null) return [];

  if (Array.isArray(value)) {
    return value.map((item) => pickTrimmed(item)).filter(Boolean);
  }

  const text = pickTrimmed(value);
  if (!text) return [];

  const seen = new Set();
  const names = [];

  for (const part of splitDelimitedRespectingParentheses(text)) {
    const trimmed = pickTrimmed(part);
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    names.push(trimmed);
  }

  return names;
}

module.exports = {
  splitDelimitedRespectingParentheses,
  parseDelimitedList,
};
