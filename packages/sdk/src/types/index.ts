export const CONNECTOR_METADATA_KEY = Symbol('flux:connector');
export const METHOD_METADATA_KEY = Symbol('flux:method');
export const METHODS_METADATA_KEY = Symbol('flux:methods');

export interface ConnectorMetadata {
  name: string;
  version?: string;
  description?: string;
}

export interface MethodMetadata {
  name: string;
  description?: string;
  propertyKey: string;
}

export interface ToolDefinition {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface Transport {
  start(): Promise<void>;
  stop(): Promise<void>;
}
