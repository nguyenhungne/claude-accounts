export function blankToNull(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
}

export function splitList(value) {
  return String(value ?? '')
    .split(/[,\s]+/)
    .map(item => item.trim())
    .filter(Boolean);
}
