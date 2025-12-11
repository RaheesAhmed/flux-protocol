import 'reflect-metadata';

const CONFIG_METADATA_KEY = Symbol('flux:config');

export interface AuthConfig {
  type: 'api_key' | 'bearer' | 'basic' | 'none';
  env?: string;
  header?: string;
}

export interface ConfigOptions {
  auth?: AuthConfig;
  timeout?: number;
  baseUrl?: string;
  env?: Record<string, string>;
}

export function config(options: ConfigOptions) {
  return function <T extends new (...args: unknown[]) => object>(constructor: T) {
    const resolvedConfig = resolveConfig(options);
    Reflect.defineMetadata(CONFIG_METADATA_KEY, resolvedConfig, constructor);
    return constructor;
  };
}

function resolveConfig(options: ConfigOptions): ConfigOptions {
  const resolved: ConfigOptions = { ...options };

  if (options.auth?.env) {
    const envValue = process.env[options.auth.env];
    if (!envValue) {
      console.warn(`Warning: Environment variable ${options.auth.env} not set`);
    }
  }

  if (options.env) {
    resolved.env = {};
    for (const [key, envVar] of Object.entries(options.env)) {
      resolved.env[key] = process.env[envVar] ?? '';
    }
  }

  return resolved;
}

export function getConfig(target: object): ConfigOptions | undefined {
  return Reflect.getMetadata(CONFIG_METADATA_KEY, target.constructor);
}

export function getAuthHeader(target: object): Record<string, string> {
  const cfg = getConfig(target);
  if (!cfg?.auth || cfg.auth.type === 'none') return {};

  const envValue = cfg.auth.env ? process.env[cfg.auth.env] : '';
  const headerName = cfg.auth.header ?? 'Authorization';

  switch (cfg.auth.type) {
    case 'api_key':
      return { [headerName]: envValue ?? '' };
    case 'bearer':
      return { [headerName]: `Bearer ${envValue}` };
    case 'basic':
      return { [headerName]: `Basic ${Buffer.from(envValue ?? '').toString('base64')}` };
    default:
      return {};
  }
}
