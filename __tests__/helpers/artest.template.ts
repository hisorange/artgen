import { ISmartString, ITemplate, Template } from '../../src';

@Template({
  reference: 'artest.template',
  engine: {
    delimiter: '?',
  },
  path: `templates/<?- tpl.path ?>`,
})
export class ArTestTemplate implements ITemplate {
  context(input: { $name: ISmartString }) {
    return {
      tpl: {
        name: input.$name.pascalCase.suffix('Template'),
        path: input.$name.kebabCase.suffix('.txt'),
      },
    };
  }

  render() {
    return `Should print <?- tpl.name ?>=ArTestTemplate`;
  }
}