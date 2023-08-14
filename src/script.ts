// Script for form value pairs to be sent to the server
import mongoose from 'mongoose';
// import clipboard from 'clipboardy';
import fs from 'fs';
import path from 'path';
import { faker } from '@faker-js/faker';
import axios from 'axios';

async function importEsALL(importPath: string) {
  console.log(importPath, 'importPath');

  let allFiles;
  try {
    allFiles = fs.readdirSync(importPath);
  } catch (e) {
    // is not a directory
    allFiles = [importPath];
  }

  allFiles
    .filter((fileName) => fileName.match(/\.ts$/))
    .map((fileName) => {
      return import(path.join(importPath, fileName));
    })
    .filter(async (m, i) => {
      try {
        const module = await m;
        if (module.default) {
        }

        return module;
      } catch (e) {
        console.log(e);
        return undefined;
      }
    });
}

const validForm = (model: any, formA: any) => {
  const schema = model.schema.paths;
  const form: any = {};
  const assignReq = (key: string, source: string) => {
    // check if key is in a including 0, "", false, null, undefined, NaN
    // if (source === 'body' && Object.keys(formA).includes(key)) {
    //   form[key] = formA[key];
    // }
    if (Object.keys(formA).includes(key)) {
      form[key] = formA[key];
    }
  };
  Object.keys(schema).forEach((key) => {
    const schemaKey = schema[key];
    if (schemaKey?.options?.source) {
      assignReq(key, schemaKey.options.source);
    } else if (schemaKey?.caster?.options?.source) {
      // For array
      assignReq(key, schemaKey.caster.options.source);
    } else {
    }
  });
  //TODO: Validate only the field with mongoose validation

  return form;
};

async function formEncoded(
  modelName: string,
  mode = 'formEncode',
  opts = { suggest: false, body: true, datas: {} },
) {
  // await importEsALL(path.join(__dirname, modelName));
  const pathToModel = path.join(__dirname, 'models.ts');
  console.log(pathToModel, 'pathToModel');
  await importEsALL(pathToModel);
  let model: any;
  mongoose.modelNames().forEach((name) => {
    console.log(name, '-< model name');
    if (name?.toLowerCase() === modelName?.toLowerCase()) {
      model = mongoose.model(name);
    }
  });

  if (!model) {
    throw new Error('Model not found');
  }
  const schema = model?.schema;
  const pairs = [];
  const data = validForm(model, schema.paths);
  const arrayKeys: string[] = [];
  // Rows are separated by a new line
  // Key and value are separated by a colon (:)
  // Prepend // to any line that is a comment
  for (const key in schema.paths) {
    if (!Object.keys(data).includes(key)) {
      // const value = opts?.suggest ? suggestValue(key, schema.paths) : '';
      const value = '';
      const thePair = opts?.body ? `//${key}=${value}` : `${key}=${value}`;
      pairs.push(thePair);
    } else {
      const keyType = schema.paths[key].instance;
      if (keyType === 'Array') {
        arrayKeys.push(key);
        continue;
      }
      let value: any = '';

      // let value: any = opts?.suggest ? suggestValue(key, schema.paths) : '';

      pairs.push(`${key}=${value}`);
    }
  }

  const rows: string[] = pairs.map((pair) => {
    const [key, value] = pair.split('=');
    return `${key}:${value}`;
  });
  const result: string = rows.join('\n');
  if (mode === 'json') {
    // convert result to json
    const json: any = {};
    rows.forEach((row) => {
      const [key, value] = row.split(':');
      json[key] = value;
    });
    // check for those schem key that are array of object
    arrayKeys.forEach((key) => {
      const keyData = schema.paths[key];
      const keySchemaObj = keyData?.schema?.obj || {};
      const obj: { [key: string]: string } = {};
      // Iterate through the keySchemaObj
      for (const key in keySchemaObj) {
        if (Object.prototype.hasOwnProperty.call(keySchemaObj, key)) {
          const element: any = keySchemaObj[key];
          let value = ''; //suggestValue(key, keyData.schema.paths || {})
          console.log(key, value, 'value');
          if (element?.source === 'body') {
            obj[key] = value;
          } else {
            obj[`${key}`] = value;
          }
        }
      }
      // if obj is not empty
      if (Object.keys(obj).length) {
        json[key] = [obj];
      }
    });

    console.log(JSON.stringify(json));
    return json;
  }
  console.log(result);
  //   clipboard.writeSync(result);
  return result;
  //   return pairs.join('&');
}

formEncoded('leaveRequest', 'json');
//TODO: Generate collection from model

// const suggestValue = (key: string, schema: any) => {
//   const keyType = schema[key].instance;
//   let value: any = 'N/A';
//   switch (keyType) {
//     case 'String':
//       value = faker.datatype.string();
//       break;
//     case 'Number':
//       value = faker.datatype.number();
//       break;
//     case 'Boolean':
//       value = faker.datatype.boolean();
//       break;
//     case 'Date':
//       value = faker.datatype.datetime();
//       break;
//     case 'ObjectID':
//       value = faker.datatype.uuid();
//       break;
//     case 'Buffer':
//       value = faker.datatype.string();
//       break;
//     case 'Mixed':
//       value = faker.datatype.json();
//       break;
//     case 'Array':
//       value = faker.datatype.string();
//       break;
//     case 'Decimal128':
//       value = faker.datatype.string();
//       break;
//     case 'Map':
//       value = faker.datatype.string();
//       break;

//     default:
//       console.log(keyType, 'keyType');
//       break;
//   }
//   return value;
// };
// async function convertToJSON(modelName: string) {
//   const jsonData = await formEncoded(modelName, 'json');
//   // Write to file
//   const filePath = path.join(__dirname, '../data', `${modelName}.json`);
//   console.log(filePath);
//   // Check if file exist
//   if (!fs.existsSync(filePath)) {
//     // Create file
//     await fs.createWriteStream(filePath);
//   }
//   fs.writeFileSync(filePath, JSON.stringify(jsonData));
// }

// async function convertToCSV(modelName: string) {
//   const json = await formEncoded(modelName, 'json');
//   // Write to file
//   const filePath = path.join(__dirname, '../data', `${modelName}.csv`);
//   console.log(filePath);
//   // Check if file exist
//   if (!fs.existsSync(filePath)) {
//     // Create file
//     fs.createWriteStream(filePath);
//   }
//   let csvData = '';
//   // Convert json to csv
//   for (const key in json) {
//     if (Object.prototype.hasOwnProperty.call(json, key)) {
//       const element = json[key];
//       if (Array.isArray(element)) {
//         element.forEach((obj) => {
//           for (const key in obj) {
//             if (Object.prototype.hasOwnProperty.call(obj, key)) {
//               const element = obj[key];
//               csvData += `${key},${element}

//           `;
//             }
//           }
//         });
//       } else {
//         csvData += `${key},${element}`;
//       }
//     }
//   }

//   // write form to file as csv
//   fs.writeFileSync(filePath, csvData, {
//     encoding: 'utf8',
//     mode: 0o666,
//   });
// }

// convertToCSV('feedback');
// convertToJSON('feedback');

// Send request to server on http://localhost:8080 using curl by posting each object in the json file
// async function sendRequest(url: string, file: string) {
//   const filePath = path.join(__dirname, '../data', `${file}.json`);
//   const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
//   // Send request to server
//   // Loop through the json data
//   for (const key in jsonData) {
//     if (Object.prototype.hasOwnProperty.call(jsonData, key)) {
//       const element = jsonData[key];
//       const response = await axios.post(url, element, {
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization:
//             'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYzZjkwODJlYjIwODg1MDNhMDI2ZTQ3MyIsImlhdCI6MTY3Nzg1ODI3NiwiZXhwIjozLjYwMDAwMDAwMDAwMDAwMTRlKzI0fQ._b90u0VL0yr99Ijmo3eTmAU-qAIShEabeDsD52J4BB4',
//         },
//       });
//       console.log(response.data);
//     }
//   }
// }
// sendRequest('http://localhost:8080/api/v1/job', 'job');

// console.log(
//   JSON.stringify({
//     metadata: {
//       ipinfo: {
//         status: 'success',
//         country: 'Nigeria',
//         regionName: 'Lagos',
//         city: 'Lagos',
//         district: '',
//         zip: '',
//         lat: 6.4474,
//         lon: 3.3903,
//         timezone: 'Africa/Lagos',
//         isp: 'MTN NIGERIA Communication limited',
//         org: 'MTN Nigeria',
//         as: 'AS29465 MTN NIGERIA Communication limited',
//         mobile: true,
//         proxy: false,
//         hosting: true,
//         query: '102.89.43.231',
//       },
//       device_info:
//         'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
//       user_id: 'oluwaseun',
//     },
//     data: {
//       index: {
//         data: {},
//         message: 'Successfully continued to the main checks.',
//         status: true,
//       },
//       countries: {
//         data: {
//           country: 'Nigeria',
//         },
//         message: 'Successfully continued to the next step.',
//         status: true,
//       },
//       'user-data': {
//         data: {
//           firstName: 'Tola',
//           lastName: 'Banjo',
//           dob: '1991-06-08',
//         },
//         message: '',
//         status: true,
//       },
//     },
//     message: '',
//     referenceId: 'DJ-A966F932DD',
//     verificationMode: '',
//     verificationType: 'BVN',
//     verificationValue: '',
//     verificationUrl:
//       'https://app.dojah.io/verifications/bio-data/DJ-A966F932DD',
//     selfieUrl: '',
//     status: false,
//     aml: {
//       status: false,
//     },
//   }),
// );
