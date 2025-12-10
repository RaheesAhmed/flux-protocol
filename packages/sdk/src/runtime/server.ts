import 'reflect-metadata';
import { getConnectorMetadata } from '../decorators/connector.js';
import { getMethodsMetadata } from '../decorators/method.js';
import type { ToolDefinition, Transport } from '../types/index.js';

export class FluxServer {
  private connectorInstance: object;
  private transport: Transport | null = null;

  constructor(ConnectorClass: new () => object) {
    this.connectorInstance = new ConnectorClass();
  }

  getTools(): ToolDefinition[] {
    const connectorMeta = getConnectorMetadata(this.connectorInstance);
    const methods = getMethodsMetadata(this.connectorInstance);

    if (!connectorMeta) {
      throw new Error('Class must be decorated with @connector');
    }

    return methods.map((m) => ({
      name: `${connectorMeta.name}.${m.name}`,
      description: m.description,
      inputSchema: this.generateSchema(m.propertyKey),
    }));
  }

  private generateSchema(methodName: string): Record<string, unknown> {
    const paramTypes = Reflect.getMetadata(
      'design:paramtypes',
      this.connectorInstance,
      methodName
    );

    if (!paramTypes) {
      return { type: 'object', properties: {} };
    }

    const properties: Record<string, { type: string }> = {};
    const required: string[] = [];

    paramTypes.forEach((type: unknown, index: number) => {
      const paramName = `arg${index}`;
      properties[paramName] = { type: this.mapType(type) };
      required.push(paramName);
    });

    return { type: 'object', properties, required };
  }

  private mapType(type: unknown): string {
    if (type === String) return 'string';
    if (type === Number) return 'number';
    if (type === Boolean) return 'boolean';
    if (type === Array) return 'array';
    return 'object';
  }

  async callTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    const methods = getMethodsMetadata(this.connectorInstance);
    const connectorMeta = getConnectorMetadata(this.connectorInstance);

    const shortName = toolName.replace(`${connectorMeta?.name}.`, '');
    const methodMeta = methods.find((m) => m.name === shortName);

    if (!methodMeta) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    const method = (this.connectorInstance as Record<string, unknown>)[methodMeta.propertyKey];
    
    if (typeof method !== 'function') {
      throw new Error(`Method ${methodMeta.propertyKey} is not a function`);
    }

    const argValues = Object.values(args);
    return method.apply(this.connectorInstance, argValues);
  }

  setTransport(transport: Transport): void {
    this.transport = transport;
  }

  async start(): Promise<void> {
    if (!this.transport) {
      throw new Error('Transport not set. Call setTransport() first.');
    }
    await this.transport.start();
  }

  async stop(): Promise<void> {
    if (this.transport) {
      await this.transport.stop();
    }
  }
}
