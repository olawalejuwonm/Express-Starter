import fs from 'fs';
import path from 'path';
import { IMongooseDocsSchema } from '../types';
import writeFile from './writeFile';

let docs = '';
try {
  docs = fs.readFileSync(path.join(__dirname, 'docs.md'), 'utf8');
} catch (error) {
  // console.log(error);
}

/**
 * Escape HTML special characters like quotes and brackets.
 * @param string
 */
function escapeHtml(string: string): string {
  const entityMap: { [entity: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };
  return string.replace(/[&<>"'`=\/]/g, function (s) {
    return entityMap[s];
  });
}

/**
 * Generate anchor tag for a schema type.
 * @param fieldType
 */
function schemaTypeAnchor(fieldType: string): string {
  const officialSchemaTypeUrl = 'https://mongoosejs.com/docs/schematypes.html';
  let schemaTypeUrl: string = '';
  switch (fieldType) {
    case 'String':
    case 'Number':
    case 'Date':
    case 'Buffer':
    case 'Boolean':
    case 'ObjectID':
    case 'Array':
    case 'Map':
      schemaTypeUrl = `${officialSchemaTypeUrl}#${fieldType.toLowerCase()}s`;
      break;
    case 'Mixed':
      schemaTypeUrl = `${officialSchemaTypeUrl}#${fieldType.toLowerCase()}`;
      break;
    case 'Decimal128':
      schemaTypeUrl = `${officialSchemaTypeUrl}#mongoose_Mongoose-Decimal128`;
      break;
  }

  if (schemaTypeUrl) {
    return `<a href="${schemaTypeUrl}" target="_blank" rel="noopener noreferrer">${fieldType}</a>`;
  } else {
    return fieldType;
  }
}

/**
 * Generate HTML code for bootstrap navigation to other schemas.
 * @param mongooseSchemas
 * @param modelName
 */
function generateNavigation(
  mongooseSchemas: IMongooseDocsSchema[],
  modelName?: string,
): string {
  const anchorLinks: string[] = mongooseSchemas.map((schema) => {
    const title = schema.comment ? escapeHtml(schema.comment) : '';
    const classes = `nav-link mb-3 border ${
      schema.name === modelName ? 'active' : ''
    }`;
    return `
			<a class="${classes}" title="${title}" href="./${schema.name}.html">
				${schema.name}
			</a>`;
  });
  return `
		<h3><a href="/static/docs">Documents</a></h3>
		<div class="nav flex-column nav-pills" role="tablist" aria-orientation="vertical">
			${anchorLinks.join('')}
		</div>
	`;
}

// stringify all schema fields
function getSchemaFieldsName(schema: IMongooseDocsSchema): {
  [key: string]: string;
} {
  const obj: { [key: string]: string } = {};
  for (const key in schema.fields) {
    if (Object.prototype.hasOwnProperty.call(schema.fields, key)) {
      obj[key] = schema.fields[key].type;
    }
    // obj[key] = schema.fields[key].type;
    obj[key] = '';
  }
  return obj;
}

/**
 * Generate HTML code for a schema table.
 * @param schema
 */
function generateSchemaTable(schema: IMongooseDocsSchema): string {
  let obj;
  try {
    obj = obj !== undefined ? JSON.stringify(obj) : '';
  } catch (err) {
    console.log(err);
    obj = '';
  }

  // console.log(
  //   stringifySchemaFieldsName(schema),
  //   'stringifySchemaFields(schema)',
  // );

  const fieldRows: string[] = Object.keys(schema.fields).map(
    (fieldName: string) => {
      const field = schema.fields[fieldName];
      const obj = schema.schema?.obj[fieldName] as any;
      let stringifiedObj = '';
      try {
        stringifiedObj = JSON.stringify(obj ?? ' ');
      } catch (error) {
        // console.error(error.message);
        console.log(obj, 'obj');
      }
      // console.log(obj, 'obj');
      let nestedSchema: string = '';
      if (field.nestedSchema !== undefined) {
        nestedSchema =
          typeof field.nestedSchema === 'string'
            ? field.nestedSchema
            : JSON.stringify(field.nestedSchema);
      }
      return `
			<tr>
				<td>${fieldName}</td>
				<td>${schemaTypeAnchor(field.type)}</td>
				<td>${field.comment !== undefined ? escapeHtml(field.comment) : ''}</td>
				<td>${field.required ? 'True' : 'False'}</td>
				<td>${field.default !== undefined ? field.default : ''}</td>
				<td>${field.min !== undefined ? field.min : ''}</td>
				<td>${field.max !== undefined ? field.max : ''}</td>
				<td>${nestedSchema}
       
        </td>
        <td>${obj !== undefined ? obj?.enum?.join(',') ?? ' ' : ''}
        </td>
        <td>${stringifiedObj}</td>

			</tr>
		`;
    },
  );
  return `
		<div class="table-responsive">	
			<table class="table table-striped table-bordered">
			<thead>
				<tr>
					<th>Field Name</th>
					<th>Field Type</th>
					<th>Comment</th>
					<th>Required</th>
					<th>Default</th>
					<th>Min</th>
					<th>Max</th>
					<th>Nested Schema</th>
          <th>Values</th>
          <th>Misc.</th>
				</tr>
			</thead>
			<tbody>
				${fieldRows.join('')}
			</tbody>
		</table>
		</div>
	`;
}

/**
 * Generate HTML code for documentation index.
 * @param mongooseSchemas
 */
function mongooseDocsGenerateIndexHTML(
  mongooseSchemas: IMongooseDocsSchema[],
): string {
  return `<!DOCTYPE HTML>
		<html lang="en">
		<head>
			<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
			<title> ${process.env.APP_NAME} Docs</title>
			<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.1/dist/css/bootstrap.min.css" rel="stylesheet" 
				integrity="sha384-+0n0xVW2eSR5OomGNYDnhzAbDsOXxcvSN1TPprVMTNDbiYZCxYbOOl7+AMvyTG2x" crossorigin="anonymous"/>
		</head>
		<body>
			<div class="container py-5">
				<div class="row">
					<div class="col-12 col-md-3">
						${generateNavigation(mongooseSchemas)}
					</div>
					<div class="col-12 col-md-9">
						<h1>Welcome to ${process.env.APP_NAME} Docs</h1>
						<p>Here you can find documentation for all fields used in this application.</p>
            <p>
            Understanding the concept used will make it easier for you to develop faster with this API.
            Please take your time to read through the description below, it was written for YOU. It will help you understand the API better.
            </p>
            <p>You can view all the endpoints <a href="/endpoints" target="_blank" rel="noopener noreferrer">here</a> which will always be updated</p>
            <p>View the <a href="/swagger" target="_blank" rel="noopener noreferrer">swagger documentation</a> for this API.</p>
            <p>View the <a href="${
              process.env.DOCUMENTATION_URL
            }" target="_blank" rel="noopener noreferrer">postman documentation</a> for this API. This is not guaranteed to be always updated</p>
            <p> Development base url: <a href="${
              process.env.DEV_BASE_URL || '' + process.env.BASE_PATH
            }" target="_blank" rel="noopener noreferrer"> ${
              process.env.DEV_BASE_URL || '' + process.env.BASE_PATH
            }</a></p>
          <p>
          Download openapi documentation <a href="/swagger.json" target="_blank" rel="noopener noreferrer">here</a>
          </p>
          <p> Ensure you that you read the query description <a href="#query-description">below</a> to understand how to use the query parameters</p>
          <h2>Convert Schema to JSON</h2>
          <p>Use this tool to convert your schema to JSON</p>
          <form>
        <textarea id="myTextarea" oninput="logTextarea()"
            style="display: inline-block; vertical-align: top; width: 45%; height: 300px; margin-right: 5%;"></textarea>
        <textarea id="displayTextarea" readonly
            style="display: inline-block; vertical-align: top; width: 45%; height: 300px;"></textarea>
    </form>
    <br>
    <button type="button" onclick="copyTextAreaToClipboard()" style="display: flex; margin-left: auto;">Copy to
        Clipboard</button>

					<p>Click on document on the left to view the relevant fields</p>
          <pre>
        ${docs}
          </pre>

          
            <h2 id="query-description">QUERY DESCRIPTION</h2>
            <p>Queries are used to filter the data returned from the database. They are used to search for specific data.</p>
            <p>Queries are passed as query parameters in the url. They are passed as key value pairs.</p>
            <p>
            <pre>
All GET requests that fetch data collections from the API are designed to take these (optional) filters in the request queries:

* _limit => max number of records to fetch; default is 10. To remove the limit, set to 0
* _offset => number of steps to skip (useful for pagination)
* _orderBy => sort fetched data by a particular field (e.g ?orderBy=firstName will sort data by the firstName fields)
* _order => how to sort data, i.e ascending or descending order. Values are asc or desc (e.g ?_orderBy=firstName&_order=asc will sort data by firstName field in ascending order )
* _populate => specify what mongo id field to populate into an object. You can specify multiple fields to populate by adding [] e.g ?_populate[]=user&populate[]=event
* _searchBy and keyword => for routes that fetch data like posts, transactions, you can perform a partial or full word search using e.g /posts?_searchBy[]=text&_keyword=arise will fetch posts in whose text fields (This can be multiple) it can find a match called arise.
You can search a single field by preceeding with $ like text:#arise

There are some endpoints however, that will search through some fields if only the keyword query is passed

*The endpoints can also filter by comparisons >=, <=, <, > != (not equal)
* select => specify what data field(s) to return (if you prefer not to return the full document(s). You can specify multiple fields to select by adding [] e.g ?_select[]=firstName&+select[]=email
* Generally, you can match fields directly as a query. e.g /products?category=cars will fetch products whose categories are cars
Sample query:
GET /products?category=cars&_populate[]=createdBy&_populate[]=updatedBy&_orderBy=title&_order=desc

For cases when you want to filter a populated field, please indicate the flag _filterOnPopulate=true. An instance is when you are populating a profile field on a document and you only want a firstName that matches "Micheal" an instance would be: http://localhost:8080${
    process.env.BASE_PATH
  }//user/profiles?profile.firstName=#Miche&_filterOnPopulate=true

For some array fields
You can filter item in array using == (making it triple equal ===)
To filter by size of an array you can use %
            </pre>
            </p>
					</div>
				</div>
			</div>
      <script>
      function logTextarea() {
          const textarea = document.getElementById('myTextarea');
          const displayTextarea = document.getElementById('displayTextarea');
          displayTextarea.value = convertToJSON(textarea.value);
      }

      function copyTextAreaToClipboard() {
          const displayTextarea = document.getElementById('displayTextarea');
          displayTextarea.select();
          document.execCommand('copy');
          const copyButton = document.querySelector('button');
          copyButton.textContent = 'Copied!';
          setTimeout(() => {
              copyButton.textContent = 'Copy to Clipboard';
          }, 2000);
      }

      function convertToJSON(str) {
          try {
              let data = str.split("\\n");
              let jsonData = {};
              for (let i = 0; i < data.length; i++) {
                  let key = data[i].replace("any", "");
                  jsonData[key] = "";
              }
              console.log(JSON.stringify(jsonData));
              return JSON.stringify(jsonData);
          } catch (error) {
              return error;
          }
      }
  </script>
		</body>
		</html>
	`;
}

/**
 * Generate HTML code for a single schema.
 * @param mongooseSchemas
 * @param modelName
 */
function mongooseDocsGenerateSchemaHTML(
  mongooseSchemas: IMongooseDocsSchema[],
  modelName: string,
): string {
  const currentSchema: IMongooseDocsSchema = mongooseSchemas.find(
    (schema) => schema.name === modelName,
  ) as IMongooseDocsSchema;

  if (!currentSchema) return '';

  return `<!DOCTYPE HTML>
		<html lang="en">
		<head>
			<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
			<title>Docs for ${modelName} model</title>
			<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.1/dist/css/bootstrap.min.css" rel="stylesheet" 
				integrity="sha384-+0n0xVW2eSR5OomGNYDnhzAbDsOXxcvSN1TPprVMTNDbiYZCxYbOOl7+AMvyTG2x" crossorigin="anonymous"/>
		</head>
		<body>
			<div class="container py-5">
				<div class="row">
					<div class="col-12 col-md-3">
						${generateNavigation(mongooseSchemas, modelName)}
					</div>
					<div class="col-12 col-md-9">
						<h1>Docs for ${modelName}</h1>
						<div class="mb-3">${
              currentSchema.comment ||
              'This is what the fields for ' +
                modelName +
                " looks like, you don't have to ask me everytime 😊. Anything missing again? Hit me on discord @olawalejuwonm ."
            }
            Click this to copy the fields to clipboard <button class="btn btn-primary" onclick="copyToClipboard()">Copy</button>
            </div>
						${generateSchemaTable(currentSchema)}
					</div>
				</div>
			</div>
      <script>
      function copyToClipboard(text) {
        text= text || \`${JSON.stringify(getSchemaFieldsName(currentSchema))}\`;
        const input = document.createElement('textarea');
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
     
      </script>
		</body>
		</html>
	`;
}

/**
 * Write documentation as HTML files for all available schemas.
 * @param mongooseSchemas Schema structure returned from `mongooseDocsJSON` function.
 * @param fileDirectory Directory to write the documentation HTML files.
 */
export function mongooseDocsOutputHTML(
  mongooseSchemas: IMongooseDocsSchema[],
  fileDirectory: string,
): void {
  const lastChar: string = fileDirectory.substr(-1); // Selects the last character
  if (lastChar != '/') {
    // If the last character is not a slash
    fileDirectory = fileDirectory + '/'; // Append a slash to it.
  }

  // Make directory if it does not exist
  if (!fs.existsSync(fileDirectory)) {
    try {
      fs.mkdirSync(fileDirectory, { recursive: true });
    } catch (err) {
      console.error(`Error creating directory "${fileDirectory}"`, err);
    }
  }

  // Write out HTML files
  writeFile(
    mongooseDocsGenerateIndexHTML(mongooseSchemas),
    path.join(fileDirectory, 'index.html'),
  );
  mongooseSchemas.forEach((schema) => {
    writeFile(
      mongooseDocsGenerateSchemaHTML(mongooseSchemas, schema.name),
      path.join(fileDirectory, `${schema.name}.html`),
    );
  });

  console.log(`documentation files written to ${fileDirectory}`);
}
