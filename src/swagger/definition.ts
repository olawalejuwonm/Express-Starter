import path from 'path';
import fs from 'fs';
import swaggerJSDoc, { Options } from 'swagger-jsdoc';
import { constructTemplate } from '../utilities/templates';

const { version } = require('../../package.json');

// getFullRoute(path.join(__dirname, '../'), '.ts');

console.log(__dirname, 'dirname');
// getFullRoute(__dirname, '.hbs');
// getFullRoute(path.join(__dirname, '/docs'), '.hbs');

const basePath = `${process.env.BASE_PATH}`;
//TODO: work on look for
const getFullRoute = (dir: string, format: string, lookfor?: string) => {
  // resolve the path
  const resolvedPath = path.resolve(dir);
  console.log(resolvedPath, 'resolvedPath');
  const fullRoutedirs: string[] = [];

  fs.readdirSync(resolvedPath).forEach((file) => {
    //check if it is a directory
    if (fs.lstatSync(path.resolve(resolvedPath, file)).isDirectory()) {
      // if it is a directory, call the function again
      getFullRoute(path.resolve(resolvedPath, file), format);
    } else {
      // if it is a file, push it to the array
      if (file.endsWith(format)) {
        fullRoutedirs.push(path.resolve(dir, file));
      }
    }
  });

  return fullRoutedirs;
};
const getRawSpec = (dir: string, format: string, lookfor?: string) => {
  const fullRoutedirs = getFullRoute(dir, format);
  const source: Options | undefined = {
    failOnErrors: true, // Whether or not to throw when parsing errors. Defaults to false.
    definition: {
      openapi: '3.0.3',
      info: {
        title: process.env.APP_NAME + ' API',
        version,
        description: 'API for ' + process.env.APP_NAME,
      },
      consumes: ['application/json'],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
        schemas: {
          GeneralBody: {
            type: 'object',
            // additionalProperties: true,
          },
          QueryParams: {
            type: 'object',
          },
          ApiResponse: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
              },
              data: {
                type: 'object',
              },
            },
          },
        },
      },
      // basePath,
      externalDocs: {
        url: '/static/docs/',
        description: 'Find field info here',
      },
    },

    apis: [...fullRoutedirs],
  };

  // console.log(fullRoutedirs, 'fullRoutedirs');

  const sjdocs = swaggerJSDoc(source) as any;

  const pathWithBase: {
    [key: string]: string;
  } = {};

  Object.keys(sjdocs.paths).forEach((path: string) => {
    pathWithBase[basePath + path] = sjdocs.paths[path];
  });

  sjdocs.paths = pathWithBase;

  const rawSpec = sjdocs;
  return rawSpec;
};

const writeToFile = (content: string, filePath: string, overwrite: boolean = true) => {
  try {
    if (content === '') {
      console.log('content is empty' + filePath);
      return;
    }
    // console.log(filePath, 'filePath', content, 'content');
    // check if file exists
    if (!fs.existsSync(filePath)) {
      // if it doesn't exist, create the directory and the file
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }
    // else {
    //   // if it exists, delete the file
    //   fs.unlinkSync(filePath);
    // }
    const fd = fs.openSync(filePath, 'w');
    fs.writeFileSync(fd, content, {
      encoding: null,
      // append or overwrite
      flag: overwrite ? 'w' : 'a',
    });
    fs.closeSync(fd);
    // fs.writeFileSync(filePath, content, { flag: 'w' });
    if (process.env.NODE_ENV === 'production') {
      console.log('file written', filePath);
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      throw err;
    }
    console.log(err);
  }
};

const postTemplate = path.join(__dirname, 'templates/post.hbs');
const getTemplate = path.join(__dirname, 'templates/get.hbs');
const putTemplate = path.join(__dirname, 'templates/put.hbs');
const deleteTemplate = path.join(__dirname, 'templates/delete.hbs');

const paramTemplate = path.join(__dirname, 'templates/param.hbs');
const queryTemplate = path.join(__dirname, 'templates/query.hbs');

export const endpointSpec = (
  endpoints: {
    path: string;
    methods: string[];
    middlewares: string[];
  }[],
) => {
  // Create a paths.ts file in the directory of this file (If it doesn't exist)
  // fs.writeFileSync(
  //   path.join(__dirname, 'spec.json'),
  //   JSON.stringify(rawSpec),
  // );
  let i = 0;
  let max = 25;
  const docsPath = path.join(__dirname, 'docs');
  // delete all files in the docs folder if it exists
  if (fs.existsSync(docsPath)) {
    fs.rmSync(docsPath, { recursive: true });
  }
  for (const endpoint of endpoints) {
    // console.log(endpoint, 'endpoint');
    const methods = endpoint.methods;
    const endpointpath = endpoint.path;
    // url is the remaining part after basePath
    let url = endpointpath.replace(basePath, '');
    // name is string after the first slash
    const name = url.split('/')[1];
    // console.log(name, 'name');
    // check if url has params
    const params = url.match(/\/:[a-zA-Z]+/g);
    // console.log(params, 'params');
    let paramDocs = '';
    if (params) {
      // if it has params, replace them with curly braces
      paramDocs = ' *     parameters:'
      params.forEach((param) => {
        url = url.replace(param, '/{' + param.replace('/:', '') + '}');
        const paramTemp = constructTemplate(paramTemplate, {
          pname: param.replace('/:', ''),
        });
        paramDocs += paramTemp;
      });
    }
    // escape if name doesn't start with an alphabet or doesn't end with an alphabet
    if (!name.match(/^[a-zA-Z]+/) || !name.match(/[a-zA-Z]+$/g)) {
      continue;
    }
    let compiledDocs = '';
    for (const method of methods) {
      // console.log(method, 'method');
      if (method === 'POST') {
        const postTemp = constructTemplate(postTemplate, {
          name,
          url,
          paramDocs,
        });

        // console.log(postTemp, 'postTemp');
        compiledDocs += postTemp;
      }
      if (method === 'GET') {
        if (paramDocs === '') {
          paramDocs = ' *     parameters:'
        }
        paramDocs += constructTemplate(queryTemplate, {}) 
        const getTemp = constructTemplate(getTemplate, {
          name,
          url,
          paramDocs,
        });
        compiledDocs += getTemp;
      }
      if (method === 'PUT') {
        const putTemp = constructTemplate(putTemplate, {
          name,
          url,
          paramDocs,
        });
        compiledDocs += putTemp;
      }
      if (method === 'DELETE') {
        const deleteTemp = constructTemplate(deleteTemplate, {
          name,
          url,
          paramDocs,
        });
        compiledDocs += deleteTemp;
      }
    }
    const filePath = path.join(__dirname, 'docs', `${i + name}.hbs`);
    writeToFile(compiledDocs, filePath);
    i++;
    if (i === max) {
      // break;
    }
  }

  const rawSpec = getRawSpec(path.join(__dirname, './docs'), '.hbs');
  fs.writeFileSync(path.join(__dirname, 'spec.json'), JSON.stringify(rawSpec));
  return rawSpec;
};
