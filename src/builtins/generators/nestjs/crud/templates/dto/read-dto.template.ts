import {
  ISmartString,
  ITemplate,
  Template,
} from '../../../../../../components';

@Template({
  reference: 'nestjs.crud.dto.read',
  path: `dto/<%- dto.read.path %>`,
})
export class ReadDtoTemplate implements ITemplate {
  context(input: { $name: ISmartString }) {
    return {
      dto: {
        read: {
          name: input.$name.pascalCase.suffix('Dto').prefix('Read'),
          path: input.$name.kebabCase.suffix('.dto.ts').prefix('read-'),
        },
      },
    };
  }

  render() {
    return `import { Expose } from 'class-transformer';

export class <%- dto.read.name %>  {
  @Expose({ name: '_id' }) id: string;
  @Expose() createdAt: string;
  @Expose() updatedAt: string;
  @Expose() offlineLock: string;
}
`;
  }
}
