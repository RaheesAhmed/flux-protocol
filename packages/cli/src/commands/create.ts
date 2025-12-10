import { Command } from 'commander';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';

const TEMPLATE = `import { connector, method, FluxServer, StdioTransport } from '@flux/sdk';

@connector('{{name}}', { description: '{{name}} connector' })
class {{className}}Connector {
  @method({ description: 'Example method' })
  async getData(id: string): Promise<{ id: string; data: string }> {
    return { id, data: 'Hello from {{name}}!' };
  }
}

const server = new FluxServer({{className}}Connector);
const transport = new StdioTransport(server);
server.setTransport(transport);
server.start();
`;

const PACKAGE_TEMPLATE = `{
  "name": "{{name}}-connector",
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "start": "tsx index.ts",
    "dev": "tsx watch index.ts"
  },
  "dependencies": {
    "@flux/sdk": "latest"
  },
  "devDependencies": {
    "tsx": "^4.19.2",
    "@types/node": "^22.10.2"
  }
}
`;

function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

export const createCommand = new Command('create')
  .description('Create a new FLUX connector')
  .argument('<name>', 'Connector name')
  .option('-d, --dir <directory>', 'Output directory', '.')
  .action(async (name: string, options: { dir: string }) => {
    const spinner = ora(`Creating ${name} connector...`).start();

    try {
      const dir = join(options.dir, name);
      await mkdir(dir, { recursive: true });

      const className = toPascalCase(name);
      const indexContent = TEMPLATE
        .replace(/\{\{name\}\}/g, name)
        .replace(/\{\{className\}\}/g, className);

      const packageContent = PACKAGE_TEMPLATE.replace(/\{\{name\}\}/g, name);

      await writeFile(join(dir, 'index.ts'), indexContent);
      await writeFile(join(dir, 'package.json'), packageContent);

      spinner.succeed(chalk.green(`Created ${name} connector!`));
      console.log();
      console.log(chalk.dim('Next steps:'));
      console.log(chalk.cyan(`  cd ${name}`));
      console.log(chalk.cyan('  pnpm install'));
      console.log(chalk.cyan('  pnpm dev'));
    } catch (error) {
      spinner.fail(chalk.red('Failed to create connector'));
      console.error(error);
      process.exit(1);
    }
  });
