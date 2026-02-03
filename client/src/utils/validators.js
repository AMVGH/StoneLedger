export function validatePassword(pw) {
  const rules = {
    minLen: pw.length >= 12,
    lower: /[a-z]/.test(pw),
    upper: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };
  return { ok: Object.values(rules).every(Boolean), rules };
}
