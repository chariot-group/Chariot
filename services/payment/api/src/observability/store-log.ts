export type StoreName = 'mongo' | 'postgres' | 'redis' | 'minio';

export function storeEventLine(
  store: StoreName,
  op: string,
  status = 'ok',
): string {
  return `store_event store=${store} op=${op} status=${status}`;
}

export function storeFailLine(
  store: StoreName,
  op: string,
  reason: string,
  detail?: string,
): string {
  const line = `store_fail store=${store} op=${op} reason=${reason}`;
  return detail ? `${line} ${detail}` : line;
}
