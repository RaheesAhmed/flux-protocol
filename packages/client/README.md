# fluxprotocol-client

> HTTP and WebSocket client for FLUX Protocol

## Install

```bash
npm install fluxprotocol-client
```

## HTTP Client

```typescript
import { FluxClient } from 'fluxprotocol-client';

const client = new FluxClient('http://localhost:3000');

// List available tools
const tools = await client.listTools();

// Call a tool
const weather = await client.call('weather.getWeather', { city: 'Tokyo' });
```

## WebSocket Client

```typescript
import { FluxWebSocketClient } from 'fluxprotocol-client';

const client = new FluxWebSocketClient('ws://localhost:3001/ws');
await client.connect();

const weather = await client.call('weather.getWeather', { city: 'Tokyo' });

client.close();
```

## Use with LangChain

```typescript
import { FluxClient } from 'fluxprotocol-client';
import { tool } from '@langchain/core/tools';

const flux = new FluxClient('http://localhost:3000');

const weatherTool = tool(
  async (input) => {
    return await flux.call('weather.getWeather', input);
  },
  { name: 'get_weather', description: 'Get weather for a city' }
);
```

## Related Packages

- `fluxprotocol-sdk` - Core SDK (for building connectors)
- `fluxprotocol-cli` - CLI tools

## License

MIT
