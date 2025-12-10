import { Command } from 'commander';
import { spawn } from 'child_process';
import { resolve, dirname, basename } from 'path';
import chalk from 'chalk';
import ora from 'ora';

export const buildCommand = new Command('build')
  .description('Build connector for production')
  .argument('<file>', 'Connector file to build')
  .option('-o, --output <dir>', 'Output directory', 'dist')
  .option('--minify', 'Minify output', false)
  .action(async (file: string, options: { output: string; minify: boolean }) => {
    const spinner = ora('Building connector...').start();

    const filePath = resolve(file);
    const outputDir = resolve(options.output);
    const entryName = basename(file, '.ts');

    const args = [
      'tsup',
      filePath,
      '--format', 'esm',
      '--out-dir', outputDir,
      '--dts',
    ];

    if (options.minify) {
      args.push('--minify');
    }

    const child = spawn('npx', args, {
      stdio: 'pipe',
      shell: true,
      cwd: dirname(filePath),
    });

    let output = '';

    child.stdout?.on('data', (data) => {
      output += data.toString();
    });

    child.stderr?.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        spinner.succeed(chalk.green('Build complete!'));
        console.log(chalk.dim(`Output: ${outputDir}/${entryName}.js`));
      } else {
        spinner.fail(chalk.red('Build failed'));
        console.log(output);
        process.exit(1);
      }
    });

    child.on('error', (error) => {
      spinner.fail(chalk.red(`Build error: ${error.message}`));
      process.exit(1);
    });
  });
