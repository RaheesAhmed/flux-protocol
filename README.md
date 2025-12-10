# FLUX Protocol SDK

> **Universal AI Connectivity Layer** - Connect AI to anything in 4 lines. No protocol knowledge. No code execution complexity. Just your business logic.

[![npm](https://img.shields.io/npm/v/fluxprotocol-sdk.svg)](https://www.npmjs.com/package/fluxprotocol-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Install

```bash
npm install fluxprotocol-sdk
# or
pnpm add fluxprotocol-sdk
# or
yarn add fluxprotocol-sdk
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
| `fluxprotocol-sdk` | Core SDK | `npm i fluxprotocol-sdk` |
| `fluxprotocol-cli` | CLI tools | `npm i -g fluxprotocol-cli` |
| `fluxprotocol-client` | HTTP/WS client | `npm i fluxprotocol-client` |

## Transports

```typescript
import { StdioTransport, HttpTransport, WebSocketTransport } from 'fluxprotocol-sdk';

new StdioTransport(server);                    // MCP (Claude Desktop)
new HttpTransport(server, { port: 3000 });     // REST API
new WebSocketTransport(server, { port: 3001 }); // Real-time
```

## Client Usage

```typescript
import { FluxClient } from 'fluxprotocol-client';

const client = new FluxClient('http://localhost:3000');
const weather = await client.call('weather.getWeather', { city: 'Tokyo' });
```

## CLI Commands

```bash
fluxprotocol-cli create <name>   # Scaffold connector
fluxprotocol-cli dev <file>      # Dev with hot reload
fluxprotocol-cli build <file>    # Production build
```

## License

MIT © 2025
