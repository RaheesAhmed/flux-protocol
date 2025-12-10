# fluxprotocol-client

> HTTP and WebSocket client for FLUX Protocol. **Supports TOON format for 40% fewer tokens.**

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

## TOON Format (40% Fewer Tokens)

```typescript
const client = new FluxClient('http://localhost:3000');

// Enable TOON format for token efficiency
const tools = await client.useToon().listTools();
const weather = await client.useToon().call('weather.getWeather', { city: 'Tokyo' });

// Switch back to JSON
const result = await client.useJson().call('data.query', { sql: 'SELECT *' });
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
    return await flux.useToon().call('weather.getWeather', input);
  },
  { name: 'get_weather', description: 'Get weather for a city' }
);
```

## Related Packages

- `fluxprotocol-sdk` - Core SDK (for building connectors)
- `fluxprotocol-cli` - CLI tools

## License

MIT

