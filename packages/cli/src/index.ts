#!/usr/bin/env node
import { Command } from 'commander';
import { createCommand } from './commands/create.js';
import { devCommand } from './commands/dev.js';
import { buildCommand } from './commands/build.js';

const program = new Command();

program
  .name('flux')
  .description('FLUX SDK CLI - Universal AI Connectivity')
  .version('0.0.1');

program.addCommand(createCommand);
program.addCommand(devCommand);
program.addCommand(buildCommand);

program.parse();
