#!/usr/bin/env node

/**
 * Module dependencies.
 */

import debugServer from 'debug';
import { createServer } from 'http';
import app from '../index';

const debug = debugServer(process.env.APP_NAME + ':server');

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val: string) {
  const theport = parseInt(val, 10);

  if (Number.isNaN(theport)) {
    // named pipe
    return val;
  }

  if (theport >= 0) {
    // port number
    return theport;
  }

  return false;
}

/**
 * Get port from environment and store in Express.
 */
// get port from command line flag if present --port 3000
const argv = require('minimist')(process.argv.slice(2));
const port = normalizePort(argv.port || process.env.PORT || '3000')
app.set('port', port);

/**
 * Create HTTP server.
 */

const server = createServer(app);

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: { syscall: string; code: any; }) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr?.port}`;
  debug(`Listening on ${bind}`);
  console.log(`Listening on ${bind}`);
  // console a clickable localhost link to the server on the terminal
  console.log(`http://localhost:${port}/static/docs/`);
}

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
