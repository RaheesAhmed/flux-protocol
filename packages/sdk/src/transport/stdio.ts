import * as readline from 'readline';
import type { JsonRpcRequest, JsonRpcResponse, Transport } from '../types/index.js';
import type { FluxServer } from '../runtime/server.js';

export class StdioTransport implements Transport {
  private server: FluxServer;
  private rl: readline.Interface | null = null;

  constructor(server: FluxServer) {
    this.server = server;
  }

  async start(): Promise<void> {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    this.rl.on('line', async (line) => {
      await this.handleMessage(line);
    });
  }

  async stop(): Promise<void> {
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
  }

  private async handleMessage(message: string): Promise<void> {
    try {
      const request: JsonRpcRequest = JSON.parse(message);
      const response = await this.processRequest(request);
      this.send(response);
    } catch (error) {
      const errorResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 0,
        error: {
          code: -32700,
          message: 'Parse error',
          data: error instanceof Error ? error.message : 'Unknown error',
        },
      };
      this.send(errorResponse);
    }
  }

  private async processRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const { id, method, params } = request;

    try {
      switch (method) {
        case 'initialize':
          return {
            jsonrpc: '2.0',
            id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: { tools: {} },
              serverInfo: { name: 'flux-server', version: '0.0.1' },
            },
          };

        case 'tools/list':
          return {
            jsonrpc: '2.0',
            id,
            result: { tools: this.server.getTools() },
          };

        case 'tools/call': {
          const toolParams = params as { name: string; arguments: Record<string, unknown> };
          const result = await this.server.callTool(toolParams.name, toolParams.arguments);
          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [{ type: 'text', text: JSON.stringify(result) }],
            },
          };
        }

        default:
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: `Method not found: ${method}` },
          };
      }
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal error',
        },
      };
    }
  }

  private send(response: JsonRpcResponse): void {
    process.stdout.write(JSON.stringify(response) + '\n');
  }
}
