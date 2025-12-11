import 'reflect-metadata';

const CACHE_METADATA_KEY = Symbol('flux:cache');

export interface CacheOptions {
  ttl?: number;
  maxSize?: number;
  key?: (...args: unknown[]) => string;
}

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

const caches = new Map<string, Map<string, CacheEntry>>();

export function cache(options: CacheOptions = {}) {
  const ttl = options.ttl ?? 60000;
  const maxSize = options.maxSize ?? 100;

  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const cacheKey = `${target.constructor.name}.${propertyKey}`;

    if (!caches.has(cacheKey)) {
      caches.set(cacheKey, new Map());
    }

    descriptor.value = async function (...args: unknown[]) {
      const methodCache = caches.get(cacheKey)!;
      const key = options.key 
        ? options.key(...args) 
        : JSON.stringify(args);

      const cached = methodCache.get(key);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.value;
      }

      const result = await originalMethod.apply(this, args);

      if (methodCache.size >= maxSize) {
        const firstKey = methodCache.keys().next().value;
        if (firstKey) methodCache.delete(firstKey);
      }

      methodCache.set(key, {
        value: result,
        expiresAt: Date.now() + ttl,
      });

      return result;
    };

    Reflect.defineMetadata(CACHE_METADATA_KEY, options, target, propertyKey);
    return descriptor;
  };
}

export function clearCache(target: object, propertyKey: string): void {
  const cacheKey = `${target.constructor.name}.${propertyKey}`;
  caches.get(cacheKey)?.clear();
}

export function clearAllCaches(): void {
  caches.forEach(cache => cache.clear());
}
