# FLUX SDK - LLM Reference Guide

> This document contains everything an AI needs to generate FLUX connectors correctly.

## Core Concepts

FLUX SDK uses TypeScript decorators to create AI-compatible connectors with zero boilerplate.

**Key Principle:** Write business logic only. FLUX handles protocols, schemas, and deployment.

---

## Required Imports

```typescript
import { connector, method, FluxServer, StdioTransport } from 'fluxprotocol-sdk';
// Optional transports:
import { HttpTransport, WebSocketTransport } from 'fluxprotocol-sdk';
```

---

## Decorator Syntax

### @connector(name, options?)

Class decorator that registers a connector.

```typescript
@connector('my-connector')
class MyConnector { }

// With options:
@connector('my-connector', {
  version: '1.0.0',
  description: 'My awesome connector'
})
class MyConnector { }
```

**Rules:**
- `name` must be lowercase with hyphens (e.g., `weather`, `github-api`)
- Class name should be PascalCase + "Connector" suffix
- One connector per file recommended

### @method(options?)

Method decorator that exposes a function as a tool.

```typescript
@method()
async getData(id: string): Promise<DataType> { }

// With options:
@method({ description: 'Get data by ID' })
async getData(id: string): Promise<DataType> { }
```

**Rules:**
- Methods must be `async` and return `Promise<T>`
- Use explicit TypeScript types for parameters and return values
- Method name becomes the tool name (e.g., `connector.methodName`)

---

## Complete Connector Template

```typescript
import { connector, method, FluxServer, StdioTransport } from 'fluxprotocol-sdk';

// Define types for your data
interface WeatherData {
  city: string;
  temperature: number;
  description: string;
}

// Define the connector
@connector('weather', { description: 'Weather information service' })
class WeatherConnector {

  @method({ description: 'Get current weather for a city' })
  async getWeather(city: string): Promise<WeatherData> {
    // Your business logic here
    const response = await fetch(`https://api.weather.com/v1/${city}`);
    return response.json();
  }

  @method({ description: 'Get 5-day forecast' })
  async getForecast(city: string, days: number = 5): Promise<WeatherData[]> {
    const response = await fetch(`https://api.weather.com/v1/${city}/forecast?days=${days}`);
    return response.json();
  }
}

// Start the server (choose ONE transport)
const server = new FluxServer(WeatherConnector);
const transport = new StdioTransport(server);
server.setTransport(transport);
server.start();
```

---

## Transport Options

### StdioTransport (MCP Compatible)

For Claude Desktop and MCP clients:

```typescript
const server = new FluxServer(MyConnector);
const transport = new StdioTransport(server);
server.setTransport(transport);
server.start();
```

### HttpTransport (REST API)

For HTTP/REST clients:

```typescript
const server = new FluxServer(MyConnector);
const transport = new HttpTransport(server, {
  port: 3000,       // Default: 3000
  cors: true,       // Default: true
  prefix: '/flux'   // Default: '/flux'
});
server.setTransport(transport);
server.start();
```

**Endpoints generated:**
- `GET /flux/tools` - List all tools
- `POST /flux/tools/:name` - Call a tool

**TOON Format Support:**
- Send `Accept: application/toon` header for 40% fewer tokens
- Default: `application/json`

### WebSocketTransport (Real-time)

For real-time applications:

```typescript
const server = new FluxServer(MyConnector);
const transport = new WebSocketTransport(server, {
  port: 3001,    // Default: 3001
  path: '/ws'    // Default: '/ws'
});
server.setTransport(transport);
server.start();
```

---

## Production Decorators

FLUX provides production-ready decorators for common patterns:

### @cache(options)

Caches method results with LRU eviction and TTL:

```typescript
import { cache } from 'fluxprotocol-sdk';

@method()
@cache({ ttl: 60000, maxSize: 100 })  // Cache for 1 minute, max 100 entries
async getUser(id: string): Promise<User> {
  return await fetchUser(id);
}

// Custom cache key function
@cache({ ttl: 30000, key: (id, opts) => `${id}-${opts.version}` })
async getData(id: string, opts: Options): Promise<Data> { }
```

**Options:**
- `ttl`: Time-to-live in milliseconds (default: 60000)
- `maxSize`: Maximum cache entries (default: 100)
- `key`: Custom function to generate cache key

### @rateLimit(options)

Token bucket rate limiting:

```typescript
import { rateLimit, RateLimitExceededError } from 'fluxprotocol-sdk';

@method()
@rateLimit({ requests: 100, window: '1m' })  // 100 requests per minute
async searchUsers(query: string): Promise<User[]> { }

// Window formats: '100ms', '10s', '1m', '1h' or number in ms
@rateLimit({ requests: 10, window: 60000 })  // Same as '1m'
async limitedMethod(): Promise<void> { }

// Per-key rate limiting
@rateLimit({ requests: 5, window: '1m', key: (userId) => userId })
async userAction(userId: string): Promise<void> { }
```

**Options:**
- `requests`: Maximum requests allowed in window
- `window`: Time window (ms or string: '100ms', '10s', '1m', '1h')
- `key`: 'global' | 'method' | custom function

### @retry(options)

Automatic retry with backoff strategies:

```typescript
import { retry } from 'fluxprotocol-sdk';

@method()
@retry({ attempts: 3, backoff: 'exponential' })  // Retry 3 times with exponential backoff
async fetchExternalApi(): Promise<Data> { }

// Linear backoff
@retry({ attempts: 5, backoff: 'linear', delay: 500 })
async unreliableMethod(): Promise<Data> { }

// Conditional retry
@retry({ 
  attempts: 3, 
  retryOn: (error) => error.message.includes('timeout') 
})
async conditionalRetry(): Promise<Data> { }
```

**Options:**
- `attempts`: Maximum retry attempts (default: 3)
- `backoff`: 'fixed' | 'exponential' | 'linear' (default: 'exponential')
- `delay`: Base delay in ms (default: 1000)
- `maxDelay`: Maximum delay in ms (default: 30000)
- `retryOn`: Function to determine if error should trigger retry

### @config(options)

Authentication and environment configuration:

```typescript
import { config, getAuthHeader } from 'fluxprotocol-sdk';

@connector('github')
@config({
  auth: { type: 'bearer', env: 'GITHUB_TOKEN' }
})
class GitHubConnector {
  @method()
  async getRepo(owner: string, repo: string) {
    const headers = getAuthHeader(this);  // { Authorization: 'Bearer ...' }
    return fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  }
}

// API key authentication
@config({ auth: { type: 'api_key', env: 'API_KEY', header: 'X-API-Key' } })
class ApiConnector { }

// Environment variable mapping
@config({ env: { dbUrl: 'DATABASE_URL', apiKey: 'API_KEY' } })
class ConfiguredConnector { }
```

**Auth Types:**
- `'none'`: No authentication
- `'api_key'`: Raw API key in header
- `'bearer'`: Bearer token authentication
- `'basic'`: Basic auth (base64 encoded)

### Combining Decorators

Decorators can be stacked for production-ready methods:

```typescript
@connector('api')
@config({ auth: { type: 'bearer', env: 'API_TOKEN' } })
class ApiConnector {
  @method({ description: 'Fetch data with caching and retries' })
  @cache({ ttl: 60000 })
  @rateLimit({ requests: 100, window: '1m' })
  @retry({ attempts: 3, backoff: 'exponential' })
  async fetchData(id: string): Promise<Data> {
    // Business logic only - caching, rate limiting, and retries handled automatically
    return await this.callExternalApi(id);
  }
}
```

---

## Type Rules

### Parameter Types

Always use explicit TypeScript types:

```typescript
// ✅ Correct
async search(query: string, limit: number): Promise<Result[]>

// ❌ Wrong - no types
async search(query, limit)

// ❌ Wrong - 'any' type
async search(query: any): Promise<any>
```

### Supported Types

| TypeScript | JSON Schema |
|------------|-------------|
| `string` | `"type": "string"` |
| `number` | `"type": "number"` |
| `boolean` | `"type": "boolean"` |
| `string[]` | `"type": "array"` |
| `object` | `"type": "object"` |

### Interface Definitions

Define interfaces for complex return types:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

@method()
async getUser(id: string): Promise<User> { }
```

---

## Error Handling

Throw errors for invalid inputs:

```typescript
@method()
async getUser(id: string): Promise<User> {
  if (!id) {
    throw new Error('User ID is required');
  }
  
  const user = await this.fetchUser(id);
  
  if (!user) {
    throw new Error(`User not found: ${id}`);
  }
  
  return user;
}
```

---

## Environment Variables

Access environment variables for API keys:

```typescript
@connector('github')
class GitHubConnector {
  private token = process.env.GITHUB_TOKEN;

  @method()
  async getRepo(owner: string, repo: string) {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { Authorization: `token ${this.token}` }
    });
    return response.json();
  }
}
```

---

## Common Patterns

### Database Connector

```typescript
@connector('database')
class DatabaseConnector {
  @method({ description: 'Query database' })
  async query(sql: string): Promise<Record<string, unknown>[]> {
    // Execute SQL and return results
  }

  @method({ description: 'Insert record' })
  async insert(table: string, data: Record<string, unknown>): Promise<{ id: string }> {
    // Insert and return ID
  }
}
```

### API Wrapper

```typescript
@connector('stripe')
class StripeConnector {
  @method({ description: 'Create payment intent' })
  async createPayment(amount: number, currency: string): Promise<PaymentIntent> { }

  @method({ description: 'List customers' })
  async listCustomers(limit: number = 10): Promise<Customer[]> { }
}
```

### File System

```typescript
@connector('filesystem')
class FileSystemConnector {
  @method({ description: 'Read file contents' })
  async readFile(path: string): Promise<string> {
    const fs = await import('fs/promises');
    return fs.readFile(path, 'utf-8');
  }

  @method({ description: 'List directory' })
  async listDir(path: string): Promise<string[]> {
    const fs = await import('fs/promises');
    return fs.readdir(path);
  }
}
```

---

## Checklist for AI

Before generating a connector, verify:

1. ✅ Import statement includes `connector`, `method`, `FluxServer`, and a transport
2. ✅ `@connector` decorator has a lowercase hyphenated name
3. ✅ Class name is PascalCase with "Connector" suffix
4. ✅ All methods have `@method()` decorator
5. ✅ All methods are `async` and return `Promise<T>`
6. ✅ All parameters have explicit TypeScript types
7. ✅ Complex return types have interface definitions
8. ✅ Server initialization follows the 4-line pattern
9. ✅ Environment variables used for secrets (not hardcoded)
10. ✅ Error handling uses `throw new Error()`

---

## File Structure

```
my-connector/
├── index.ts        # Main connector file
├── package.json    # Dependencies
└── tsconfig.json   # TypeScript config (optional)
```

**package.json:**
```json
{
  "name": "my-connector",
  "type": "module",
  "scripts": {
    "start": "tsx index.ts",
    "dev": "tsx watch index.ts"
  },
  "dependencies": {
    "fluxprotocol-sdk": "latest"
  },
  "devDependencies": {
    "tsx": "^4.19.2"
  }
}
```

---

## Anti-Patterns (DO NOT DO)

```typescript
// ❌ Missing @method decorator
async getData() { }

// ❌ Non-async method
@method()
getData(): string { }

// ❌ Missing return type
@method()
async getData() { }

// ❌ Hardcoded secrets
const API_KEY = 'sk_live_xxx';

// ❌ Multiple connectors in one file
@connector('one') class One { }
@connector('two') class Two { }
```

---

## JSON-RPC Protocol (For Reference)

FLUX uses JSON-RPC 2.0 over STDIO:

**List tools:**
```json
{"jsonrpc":"2.0","id":1,"method":"tools/list"}
```

**Call tool:**
```json
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"weather.getWeather","arguments":{"city":"Tokyo"}}}
```

**Response:**
```json
{"jsonrpc":"2.0","id":2,"result":{"content":[{"type":"text","text":"{\"city\":\"Tokyo\",\"temperature\":22}"}]}}
```
