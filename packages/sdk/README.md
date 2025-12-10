# fluxprotocol-sdk

> Universal AI Connectivity - Build connectors in 4 lines. **40% fewer tokens with TOON.**

## Install

```bash
npm install fluxprotocol-sdk
```

## Quick Start

```typescript
import { connector, method, FluxServer, StdioTransport } from 'fluxprotocol-sdk';

@connector('weather')
class WeatherConnector {
  @method()
  async getWeather(city: string) {
    return { city, temp: 22, desc: 'Sunny' };
  }
}

const server = new FluxServer(WeatherConnector);
server.setTransport(new StdioTransport(server));
server.start();
```

## Transports

```typescript
import { StdioTransport, HttpTransport, WebSocketTransport } from 'fluxprotocol-sdk';

new StdioTransport(server);                     // MCP (Claude Desktop)
new HttpTransport(server, { port: 3000 });      // REST API + TOON
new WebSocketTransport(server, { port: 3001 }); // Real-time
```

## TOON Format Support

HTTP transport supports [TOON format](https://github.com/toon-format/toon) for 40% token reduction:

- `Accept: application/toon` → TOON response
- `Accept: application/json` → JSON response (default)

## Related Packages

- `fluxprotocol-cli` - CLI tools
- `fluxprotocol-client` - HTTP/WebSocket client

## License

MIT

