import { Command } from 'commander';
import { spawn, type ChildProcess } from 'child_process';
import { watch } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';

export const devCommand = new Command('dev')
  .description('Run connector in development mode with hot reload')
  .argument('<file>', 'Connector file to run')
  .option('-p, --port <port>', 'HTTP port', '3000')
  .action(async (file: string, options: { port: string }) => {
    const filePath = resolve(file);
    let childProcess: ChildProcess | null = null;

    const startProcess = () => {
      if (childProcess) {
        childProcess.kill();
      }

      console.log(chalk.cyan(`\n🚀 Starting ${file}...`));

      childProcess = spawn('npx', ['tsx', filePath], {
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, FLUX_PORT: options.port },
      });

      childProcess.on('error', (error) => {
        console.error(chalk.red(`Error: ${error.message}`));
      });
    };

    startProcess();

    const watcher = watch(filePath, (eventType) => {
      if (eventType === 'change') {
        console.log(chalk.yellow('\n📦 File changed, restarting...'));
        startProcess();
      }
    });

    process.on('SIGINT', () => {
      console.log(chalk.dim('\n\nShutting down...'));
      watcher.close();
      if (childProcess) {
        childProcess.kill();
      }
      process.exit(0);
    });
  });
