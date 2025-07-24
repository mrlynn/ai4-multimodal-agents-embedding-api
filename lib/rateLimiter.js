// In-memory rate limiter for serverless functions
class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.cleanup();
  }

  // Clean up expired entries every 5 minutes
  cleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.requests.entries()) {
        if (now - data.windowStart > data.windowMs) {
          this.requests.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  // Check if request should be allowed
  isAllowed(identifier, limits = {}) {
    const {
      windowMs = 15 * 60 * 1000, // 15 minutes
      maxRequests = 100,
      burstLimit = 10, // Max requests per minute
      burstWindowMs = 60 * 1000 // 1 minute
    } = limits;

    const now = Date.now();
    const key = identifier;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, {
        count: 1,
        burstCount: 1,
        windowStart: now,
        burstWindowStart: now,
        windowMs,
        maxRequests,
        burstLimit,
        burstWindowMs
      });
      return { allowed: true, remaining: maxRequests - 1 };
    }

    const data = this.requests.get(key);

    // Reset window if expired
    if (now - data.windowStart > windowMs) {
      data.count = 1;
      data.windowStart = now;
    } else {
      data.count++;
    }

    // Reset burst window if expired
    if (now - data.burstWindowStart > data.burstWindowMs) {
      data.burstCount = 1;
      data.burstWindowStart = now;
    } else {
      data.burstCount++;
    }

    // Check burst limit first
    if (data.burstCount > burstLimit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: data.burstWindowStart + data.burstWindowMs,
        error: 'Too many requests per minute'
      };
    }

    // Check main limit
    if (data.count > maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: data.windowStart + windowMs,
        error: 'Rate limit exceeded'
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - data.count)
    };
  }

  // Get current usage for an identifier
  getUsage(identifier) {
    const data = this.requests.get(identifier);
    if (!data) return { count: 0, burstCount: 0 };
    
    const now = Date.now();
    
    // Clean up expired data
    if (now - data.windowStart > data.windowMs) {
      return { count: 0, burstCount: 0 };
    }
    
    return {
      count: data.count,
      burstCount: data.burstCount,
      windowStart: data.windowStart,
      burstWindowStart: data.burstWindowStart
    };
  }
}

// Singleton instance for serverless environment
const rateLimiter = new RateLimiter();

// Get client identifier (IP + User-Agent for better uniqueness)
function getClientIdentifier(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
             req.headers['x-real-ip'] || 
             req.connection?.remoteAddress || 
             'unknown';
  
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  // Create a simple hash of IP + User-Agent
  const identifier = `${ip}:${userAgent.substring(0, 50)}`;
  return identifier;
}

// Rate limiting middleware
function applyRateLimit(req, res, limits = {}) {
  const identifier = getClientIdentifier(req);
  const result = rateLimiter.isAllowed(identifier, limits);

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', limits.maxRequests || 100);
  res.setHeader('X-RateLimit-Remaining', result.remaining || 0);
  
  if (result.resetTime) {
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000));
  }

  if (!result.allowed) {
    return res.status(429).json({
      error: result.error || 'Rate limit exceeded',
      retryAfter: result.resetTime ? Math.ceil((result.resetTime - Date.now()) / 1000) : 60
    });
  }

  return null; // Continue processing
}

module.exports = {
  rateLimiter,
  getClientIdentifier,
  applyRateLimit
};