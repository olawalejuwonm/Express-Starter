import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

export const constructTemplate = (
  filePath: string,
  replacements: {
    [key: string]: any;
  },
) => {
  // Check for objects that are object in replacements and do JSON.parse(JSON.stringify(obj)) on them
  // This is to avoid handlebars throwing error when it encounters an object in the replacements object

  Object.keys(replacements).forEach((key) => {
    if (typeof replacements[key] === 'object') {
      replacements[key] = JSON.parse(JSON.stringify(replacements[key]));
    }
  });
  const source = fs
    .readFileSync(filePath, 'utf8')
    ?.toString();
  const template = handlebars.compile(source);
  const html = template(replacements);
  return html;
};
