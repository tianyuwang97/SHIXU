// Keep only codes, never member-only data, for the lifetime of this page.
export function createCandidateOrder(random = Math.random) {
 const orders = new Map();
 return (rows, key) => {
  const previous = orders.get(key) || [];
  const codes = new Set(rows.map(row => row.code));
  const retained = previous.filter(code => codes.has(code));
  const known = new Set(retained);
  const added = [...codes].filter(code => !known.has(code));
  for (let i = added.length - 1; i > 0; i--) {
   const j = Math.floor(random() * (i + 1));
   [added[i], added[j]] = [added[j], added[i]];
  }
  const order = [...retained, ...added];
  orders.set(key, order);
  const current = new Map(rows.map(row => [row.code, row]));
  return order.map(code => current.get(code));
 };
}
