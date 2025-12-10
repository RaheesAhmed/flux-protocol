# fluxprotocol-cli

> CLI tools for FLUX Protocol connectors

## Install

```bash
npm install -g fluxprotocol-cli
```

## Commands

### Create a new connector

```bash
fluxprotocol-cli create my-connector
```

### Run in development mode

```bash
fluxprotocol-cli dev index.ts --port 3000
```

### Build for production

```bash
fluxprotocol-cli build index.ts --output dist
```

## Usage with npx

```bash
npx fluxprotocol-cli create weather
cd weather
npm install
npm run dev
```

## Related Packages

- `fluxprotocol-sdk` - Core SDK
- `fluxprotocol-client` - HTTP/WebSocket client

## License

MIT
