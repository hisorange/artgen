import { ISmartString, ITemplate, Template } from '../../../../../components';
import { ControllerTemplate } from './controller.template';
import { ModelTemplate } from './model.template';
import { SchemaTemplate } from './schema.template';
import { ServiceTemplate } from './service.template';

@Template({
  reference: 'nestjs.crud.module',
  path: `<%- module.path %>`,
  depends: [ControllerTemplate, SchemaTemplate, ModelTemplate, ServiceTemplate],
})
export class ModuleTemplate implements ITemplate {
  context(input: { $name: ISmartString }) {
    return {
      module: {
        name: input.$name.pascalCase.suffix('Module'),
        directory: input.$name.kebabCase,
        path: input.$name.kebabCase.suffix('.module.ts'),
      },
    };
  }

  render() {
    return `import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { schemaFrom } from '@reflet/mongoose';
import { <%- controller.name %> } from './<%- controller.path.toString().replace('.ts', '') %>';
import { <%- schema.name %> } from './<%- schema.path.toString().replace('.ts', '') %>';
import { <%- service.name %> } from './<%- service.path.toString().replace('.ts', '') %>';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: '<%- schema.type %>',
        schema: schemaFrom(<%- schema.name %>),
        collection: '<%- schema.collection %>'
      },
    ]),
  ],
  controllers: [<%- controller.name %>],
  providers: [<%- service.name %>],
  exports: [<%- service.name %>],
})
export class <%- module.name %> {}
`;
  }
}
