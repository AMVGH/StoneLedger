export const PASSWORD_POLICY_MESSAGE = "Passwords must be a minimum of 8 characters, must start with a letter, must have a letter, a number and a special character.";

export function validatePassword(pw) {
  const rules = {
    minLen: pw.length >= 8,
    startsWithLetter: /^[A-Za-z]/.test(pw),
    letter: /[A-Za-z]/.test(pw),
    number: /[0-9]/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };
  return { ok: Object.values(rules).every(Boolean), rules };
}
