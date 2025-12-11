import { 
  connector, 
  method, 
  cache, 
  rateLimit, 
  retry, 
  config,
  FluxServer, 
  HttpTransport 
} from '../../packages/sdk/src/index.js';

// Example: API connector with all decorators
@connector('api')
@config({ 
  auth: { type: 'bearer', env: 'API_TOKEN' },
  timeout: 5000 
})
class ApiConnector {
  
  // Cached for 30 seconds, max 50 entries
  @method({ description: 'Get user by ID with caching' })
  @cache({ ttl: 30000, maxSize: 50 })
  async getUser(id: string) {
    console.log(`[Cache Miss] Fetching user ${id}`);
    // Simulate API call
    await new Promise(r => setTimeout(r, 100));
    return { id, name: `User ${id}`, email: `user${id}@example.com` };
  }

  // Rate limited: 5 requests per minute
  @method({ description: 'Search users with rate limiting' })
  @rateLimit({ requests: 5, window: '1m' })
  async searchUsers(query: string) {
    console.log(`[Rate Limited] Searching: ${query}`);
    return [
      { id: '1', name: 'Alice', match: 0.95 },
      { id: '2', name: 'Bob', match: 0.87 }
    ];
  }

  // Retry 3 times with exponential backoff
  @method({ description: 'Fetch data with retry' })
  @retry({ attempts: 3, backoff: 'exponential', delay: 500 })
  async fetchWithRetry(url: string) {
    console.log(`[Retry] Fetching: ${url}`);
    // Simulate occasional failures
    if (Math.random() < 0.3) {
      throw new Error('Random failure');
    }
    return { url, data: 'Success!' };
  }

  // Combined: cache + rate limit + retry
  @method({ description: 'Premium API endpoint' })
  @cache({ ttl: 60000 })
  @rateLimit({ requests: 10, window: '1m' })
  @retry({ attempts: 2, backoff: 'exponential' })
  async premiumEndpoint(resource: string) {
    console.log(`[Premium] Accessing: ${resource}`);
    await new Promise(r => setTimeout(r, 50));
    return { resource, premium: true, timestamp: Date.now() };
  }
}

// Start server
const server = new FluxServer(ApiConnector);
const transport = new HttpTransport(server, { port: 3000 });
server.setTransport(transport);
server.start();

console.log('\n🚀 Decorator Example Server Running!');
console.log('\nTest commands:');
console.log('  # Cache test (call twice, second is cached):');
console.log('  curl -X POST http://localhost:3000/flux/tools/api.getUser -d \'{"id":"123"}\'');
console.log('  curl -X POST http://localhost:3000/flux/tools/api.getUser -d \'{"id":"123"}\'');
console.log('\n  # Rate limit test (call 6 times quickly, 6th fails):');
console.log('  curl -X POST http://localhost:3000/flux/tools/api.searchUsers -d \'{"query":"test"}\'');
console.log('\n  # Retry test (may succeed or fail):');
console.log('  curl -X POST http://localhost:3000/flux/tools/api.fetchWithRetry -d \'{"url":"https://api.example.com"}\'');
