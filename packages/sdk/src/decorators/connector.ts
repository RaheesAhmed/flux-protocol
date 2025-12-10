import 'reflect-metadata';
import { CONNECTOR_METADATA_KEY, type ConnectorMetadata } from '../types/index.js';

export interface ConnectorOptions {
  version?: string;
  description?: string;
}

export function connector(name: string, options?: ConnectorOptions) {
  return function <T extends new (...args: unknown[]) => object>(target: T): T {
    const metadata: ConnectorMetadata = {
      name,
      version: options?.version ?? '1.0.0',
      description: options?.description ?? `${name} connector`,
    };

    Reflect.defineMetadata(CONNECTOR_METADATA_KEY, metadata, target);

    return target;
  };
}

export function getConnectorMetadata(target: object): ConnectorMetadata | undefined {
  return Reflect.getMetadata(CONNECTOR_METADATA_KEY, target.constructor);
}
