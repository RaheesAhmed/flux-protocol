import type { FluxClientOptions, ToolInfo, ToolsResponse, CallResult } from './types.js';

export class FluxClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(options: FluxClientOptions | string) {
    if (typeof options === 'string') {
      this.baseUrl = options.replace(/\/$/, '');
      this.headers = {};
    } else {
      this.baseUrl = options.baseUrl.replace(/\/$/, '');
      this.headers = options.headers ?? {};
    }
  }

  async listTools(): Promise<ToolInfo[]> {
    const response = await fetch(`${this.baseUrl}/api/tools`, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to list tools: ${response.statusText}`);
    }

    const data = await response.json() as ToolsResponse;
    return data.tools;
  }

  async call<T = unknown>(toolName: string, args: Record<string, unknown> = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}/api/tools/${toolName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers,
      },
      body: JSON.stringify(args),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText })) as { error?: string };
      throw new Error(error.error ?? 'Unknown error');
    }

    const data = await response.json() as CallResult<T>;
    return data.result;
  }
}
