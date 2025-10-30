import { Request, Response, NextFunction } from 'express';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

export class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // Clean up expired entries every minute
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60 * 1000);
  }

  middleware = (req: Request, res: Response, next: NextFunction) => {
    const key = this.getKey(req);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    let entry = this.requests.get(key);

    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired entry
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
        blocked: false
      };
    }

    // Check if IP is currently blocked
    if (entry.blocked && entry.resetTime > now) {
      return res.status(429).json({
        message: this.config.message || 'Too many requests, please try again later',
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      });
    }

    // Reset block status if window has expired
    if (entry.blocked && entry.resetTime <= now) {
      entry.blocked = false;
      entry.count = 0;
      entry.resetTime = now + this.config.windowMs;
    }

    entry.count++;

    // Check if limit exceeded
    if (entry.count > this.config.maxRequests) {
      entry.blocked = true;
      this.requests.set(key, entry);

      return res.status(429).json({
        message: this.config.message || 'Too many requests, please try again later',
        retryAfter: Math.ceil(this.config.windowMs / 1000)
      });
    }

    this.requests.set(key, entry);

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': this.config.maxRequests.toString(),
      'X-RateLimit-Remaining': Math.max(0, this.config.maxRequests - entry.count).toString(),
      'X-RateLimit-Reset': new Date(entry.resetTime).toISOString()
    });

    next();
  };

  private getKey(req: Request): string {
    // Use IP address as the key
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `rate_limit:${ip}`;
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.requests.entries()) {
      if (entry.resetTime < now) {
        this.requests.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired rate limit entries`);
    }
  }

  // Get rate limit statistics
  getStats(): {
    totalEntries: number;
    blockedEntries: number;
    activeEntries: number;
  } {
    const now = Date.now();
    let blockedCount = 0;
    let activeCount = 0;

    for (const entry of this.requests.values()) {
      if (entry.blocked && entry.resetTime > now) {
        blockedCount++;
      } else if (entry.resetTime > now) {
        activeCount++;
      }
    }

    return {
      totalEntries: this.requests.size,
      blockedEntries: blockedCount,
      activeEntries: activeCount
    };
  }

  // Clear all rate limit entries (for development/testing)
  clear(): void {
    this.requests.clear();
  }
}

// Create different rate limiters for different endpoints
export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 20, // 20 login attempts per 15 minutes (increased for development)
  message: 'Too many login attempts, please try again in 15 minutes'
});

export const generalRateLimiter = new RateLimiter({
  windowMs: process.env.NODE_ENV === 'development' ? 5 * 60 * 1000 : 15 * 60 * 1000, // 5 min dev, 15 min prod
  maxRequests: process.env.NODE_ENV === 'development' ? 2000 : 100, // generous in dev
  message: 'Too many requests, please try again later'
});

export const strictRateLimiter = new RateLimiter({
  windowMs: process.env.NODE_ENV === 'development' ? 5 * 60 * 1000 : 5 * 60 * 1000,
  maxRequests: process.env.NODE_ENV === 'development' ? 200 : 10,
  message: 'Too many requests, please slow down'
});
