import 'reflect-metadata';

const RATE_LIMIT_METADATA_KEY = Symbol('flux:rateLimit');

export interface RateLimitOptions {
  requests: number;
  window: number | string;
  key?: 'global' | 'method' | ((...args: unknown[]) => string);
}

interface RateLimitState {
  tokens: number;
  lastRefill: number;
}

const rateLimitStates = new Map<string, RateLimitState>();

function parseWindow(window: number | string): number {
  if (typeof window === 'number') return window;

  const match = window.match(/^(\d+)(ms|s|m|h)?$/);
  if (!match) return 60000;

  const value = parseInt(match[1], 10);
  const unit = match[2] ?? 'ms';

  switch (unit) {
    case 'ms': return value;
    case 's': return value * 1000;
    case 'm': return value * 60000;
    case 'h': return value * 3600000;
    default: return value;
  }
}

export class RateLimitExceededError extends Error {
  constructor(public retryAfter: number) {
    super(`Rate limit exceeded. Retry after ${retryAfter}ms`);
    this.name = 'RateLimitExceededError';
  }
}

export function rateLimit(options: RateLimitOptions) {
  const windowMs = parseWindow(options.window);
  const maxRequests = options.requests;

  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const keyType = options.key ?? 'method';
      let stateKey: string;

      if (keyType === 'global') {
        stateKey = 'global';
      } else if (keyType === 'method') {
        stateKey = `${target.constructor.name}.${propertyKey}`;
      } else {
        stateKey = keyType(...args);
      }

      const now = Date.now();
      let state = rateLimitStates.get(stateKey);

      if (!state) {
        state = { tokens: maxRequests, lastRefill: now };
        rateLimitStates.set(stateKey, state);
      }

      const elapsed = now - state.lastRefill;
      const refillRate = maxRequests / windowMs;
      const tokensToAdd = elapsed * refillRate;

      state.tokens = Math.min(maxRequests, state.tokens + tokensToAdd);
      state.lastRefill = now;

      if (state.tokens < 1) {
        const retryAfter = Math.ceil((1 - state.tokens) / refillRate);
        throw new RateLimitExceededError(retryAfter);
      }

      state.tokens -= 1;
      return originalMethod.apply(this, args);
    };

    Reflect.defineMetadata(RATE_LIMIT_METADATA_KEY, options, target, propertyKey);
    return descriptor;
  };
}
