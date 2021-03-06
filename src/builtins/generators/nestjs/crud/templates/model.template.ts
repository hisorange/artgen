import { ISmartString, ITemplate, Template } from '../../../../../components';

@Template({
  reference: 'nestjs.crud.model',
  path: `<%- model.path %>`,
})
export class ModelTemplate implements ITemplate {
  context(input: { $name: ISmartString }) {
    return {
      model: {
        name: input.$name.pascalCase.suffix('Model'),
        path: input.$name.kebabCase.suffix('.model.ts'),
      },
    };
  }

  render() {
    return `import { Document } from 'mongoose';
import { <%- dto.read.name %> } from './dto/<%- dto.read.path.toString().replace(/.ts$/, '') %>';

export interface <%- model.name %> extends Document {
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly offlineLock: Number;
  toReadDto(): <%- dto.read.name %>;
}
`;
  }
}
