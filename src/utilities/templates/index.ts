import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';


handlebars.registerHelper('escape', function(variable) {
  return variable?.replace(/(['"])/g, '\\$1');
});


export const constructTemplate = (
  filePath: string,
  replacements: {
    [key: string]: any;
  },
) => {
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

export const htmlTemplate = (name: string) =>
  path.join(__dirname, 'htmls', `${name}.html`);