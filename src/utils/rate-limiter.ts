interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RequestRecord {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private requests: Map<string, RequestRecord> = new Map();
  private readonly config: RateLimitConfig;

  constructor(config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 }) {
    this.config = config;
  }

  async checkLimit(key: string): Promise<boolean> {
    const now = Date.now();
    const record = this.requests.get(key);

    if (!record || now > record.resetAt) {
      this.requests.set(key, {
        count: 1,
        resetAt: now + this.config.windowMs,
      });
      return true;
    }

    if (record.count >= this.config.maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  getStatus(key: string): {
    remaining: number;
    resetAt: number;
    resetIn: number;
  } {
    const now = Date.now();
    const record = this.requests.get(key);

    if (!record || now > record.resetAt) {
      return {
        remaining: this.config.maxRequests,
        resetAt: now + this.config.windowMs,
        resetIn: Math.ceil(this.config.windowMs / 1000),
      };
    }

    return {
      remaining: Math.max(0, this.config.maxRequests - record.count),
      resetAt: record.resetAt,
      resetIn: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  reset(key: string): void {
    this.requests.delete(key);
  }

  clear(): void {
    this.requests.clear();
  }

  private cleanExpired(): void {
    const now = Date.now();

    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetAt) {
        this.requests.delete(key);
      }
    }
  }

  startPeriodicCleanup(intervalMs: number = 60000): NodeJS.Timeout {
    return setInterval(() => {
      this.cleanExpired();
    }, intervalMs);
  }
}

export const globalRateLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60000,
});

