import 'reflect-metadata';

const RETRY_METADATA_KEY = Symbol('flux:retry');

export interface RetryOptions {
  attempts?: number;
  backoff?: 'fixed' | 'exponential' | 'linear';
  delay?: number;
  maxDelay?: number;
  retryOn?: (error: Error) => boolean;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateDelay(
  attempt: number,
  backoff: 'fixed' | 'exponential' | 'linear',
  baseDelay: number,
  maxDelay: number
): number {
  let delay: number;

  switch (backoff) {
    case 'exponential':
      delay = baseDelay * Math.pow(2, attempt - 1);
      break;
    case 'linear':
      delay = baseDelay * attempt;
      break;
    case 'fixed':
    default:
      delay = baseDelay;
  }

  return Math.min(delay, maxDelay);
}

export function retry(options: RetryOptions = {}) {
  const maxAttempts = options.attempts ?? 3;
  const backoff = options.backoff ?? 'exponential';
  const baseDelay = options.delay ?? 1000;
  const maxDelay = options.maxDelay ?? 30000;
  const shouldRetry = options.retryOn ?? (() => true);

  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      let lastError: Error | undefined;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error as Error;

          if (attempt === maxAttempts || !shouldRetry(lastError)) {
            throw lastError;
          }

          const delay = calculateDelay(attempt, backoff, baseDelay, maxDelay);
          await sleep(delay);
        }
      }

      throw lastError;
    };

    Reflect.defineMetadata(RETRY_METADATA_KEY, options, target, propertyKey);
    return descriptor;
  };
}
