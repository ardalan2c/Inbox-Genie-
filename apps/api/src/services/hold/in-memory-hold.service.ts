export class InMemoryHoldService {
  private map = new Map<string, NodeJS.Timeout>()

  async hold(key: string, ttlSec: number) {
    if (this.map.has(key)) return { held: false, reason: 'already_held' }
    const t = setTimeout(() => this.map.delete(key), ttlSec * 1000)
    this.map.set(key, t)
    return { held: true }
  }

  async release(key: string) {
    const t = this.map.get(key)
    if (t) clearTimeout(t)
    this.map.delete(key)
    return { released: true }
  }
}

