export interface FluxClientOptions {
  baseUrl: string;
  headers?: Record<string, string>;
}

export interface ToolInfo {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export interface CallResult<T = unknown> {
  result: T;
}

export interface ToolsResponse {
  tools: ToolInfo[];
}
