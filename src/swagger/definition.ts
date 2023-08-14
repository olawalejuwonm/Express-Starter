import path from 'path';
import fs from 'fs';
import swaggerJSDoc, { Options } from 'swagger-jsdoc';

const { version } = require('../../package.json');

// import { version } from '../../package.json';

const fullRoutedirs: string[] = [];

// console.log()

// fs.readdirSync(path.resolve(__dirname, '../routes')).forEach((file) => {
//     if (file.endsWith('.ts')) {
//         fullRoutedirs.push(path.resolve(__dirname, '../routes', file))
//     }
// })

// fs.readdirSync(path.resolve(__dirname, '../')).forEach((file) => {
//     if (file.endsWith('.ts')) {
//         fullRoutedirs.push(path.resolve(__dirname, '../routes', file))
//     }
// })

//TODO: work on look for
const getFullRoute = (dir: string, lookfor?: string) => {
  // resolve the path
  const resolvedPath = path.resolve(dir);
  // console.log(resolvedPath, 'resolvedPath');

  fs.readdirSync(resolvedPath).forEach((file) => {
    //check if it is a directory
    if (fs.lstatSync(path.resolve(resolvedPath, file)).isDirectory()) {
      // if it is a directory, call the function again
      getFullRoute(path.resolve(resolvedPath, file));
    } else {
      // if it is a file, push it to the array
      if (file.endsWith('.ts')) {
        fullRoutedirs.push(path.resolve(dir, file));
      }
    }
  });
};

getFullRoute(path.join(__dirname, '../'));

// console.log(fullRoutedirs, path.basename(__dirname));
const basePath = '/api/v1';
export const source: Options | undefined = {
  failOnErrors: true, // Whether or not to throw when parsing errors. Defaults to false.
  definition: {
    openapi: '3.0.2',
    info: {
      title: process.env.APP_NAME || "" + ' API',
      version,
      description: 'API for ' + process.env.APP_NAME || "",
    },
    basePath,
    externalDocs: {
      url: '/static/docs/',
      description: 'Find field info here',
    },
  },
  apis: [...fullRoutedirs],
};
const options = { ...source, swaggerDefinition: source };
// delete options.swaggerDefinition.apis;
const sjdocs = swaggerJSDoc(source) as any;

const pathWithBase: {
  [key: string]: string;
} = {};

Object.keys(sjdocs.paths).forEach((path: string) => {
  pathWithBase[basePath + path] = sjdocs.paths[path];
});

sjdocs.paths = pathWithBase;

export const rawSpec = sjdocs;

// console.log('rawSpec', rawSpec);
