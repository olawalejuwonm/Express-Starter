module.exports = function (plop) {
  plop.setHelper('fcapitalize', function (str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  });
  plop.setHelper('flowercase', function (str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
  });

  plop.setGenerator('rcm', {
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'What is the name?',
      },
    ],
    actions: [
      {
        type: 'add',
        path: 'src/routes/{{name}}.ts',
        templateFile: 'plop-templates/route.hbs',
        data: {
          name: '{{name}}',
        },
      },
      {
        type: 'add',
        path: 'src/controllers/{{name}}Controller.ts',
        templateFile: 'plop-templates/controller.hbs',
        data: {
          name: '{{name}}',
        },
      },
      {
        type: 'add',
        path: 'src/models/{{name}}Model.ts',
        templateFile: 'plop-templates/model.hbs',
        data: {
          name: '{{name}}',
        },
      },
    ],
  });
  plop.setGenerator('gcsm', {
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'What is the name?',
      },
    ],
    actions: [
      {
        type: 'add',
        path: 'src/guards/{{name}}.guard.ts',
        templateFile: 'plop-templates/gcsm/guard.hbs',
        data: {
          name: '{{name}}',
        },
      },
      {
        type: 'add',
        path: 'src/controllers/{{name}}.controller.ts',
        templateFile: 'plop-templates/gcsm/controller.hbs',
        data: {
          name: '{{name}}',
        },
      },
      {
        type: 'add',
        path: 'src/appservice/{{name}}.service.ts',
        templateFile: 'plop-templates/gcsm/service.hbs',
        data: {
          name: '{{name}}',
        },
      },
      {
        type: 'add',
        path: 'src/models/{{name}}.model.ts',
        templateFile: 'plop-templates/model.hbs',
        data: {
          name: '{{name}}',
        },
      },
    ],
  });
  plop.setGenerator('dgcss', {
    description: 'Create a new folder for feature',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'What is the name?',
      },
    ],
    actions: [
      {
        type: 'add',
        path: 'src/features/{{name}}/dto.ts',
        templateFile: 'plop-templates/dgcss/dto.hbs',
        data: {
          name: '{{name}}',
        },
      },
      {
        type: 'add',
        path: 'src/features/{{name}}/guard.ts',
        templateFile: 'plop-templates/dgcss/guard.hbs',
        data: {
          name: '{{name}}',
        },
      },
      {
        type: 'add',
        path: 'src/features/{{name}}/controller.ts',
        templateFile: 'plop-templates/dgcss/controller.hbs',
        data: {
          name: '{{name}}',
        },
      },
      {
        type: 'add',
        path: 'src/features/{{name}}/service.ts',
        templateFile: 'plop-templates/dgcss/service.hbs',
        data: {
          name: '{{name}}',
        },
      },
      {
        type: 'add',
        path: 'src/features/{{name}}/schema.ts',
        templateFile: 'plop-templates/dgcss/schema.hbs',
        data: {
          name: '{{name}}',
        },
      },
      {
        type: 'modify',
        path: 'src/routes/v1.ts',
        pattern:
        //import position from '../features/position/controller';
        /(import .* from '..\/features\/.*\/controller';)/,
        template: "$1\nimport {{name}} from '../features/{{name}}/controller';\n",
      },
      {
        type: 'modify',
        path: 'src/routes/v1.ts',
        pattern: /(router.use\('\/', generator\);)/,
        template: "router.use('/{{name}}', {{name}});\n$1",
      },
      // src\models.ts
      // template: "$1import {{name}} from ''./features/{{name}}/model'';\n",
      // This action modifies the file with the path 'src/models.ts' and adds the following line after the line that contains 'import' and before the line that contains 'export':
      {
        type: 'modify',
        path: 'src/models/index.ts',
        pattern: /(import .* from '..\/features\/.*\/model';)/,
        template: "$1\nimport { {{fcapitalize name}} } from '../features/{{name}}/schema';",
      },
      //export const {{fcapitalize name}}Model = getModelForClass({{fcapitalize name}});

      // This wil add the following line after the last line that contains 'export const'
      {
        type: 'modify',
        path: 'src/models/index.ts',
        pattern: /(export const .*Model = getModelForClass\(.*\);)/,
        template: "$1\nexport const {{fcapitalize name}}Model = getModelForClass({{fcapitalize name}});",
      },



    ],
  });
};
