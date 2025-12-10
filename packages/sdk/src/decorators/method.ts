import 'reflect-metadata';
import { METHODS_METADATA_KEY, type MethodMetadata } from '../types/index.js';

export interface MethodOptions {
  description?: string;
  name?: string;
}

export function method(options?: MethodOptions) {
  return function (
    target: object,
    propertyKey: string,
    _descriptor: PropertyDescriptor
  ): void {
    const existingMethods: MethodMetadata[] =
      Reflect.getMetadata(METHODS_METADATA_KEY, target.constructor) ?? [];

    const metadata: MethodMetadata = {
      name: options?.name ?? propertyKey,
      description: options?.description ?? propertyKey,
      propertyKey,
    };

    existingMethods.push(metadata);
    Reflect.defineMetadata(METHODS_METADATA_KEY, existingMethods, target.constructor);
  };
}

export function getMethodsMetadata(target: object): MethodMetadata[] {
  return Reflect.getMetadata(METHODS_METADATA_KEY, target.constructor) ?? [];
}
