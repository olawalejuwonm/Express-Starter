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

app.use(`${process.env.BASE_PATH}`, router);
if (process.env.NODE_ENV !== 'production') {
  const routes = listEndpoints(app);

  // morgan Body don't log
  // morganBody(app, {
  //   skip: () => false,
  // });
  app.get('/endpoints', (req: Request, res: Response) => {
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
    '/swagger',
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
}

// render spec.json
app.get('/swagger.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(
    fs.readFileSync(path.resolve(__dirname, './swagger/spec.json'), 'utf8'),
  );
});

app.all('*', (req: Request, res: Response) => {
  res.status(404).json({
    message: 'Endpoint not found',
    error: ['endpoint does not exist'],
  });
});

app.use(errorHandler);

export default app;
