# FLUX Protocol SDK

> **Universal AI Connectivity Layer** - Connect AI to anything in 4 lines. **40% fewer tokens** with TOON format.

[![npm](https://img.shields.io/npm/v/fluxprotocol-sdk.svg)](https://www.npmjs.com/package/fluxprotocol-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Why FLUX?

| Feature | MCP | FLUX |
|---------|-----|------|
| Lines of code | 120+ | **4** |
| Protocols | STDIO only | STDIO, HTTP, WebSocket |
| Token efficiency | JSON | **TOON (40% fewer tokens)** |
| Type safety | Manual | Automatic |

## Install

```bash
npm install fluxprotocol-sdk
```

## Quick Start

```bash
npx fluxprotocol-cli create weather
cd weather && pnpm install && pnpm dev
```

## The 4-Line Promise

```typescript
import { connector, method, FluxServer, StdioTransport } from 'fluxprotocol-sdk';

@connector('weather')
class WeatherConnector {
  @method()
  async getWeather(city: string) {
    return fetch(`https://api.weather.com/${city}`).then(r => r.json());
  }
}

const server = new FluxServer(WeatherConnector);
server.setTransport(new StdioTransport(server));
server.start();
```

## Packages

| Package | Description | Install |
|---------|-------------|---------|
| `fluxprotocol-sdk` | Core SDK with transports | `npm i fluxprotocol-sdk` |
| `fluxprotocol-cli` | CLI tools | `npm i -g fluxprotocol-cli` |
| `fluxprotocol-client` | HTTP/WS client | `npm i fluxprotocol-client` |

## Transports

```typescript
import { StdioTransport, HttpTransport, WebSocketTransport } from 'fluxprotocol-sdk';

new StdioTransport(server);                     // MCP (Claude Desktop)
new HttpTransport(server, { port: 3000 });      // REST API + TOON
new WebSocketTransport(server, { port: 3001 }); // Real-time
```

## TOON Format (40% Fewer Tokens)

FLUX supports [TOON (Token-Oriented Object Notation)](https://github.com/toon-format/toon) for efficient AI communication:

```typescript
import { FluxClient } from 'fluxprotocol-client';

const client = new FluxClient('http://localhost:3000');

// Enable TOON format (40% fewer tokens)
const tools = await client.useToon().listTools();

// Or use JSON (default)
const weather = await client.call('weather.getWeather', { city: 'Tokyo' });
```

**Server auto-detects format via `Accept` header:**
- `Accept: application/toon` → TOON response
- `Accept: application/json` → JSON response (default)

## CLI Commands

```bash
fluxprotocol-cli create <name>   # Scaffold connector
fluxprotocol-cli dev <file>      # Dev with hot reload
fluxprotocol-cli build <file>    # Production build
```

## License

MIT © 2025

