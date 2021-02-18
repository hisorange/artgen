import { Template } from '../../../../../components/module-handler/decorators/template.decorator';
import { ITemplate } from '../../../../../components/module-handler/interfaces/template.interface';
import { ISmartString } from '../../../../../components/smart-string';

@Template({
  reference: 'artgen.template',
  engine: {
    delimiter: '?',
  },
  path: `templates/<?- template.path ?>`,
})
export class TemplateTemplate implements ITemplate {
  data(input: { $name: ISmartString }) {
    return {
      template: {
        name: input.$name.pascalCase.suffix('Template'),
        namespace: input.$name.kebabCase,
        path: input.$name.kebabCase.suffix('.template.ts'),
      },
    };
  }

  render() {
    return `import { ISmartString } from '@app';
import { Template, ITemplate } from '@hisorange/artgen';

@Template({
  reference: 'artgen.<?- template.namespace ?>',
  path: \`templates/<%- <?- template.namespace ?>.path %>\`,
})
export class <?- template.name ?> implements ITemplate {
  data(input: { $name: ISmartString }) {
    return {
      <?- template.namespace ?>: {
        // Template data
      }
    };
  }

  render() {
    return \`\`;
  }
}
`;
  }
}
