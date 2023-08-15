import express, { Application, Request, Response } from 'express';
import 'express-async-errors';
import helmet from 'helmet';
import './config/connectDb';
import './environment';
import log from './logger';
import errorHandler from './middlewares/errorHandler';
import morgan from 'morgan';
import seed from './config/seeders/seed';
import router from './routes/v1';
import morganBody from 'morgan-body';
import swaggerUi from 'swagger-ui-express';

import cors from 'cors';
import { rawSpec } from './swagger/definition';

const listEndpoints = require('express-list-endpoints');

const app: Application = express();

app.use(cors());

seed();

app.use('/static', express.static('public'));
if (process.env.NODE_ENV !== 'production') {
  app.use(
    '/swagger',
    swaggerUi.serve,
    swaggerUi.setup(rawSpec, {
      explorer: true,
      // swaggerOptions: {
      // // add base ur
      // }
    }),
  );
}
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
});

app.use(morgan('combined'));
app.use(helmet()); // For security

app.use('/api/v1', router);

// const options = {
//   failOnErrors: true, // Whether or not to throw when parsing errors. Defaults to false.
//   definition: {
//     openapi: '3.0.0',
//     info: {
//       title: process.env.APP_NAME || "" + " API",
//       version: '1.0.0',
//     },
//   },
//   apis: ['./routes/*.ts'],
// };

// const options = {
//   ...source,
//   swaggerDefinition: source,
// };
// delete options?.swaggerDefinition?.apis;

// const test: swaggerUi.SwaggerUiOptions;
if (process.env.NODE_ENV !== 'production') {
  const routes = listEndpoints(app);
  app.get('/endpoints', (req: Request, res: Response) => {
    // const routes = expressListRoutes(app, { prefix: '/api/v1' });
    // console.log(routes, 'routes');
    // console.log(listEndpoints(app));

    // res.json(routes);
    res.setHeader('Content-Type', 'text/html');
    res.send(
      `
    <html>
    <p>API endpoints</p>
    <table><tbody>${routes.map(
      (route: { methods: any; path: any }) =>
        `<tr><td><strong>${route.methods.join()}</strong></td><td><a href=${
          route.path
        }>${route.path}</a></td></tr>`,
    )}</tbody></table> </html>`,
    );
  });
}

app.all('*', (req: Request, res: Response) => {
  res.status(404).json({
    message: 'Endpoint not found',
    error: ['endpoint does not exist'],
  });
});

app.use(errorHandler);

export default app;
