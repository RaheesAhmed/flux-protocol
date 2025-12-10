import type { ToolInfo } from './types.js';

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
}

export class FluxWebSocketClient {
  private url: string;
  private ws: WebSocket | null = null;
  private pending: Map<string, PendingRequest> = new Map();
  private messageId = 0;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(url: string) {
    this.url = url;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onerror = () => {
        reject(new Error('WebSocket connection failed'));
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = () => {
        this.handleClose();
      };
    });
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      const { id, type, result, tools, error } = message;

      const pending = this.pending.get(id);
      if (pending) {
        this.pending.delete(id);
        if (error) {
          pending.reject(new Error(error));
        } else {
          pending.resolve(type === 'tools' ? tools : result);
        }
      }
    } catch {
      // Ignore malformed messages
    }
  }

  private handleClose(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
    }
  }

  async listTools(): Promise<ToolInfo[]> {
    return this.send<ToolInfo[]>('list', {});
  }

  async call<T = unknown>(toolName: string, args: Record<string, unknown> = {}): Promise<T> {
    return this.send<T>('call', { name: toolName, params: args });
  }

  private send<T>(type: string, payload: Record<string, unknown>): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const id = String(++this.messageId);
      this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject });

      this.ws.send(JSON.stringify({ type, id, ...payload }));

      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
