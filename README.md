# FLUX SDK

> **Universal AI Connectivity Layer** - Connect AI to anything in 4 lines. No protocol knowledge. No code execution complexity. Just your business logic.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)

## Why FLUX?

| MCP SDK (120+ lines) | FLUX SDK (4 lines) |
|---------------------|-------------------|
| Manual schema definitions | Auto-generated from TypeScript |
| STDIO only | STDIO + HTTP + WebSocket |
| Python-first | TypeScript-first, runs anywhere |
| Complex setup | Zero learning curve |

## Quick Start

```bash
# Create a new connector
npx @flux/cli create weather

# Start development
cd weather && pnpm install && pnpm dev
```

## The 4-Line Promise

```typescript
import { connector, method, FluxServer, StdioTransport } from '@flux/sdk';

@connector('weather')
class WeatherConnector {
  @method()
  async getWeather(city: string) {
    return fetch(`https://api.weather.com/${city}`).then(r => r.json());
  }
}

// Start server
const server = new FluxServer(WeatherConnector);
server.setTransport(new StdioTransport(server));
server.start();
```

**That's it.** FLUX handles protocols, schemas, and deployment.

## Features

- **🚀 Zero Boilerplate** - Decorators replace 120+ lines of config
- **📡 Multi-Protocol** - Same code works via STDIO, HTTP, WebSocket
- **⚡ Edge-Ready** - Deploy to Vercel, Cloudflare in one command
- **🔒 Type-Safe** - Full TypeScript with auto-generated schemas
- **🔧 CLI Tools** - `flux create`, `flux dev`, `flux build`

## Packages

| Package | Description |
|---------|-------------|
| `@flux/sdk` | Core decorators and transports |
| `@flux/cli` | Command-line tools |
| `@flux/client` | HTTP and WebSocket clients |

## Transports

```typescript
import { StdioTransport, HttpTransport, WebSocketTransport } from '@flux/sdk';

// MCP compatible (Claude Desktop)
new StdioTransport(server);

// REST API
new HttpTransport(server, { port: 3000 });

// Real-time
new WebSocketTransport(server, { port: 3001 });
```

## Client Usage

```typescript
import { FluxClient } from '@flux/client';

const client = new FluxClient('http://localhost:3000');
const weather = await client.call('weather.getWeather', { city: 'Tokyo' });
```

## Edge Deployment

**Vercel:**
```typescript
import { createVercelHandler } from '@flux/sdk/adapters/vercel';
export default createVercelHandler(server);
```

**Cloudflare:**
```typescript
import { createCloudflareHandler } from '@flux/sdk/adapters/cloudflare';
export default createCloudflareHandler(server);
```

## CLI Commands

```bash
flux create <name>     # Scaffold new connector
flux dev <file>        # Run with hot reload
flux build <file>      # Build for production
```

## License

MIT © 2025
