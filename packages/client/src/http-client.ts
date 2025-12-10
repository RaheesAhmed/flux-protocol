import type { FluxClientOptions, ToolInfo, ToolsResponse, CallResult } from './types.js';
import { decode as toonDecode } from '@toon-format/toon';

type ResponseFormat = 'json' | 'toon';

export class FluxClient {
  private baseUrl: string;
  private headers: Record<string, string>;
  private format: ResponseFormat;

  constructor(options: FluxClientOptions | string) {
    if (typeof options === 'string') {
      this.baseUrl = options.replace(/\/$/, '');
      this.headers = {};
      this.format = 'json';
    } else {
      this.baseUrl = options.baseUrl.replace(/\/$/, '');
      this.headers = options.headers ?? {};
      this.format = options.format ?? 'json';
    }
  }

  private getAcceptHeader(): string {
    return this.format === 'toon' ? 'application/toon' : 'application/json';
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type') ?? '';
    const text = await response.text();

    if (contentType.includes('application/toon')) {
      return toonDecode(text) as T;
    }
    return JSON.parse(text) as T;
  }

  async listTools(): Promise<ToolInfo[]> {
    const response = await fetch(`${this.baseUrl}/flux/tools`, {
      headers: {
        'Accept': this.getAcceptHeader(),
        ...this.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list tools: ${response.statusText}`);
    }

    const data = await this.parseResponse<ToolsResponse>(response);
    return data.tools;
  }

  async call<T = unknown>(toolName: string, args: Record<string, unknown> = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}/flux/tools/${toolName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': this.getAcceptHeader(),
        ...this.headers,
      },
      body: JSON.stringify(args),
    });

    if (!response.ok) {
      const error = await this.parseResponse<{ error?: string }>(response).catch(() => ({ error: response.statusText }));
      throw new Error(error.error ?? 'Unknown error');
    }

    const data = await this.parseResponse<CallResult<T>>(response);
    return data.result;
  }

  useToon(): FluxClient {
    this.format = 'toon';
    return this;
  }

  useJson(): FluxClient {
    this.format = 'json';
    return this;
  }
}

