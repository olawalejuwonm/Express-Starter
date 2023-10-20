import path from 'path';
import fs from 'fs';
import swaggerJSDoc, { Options } from 'swagger-jsdoc';
import { constructTemplate } from '../utilities/templates';
import { IADoc, IDocs, IMethod } from '../utilities/templates/types';
const { version } = require('../../package.json');

//TODO: work on look for
const getFullRoute = (
  dir: string,
  format: string,
  startWith: string[] = [],
  lookfor?: string,
) => {
  // resolve the path
  const resolvedPath = path.resolve(dir);
  const fullRoutedirs = startWith;
  if (!fs.existsSync(resolvedPath)) {
    console.log('Directory not found');
    return fullRoutedirs;
  }

  fs.readdirSync(resolvedPath).forEach((file) => {
    //check if it is a directory
    if (fs.lstatSync(path.resolve(resolvedPath, file)).isDirectory()) {
      // if it is a directory, call the function again
      return getFullRoute(
        path.resolve(resolvedPath, file),
        format,
        fullRoutedirs,
      );
      // return [...getFullRoute(path.resolve(resolvedPath, file), format), ...fullRoutedirs];
    } else {
      // if it is a file, push it to the array
      // console.log(file, 'file', format, 'format', file.endsWith(format));
      if (file.endsWith(format)) {
        fullRoutedirs.push(path.resolve(dir, file));
      }
    }
  });

  return fullRoutedirs;
};

// Iterate DTO and get all properties
const gernerateDTOSchema = (ALLDTO: any) => {
  const schemas: any = {};
  for (const name in ALLDTO) {
    const DTO = ALLDTO[name];
    for (const key in DTO as any) {
      try {
        let arrays: string[] = [];
        let a = new DTO[key]();
        let array = Object.getOwnPropertyNames(a);
        // values
        arrays = [...arrays, ...array];
        let properties: any = {};
        arrays.forEach((key) => {
          properties[key] = {
            type: 'any',
            // default: ''
          };
        });

        // schemas[name?.toUpperCase() + '-' + key] = {
        //   type: 'object',
        //   properties,
        // };
        schemas[key] = {
          type: 'object',
          properties,
        };
      } catch (e) {
        // console.log(e);
      }
    }
  }
  return schemas;
};

// function that import files dynamically
function importEsALL(paths: string[]) {
  // console.log(paths, 'paths');
  let allFiles: any = {};
  try {
    paths.map(async (fileName) => {
      let fileResolved = path.resolve(fileName);

      const module = require(fileResolved);
      // console.log(module, 'module');

      const resolvedname = fileResolved.split('dto.ts')[0];

      // const path1 =
      //   'C:\\Users\\USER\\Documents\\Github\\Cephas\\HR-CORE-API\\src\\features\\tool\\';
      // const path2 = '/app/src/features/tool/';

      const regex = /([a-zA-Z]+)\/?$/;
      const match = regex.exec(resolvedname);
      let name = match?.[1] ?? '';
      if (name === '') {
        const regex = /([a-zA-Z]+)\\?$/;
        const match = regex.exec(resolvedname);
        name = match?.[1] ?? '';
      }
      // console.log(name, 'name');
      allFiles[name] = module;
    });
  } catch (e) {
    // console.log(e);
    // is not a directory
    // allFiles = [importPath];
  }

  return allFiles;
}

const featuresPath = path.join(__dirname, '../features');
console.log(featuresPath, 'featuresPath');

const dtoPattern = 'dto.ts';

const basePath = `${process.env.BASE_PATH}`;
const dtoFiles = getFullRoute(featuresPath, dtoPattern);

const importedDTO = importEsALL(dtoFiles);

const getRawSpec = (dir: string, format: string, lookfor?: string) => {
  const fullRoutedirs = getFullRoute(dir, format);

  const schemas = gernerateDTOSchema(importedDTO);

  const components = {
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
      ...schemas,
    },
  };
  const source: Options | undefined = {
    failOnErrors: true, // Whether or not to throw when parsing errors. Defaults to false.
    definition: {
      openapi: '3.1.0',
      info: {
        title: process.env.APP_NAME + ' API',
        version,
        description: 'API for ' + process.env.APP_NAME,
      },
      consumes: [
        'application/json',
        'multipart/form-data',
        'application/x-www-form-urlencoded',
      ],
      // components,
      // basePath,
      externalDocs: {
        url: '/static/docs/',
        description: 'Find field info here',
      },
    },

    apis: [...fullRoutedirs],
  };

  const sjdocs = swaggerJSDoc(source) as any;

  const pathWithBase: {
    [key: string]: string;
  } = {};

  Object.keys(sjdocs.paths).forEach((path: string) => {
    pathWithBase[basePath + path] = sjdocs.paths[path];
  });

  sjdocs.paths = pathWithBase;
  sjdocs.components = components;

  const rawSpec = sjdocs;
  return rawSpec;
};

const writeToFile = (
  content: string,
  filePath: string,
  overwrite: boolean = true,
) => {
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
let compiledHeader: string;
let headerTemplate = '';

headerTemplate = path.join(__dirname, 'templates/header.hbs');
// if header template exists, compile it
if (fs.existsSync(headerTemplate)) {
  compiledHeader = constructTemplate(headerTemplate, {});
}

function convertToSingleLineString(multilineText: string = '') {
  // Replace newlines with \r\n and escape double quotes
  const singleLineText = multilineText
    .replace(/"/g, '\\"') // Escape double quotes
    .replace(/\n/g, '\\n\r\\n') // Replace newlines with \n\r\n
    .replace(/\s+/g, ' ');     // ensure that every thing is in one line

  // Wrap the resulting text in double quotes
  return `"${singleLineText}"`;
}



const docGen = (docs: IADoc) => {
  if (docs?.description || docs?.schema) {
    // docs.description = (docs?.description || '')
    //   // .replace(/"/g, '`')
    //   .replace(/\n/g, '')
    //   .replace(/\s+/g, ' ');
    docs.description = convertToSingleLineString(docs?.description);
    // docs.description = formatScatteredTextForSwagger(docs?.description);
    docs.description = docs?.description || '';
    docs.schema = docs?.schema || 'GeneralBody';
  } else {
    docs.description = '';
    docs.schema = 'GeneralBody';
  }
  return docs;
};

const write = true;

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
  const docsPath = path.join(__dirname, 'docs');

  // delete all files in the docs folder if it exists
  if (write)
    if (fs.existsSync(docsPath)) {
      try {
        fs.rmSync(docsPath, { recursive: true });
      } catch (error) {
        console.log(error);
      }
    }
  for (const endpoint of endpoints) {
    // console.log(endpoint, 'endpoint');
    const methods = endpoint.methods;
    const endpointpath = endpoint.path;
    // url is the remaining part after basePath
    let url = endpointpath.replace(basePath, '');
    let endUrl = url;
    // name is string after the first slash
    const name = url.split('/')[1];
    // console.log(name, 'name');
    // check if url has params
    const params = url.match(/\/:[a-zA-Z]+/g);
    // console.log(params, 'params');
    let paramDocs = '';
    if (params) {
      // if it has params, replace them with curly braces
      paramDocs = ' *     parameters:';
      params.forEach((param) => {
        url = url.replace(param, '/{' + param.replace('/:', '') + '}');
        const paramTemp = constructTemplate(paramTemplate, {
          pname: param.replace('/:', ''),
        });
        paramDocs += paramTemp;
      });
    }
    if (compiledHeader) {
      // console.log('compiledHeader', compiledHeader);
      if (paramDocs === '') {
        paramDocs = ' *     parameters:';
      }
      paramDocs += compiledHeader;
    }
    // escape if name doesn't start with an alphabet or doesn't end with an alphabet
    if (!name.match(/^[a-zA-Z]+/) || !name.match(/[a-zA-Z]+$/g)) {
      continue;
    }
    let compiledDocs = '';
    for (const method of methods) {
      // console.log(method, 'method');
      // Remove name from url
      const opath = endUrl.replace('/' + name, '');
      let docs =
        importedDTO[name]?.docs?.[opath || '/']?.[
          method?.toLocaleUpperCase()
        ] || {};
      docs = docGen(docs);

      if (method === IMethod.POST) {
        // console.log(endpoint.path, opath, 'url', docs, importedDTO[name], importedDTO[name]?.docs?.[opath || '/']?.[
        //   method?.toLocaleUpperCase()
        // ]);
        const postTemp = constructTemplate(postTemplate, {
          name,
          url,
          paramDocs,
          ...docs,
        });

        compiledDocs += postTemp;
      }
      if (method === IMethod.GET) {
        if (paramDocs === '') {
          paramDocs = ' *     parameters:';
        }
        paramDocs += constructTemplate(queryTemplate, {});

        const getTemp = constructTemplate(getTemplate, {
          name,
          url,
          paramDocs,
          ...docs,
        });
        compiledDocs += getTemp;
        paramDocs = '';
      }
      if (method === IMethod.PUT) {
        // console.log(endpoint.path, opath, 'url');
        const putTemp = constructTemplate(putTemplate, {
          name,
          url,
          paramDocs,
          ...docs,
        });
        compiledDocs += putTemp;
      }
      if (method === IMethod.DELETE) {
        const deleteTemp = constructTemplate(deleteTemplate, {
          name,
          url,
          paramDocs,
          ...docs,
        });
        compiledDocs += deleteTemp;
      }
      i++;
    }
    const filePath = path.join(__dirname, 'docs', `${i + name}.hbs`);
    if (write) writeToFile(compiledDocs, filePath);
  }

  console.log(`Total endpoints: ${i}`);

  const rawSpec = getRawSpec(path.join(__dirname, './docs'), '.hbs');
  fs.writeFileSync(path.join(__dirname, 'spec.json'), JSON.stringify(rawSpec));
  return rawSpec;
};
