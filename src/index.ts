import 'reflect-metadata';
import 'express-async-errors';
import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import './config/connectDb';
import './environment';
import errorHandler from './middlewares/errorHandler';
import morgan from 'morgan';
import seed from './config/seeders/seed';
import router from './routes/v1';
import morganBody from 'morgan-body';
import swaggerUi from 'swagger-ui-express';
import cors from 'cors';
import { endpointSpec } from './swagger/definition';
import * as fs from 'fs';
import * as path from 'path';
import mongoose from 'mongoose';
import { ip, ipv6 } from 'address';

const listEndpoints = require('express-list-endpoints');

const app: Application = express();

app.use(cors());

seed();

app.use('/static', express.static('public'));

app.use(express.json());

app.use(
  express.urlencoded({
    limit: '5mb',
    extended: true,
  }),
);

morganBody(app, {
  logResponseBody: false,
  immediateReqLog: true,
  // logAllReqHeader: true,
  timezone: 'Africa/Lagos',
  prettify: true,
});

app.use(morgan('combined'));
app.use(helmet()); // For security

app.use('/api/v1', router);

const isProd = process.env.NODE_ENV !== 'development';
const routes = listEndpoints(app);
const swaggerPath = isProd ? '/swagger-prod' : '/swagger';
const endpointPath = isProd ? '/endpoints-prod' : '/endpoints';
// morgan Body don't log
// morganBody(app, {
//   skip: () => false,
// });
app.get(endpointPath, (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <html>
    <p>API endpoints</p>
    <table><tbody>${routes.map(
      (route: { methods: any; path: any }) =>
        `<tr><td><strong>${route.methods.join()}</strong></td><td>${
          route.path
        }</td></tr>`,
    )}</tbody></table> </html>`);
});
app.use(
  swaggerPath,
  swaggerUi.serve,
  swaggerUi.setup(endpointSpec(routes), {
    explorer: true,
    swaggerOptions: {
      // https://github.com/swagger-api/swagger-ui/blob/master/docs/usage/configuration.md
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
      persistAuthorization: true,
      // deepLinking: true,
      docExpansion: 'none',
      // maxDisplayedTags: 5,
    },
  }),
);

// render spec.json
app.get('/swagger.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(
    fs.readFileSync(path.resolve(__dirname, './swagger/spec.json'), 'utf8'),
  );
});
const healthCheck = () => {
  const state = mongoose.connection.readyState;
  let connectionStatus;
  switch (state) {
    case 0:
      connectionStatus = 'disconnected';
      break;
    case 1:
      connectionStatus = 'connected';
      break;
    case 2:
      connectionStatus = 'connecting';
      break;
    case 3:
      connectionStatus = 'disconnecting';
      break;
    case 99:
      connectionStatus = 'uninitialized';
    default:
      connectionStatus = 'unknown';
      break;
  }
  return {
    status: 'ok',
    message: 'Server is running',
    database: {
      status: connectionStatus,
    },
    ip: {
      ipv4: ip(),
      ipv6: ipv6(),
    },
    documentationUrl: '/static/docs/',
  };
};

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json(healthCheck());
});

app.all('*', (req: Request, res: Response) => {
  res.status(404).json({
    message: 'Endpoint not found',
    data: healthCheck(),
  });
});

app.use(errorHandler);

export default app;
