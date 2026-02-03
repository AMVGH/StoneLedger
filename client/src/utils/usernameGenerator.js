export function generateUsername(firstName, lastName, date = new Date()) {
  if (!firstName || !lastName) return "";

  const initial = firstName.trim()[0].toLowerCase();

  const cleanLast = lastName
    .toLowerCase()
    .replace(/[^a-z]/g, ""); // remove spaces/special chars

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);

  return `${initial}${cleanLast}${month}${year}`;
}
