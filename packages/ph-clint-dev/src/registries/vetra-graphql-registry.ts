#!/usr/bin/env node
import { parseArgs } from 'node:util';
import {
  createGraphqlRegistryServer,
  detectCliName,
  formatStartupOutput,
} from './shared.js';

const { values } = parseArgs({
  options: {
    withAuth: { type: 'boolean', default: false },
    port: { type: 'string', default: '0' },
  },
});

const port = parseInt(values.port ?? '0', 10);
const withAuth = values.withAuth ?? false;
const envPrefix = detectCliName(process.cwd());
const { server, token } = createGraphqlRegistryServer({ port, withAuth });

server.listen(port, () => {
  const addr = server.address();
  const assignedPort = typeof addr === 'object' && addr ? addr.port : port;
  const url = `http://localhost:${assignedPort}`;
  console.log(formatStartupOutput('vetra-graphql', url, envPrefix, token));
});
