import { connector, method, FluxServer, StdioTransport } from 'fluxprotocol-sdk';

@connector('test-connector', { description: 'test-connector connector' })
class TestConnectorConnector {
  @method({ description: 'Example method' })
  async getData(id: string): Promise<{ id: string; data: string }> {
    return { id, data: 'Hello from test-connector!' };
  }
}

const server = new FluxServer(TestConnectorConnector);
const transport = new StdioTransport(server);
server.setTransport(transport);
server.start();
