// Test the published fluxprotocol-sdk from npm
import { connector, method, FluxServer, HttpTransport } from 'fluxprotocol-sdk';

@connector('greeting')
class GreetingConnector {
  @method()
  sayHello(name: string) {
    return { message: `Hello, ${name}!`, time: new Date().toISOString() };
  }
}

const server = new FluxServer(GreetingConnector);
const transport = new HttpTransport(server, { port: 4000 });
server.setTransport(transport);
server.start();

console.log('✅ NPM Package Test - Server running on http://localhost:4000');
