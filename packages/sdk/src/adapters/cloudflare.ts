import type { FluxServer } from '../runtime/server.js';

interface CloudflareRequest {
  method: string;
  url: string;
  json: () => Promise<unknown>;
}

export function createCloudflareHandler(server: FluxServer) {
  return {
    async fetch(request: CloudflareRequest): Promise<Response> {
      const url = new URL(request.url);
      const path = url.pathname;

      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      };

      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      try {
        // GET /api/tools
        if (request.method === 'GET' && path === '/api/tools') {
          const tools = server.getTools();
          return Response.json({ tools }, { headers: corsHeaders });
        }

        // POST /api/tools/:name
        if (request.method === 'POST' && path.startsWith('/api/tools/')) {
          const toolName = path.replace('/api/tools/', '');
          const args = (await request.json()) as Record<string, unknown>;
          const result = await server.callTool(toolName, args);
          return Response.json({ result }, { headers: corsHeaders });
        }

        return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : 'Internal error' },
          { status: 500, headers: corsHeaders }
        );
      }
    },
  };
}
