// Demo in-memory store for notification read state.
// Resets on cold start — replace with DB-backed Notification model later.

const readState = new Map<string, Set<string>>()

export function markRead(userId: string, id: string) {
  const reads = readState.get(userId) ?? new Set<string>()
  reads.add(id)
  readState.set(userId, reads)
}

export function markAll(userId: string, ids: string[]) {
  const reads = readState.get(userId) ?? new Set<string>()
  ids.forEach((id) => reads.add(id))
  readState.set(userId, reads)
}

export function getReads(userId: string): Set<string> {
  return readState.get(userId) ?? new Set<string>()
}
