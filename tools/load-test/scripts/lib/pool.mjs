export async function mapPool(items, concurrency, fn) {
  const list = items ?? [];
  if (list.length === 0) return [];
  const ret = new Array(list.length);
  let i = 0;
  async function worker() {
    while (i < list.length) {
      const idx = i++;
      ret[idx] = await fn(list[idx], idx);
    }
  }
  const n = Math.max(1, Math.min(concurrency, list.length));
  await Promise.all(Array.from({ length: n }, worker));
  return ret;
}
