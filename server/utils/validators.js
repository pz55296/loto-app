function validatePersonalId(pid) {
  return typeof pid === 'string' && pid.length > 0 && pid.length <= 20;
}

function validateNumbers(numbers) {
  if (!Array.isArray(numbers)) return false;
  if (numbers.length < 6 || numbers.length > 10) return false;
  const set = new Set();
  for (let n of numbers) {
    if (!Number.isInteger(n) || n < 1 || n > 45) return false;
    if (set.has(n)) return false;
    set.add(n);
  }
  return true;
}

module.exports = { validatePersonalId, validateNumbers };
