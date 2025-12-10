import type { FluxServer } from '@flux/sdk';

interface VercelRequest {
  method?: string;
  url?: string;
  body?: unknown;
  query?: Record<string, string | string[]>;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (data: unknown) => void;
  setHeader: (name: string, value: string) => VercelResponse;
  end: () => void;
}

export function createVercelHandler(server: FluxServer) {
  return async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    const url = new URL(req.url ?? '/', 'http://localhost');
    const path = url.pathname;

    try {
      // GET /api/tools
      if (req.method === 'GET' && path === '/api/tools') {
        const tools = server.getTools();
        res.status(200).json({ tools });
        return;
      }

      // POST /api/tools/:name
      if (req.method === 'POST' && path.startsWith('/api/tools/')) {
        const toolName = path.replace('/api/tools/', '');
        const args = (req.body as Record<string, unknown>) ?? {};
        const result = await server.callTool(toolName, args);
        res.status(200).json({ result });
        return;
      }

      res.status(404).json({ error: 'Not found' });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal error',
      });
    }
  };
}
