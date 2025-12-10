import type { Transport, JsonRpcRequest, JsonRpcResponse } from '../types/index.js';
import type { FluxServer } from '../runtime/server.js';

interface WebSocketTransportOptions {
  port?: number;
  path?: string;
}

interface WebSocketClient {
  id: string;
  send: (data: string) => void;
  close: () => void;
}

export class WebSocketTransport implements Transport {
  private server: FluxServer;
  private wss: import('ws').WebSocketServer | null = null;
  private httpServer: import('http').Server | null = null;
  private options: WebSocketTransportOptions;
  private clients: Map<string, WebSocketClient> = new Map();

  constructor(server: FluxServer, options: WebSocketTransportOptions = {}) {
    this.server = server;
    this.options = {
      port: options.port ?? 3001,
      path: options.path ?? '/ws',
    };
  }

  async start(): Promise<void> {
    const http = await import('http');
    const { WebSocketServer } = await import('ws');

    this.httpServer = http.createServer();
    this.wss = new WebSocketServer({ server: this.httpServer, path: this.options.path });

    this.wss.on('connection', (ws) => {
      const clientId = crypto.randomUUID();

      const client: WebSocketClient = {
        id: clientId,
        send: (data) => ws.send(data),
        close: () => ws.close(),
      };

      this.clients.set(clientId, client);

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleMessage(client, message);
        } catch (error) {
          client.send(JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          }));
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
      });

      ws.on('error', () => {
        this.clients.delete(clientId);
      });
    });

    this.httpServer.listen(this.options.port, () => {
      console.log(`WebSocket server running on ws://localhost:${this.options.port}${this.options.path}`);
    });
  }

  async stop(): Promise<void> {
    for (const client of this.clients.values()) {
      client.close();
    }
    this.clients.clear();

    return new Promise((resolve) => {
      if (this.wss) {
        this.wss.close(() => {
          if (this.httpServer) {
            this.httpServer.close(() => resolve());
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  private async handleMessage(client: WebSocketClient, message: Record<string, unknown>): Promise<void> {
    const { type, id } = message;

    switch (type) {
      case 'list': {
        const tools = this.server.getTools();
        client.send(JSON.stringify({ type: 'tools', id, tools }));
        break;
      }

      case 'call': {
        const { name, params } = message as { name: string; params: Record<string, unknown>; type: string; id: string };
        try {
          const result = await this.server.callTool(name, params ?? {});
          client.send(JSON.stringify({ type: 'result', id, result }));
        } catch (error) {
          client.send(JSON.stringify({ type: 'error', id, error: error instanceof Error ? error.message : 'Unknown error' }));
        }
        break;
      }

      case 'rpc': {
        const request = message as unknown as JsonRpcRequest;
        const response = await this.handleRpc(request);
        client.send(JSON.stringify(response));
        break;
      }

      default:
        client.send(JSON.stringify({ type: 'error', id, error: `Unknown message type: ${type}` }));
    }
  }

  private async handleRpc(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const { id, method, params } = request;

    try {
      switch (method) {
        case 'tools/list':
          return { jsonrpc: '2.0', id, result: { tools: this.server.getTools() } };

        case 'tools/call': {
          const { name, arguments: args } = params as { name: string; arguments: Record<string, unknown> };
          const result = await this.server.callTool(name, args);
          return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(result) }] } };
        }

        default:
          return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } };
      }
    } catch (error) {
      return { jsonrpc: '2.0', id, error: { code: -32603, message: error instanceof Error ? error.message : 'Internal error' } };
    }
  }

  broadcast(data: unknown): void {
    const message = JSON.stringify(data);
    for (const client of this.clients.values()) {
      client.send(message);
    }
  }
}
