import type { Transport, JsonRpcRequest, JsonRpcResponse } from '../types/index.js';
import type { FluxServer } from '../runtime/server.js';

interface HttpTransportOptions {
  port?: number;
  cors?: boolean;
  prefix?: string;
}

export class HttpTransport implements Transport {
  private server: FluxServer;
  private httpServer: import('http').Server | null = null;
  private options: HttpTransportOptions;

  constructor(server: FluxServer, options: HttpTransportOptions = {}) {
    this.server = server;
    this.options = {
      port: options.port ?? 3000,
      cors: options.cors ?? true,
      prefix: options.prefix ?? '/api',
    };
  }

  async start(): Promise<void> {
    const http = await import('http');

    this.httpServer = http.createServer(async (req, res) => {
      if (this.options.cors) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }
      }

      try {
        await this.handleRequest(req, res);
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });

    this.httpServer.listen(this.options.port, () => {
      console.log(`HTTP server running on http://localhost:${this.options.port}`);
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.httpServer) {
        this.httpServer.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  private async handleRequest(
    req: import('http').IncomingMessage,
    res: import('http').ServerResponse
  ): Promise<void> {
    const url = new URL(req.url ?? '/', `http://localhost:${this.options.port}`);
    const path = url.pathname;

    // GET /api/tools - List all tools
    if (req.method === 'GET' && path === `${this.options.prefix}/tools`) {
      const tools = this.server.getTools();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ tools }));
      return;
    }

    // POST /api/tools/:name - Call a tool
    if (req.method === 'POST' && path.startsWith(`${this.options.prefix}/tools/`)) {
      const toolName = path.replace(`${this.options.prefix}/tools/`, '');
      const body = await this.readBody(req);
      const args = JSON.parse(body || '{}');

      try {
        const result = await this.server.callTool(toolName, args);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ result }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }));
      }
      return;
    }

    // POST /api/rpc - JSON-RPC endpoint
    if (req.method === 'POST' && path === `${this.options.prefix}/rpc`) {
      const body = await this.readBody(req);
      const request: JsonRpcRequest = JSON.parse(body);
      const response = await this.handleRpc(request);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
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

  private readBody(req: import('http').IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => resolve(body));
      req.on('error', reject);
    });
  }
}
