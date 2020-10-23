import { Template } from '../../../../decorators/template.decorator';
import { GrammarSymbol } from '../../../../frontends/wsn/symbols/grammar.symbol';
import { ITemplate } from '../../../../interfaces/template.interface';

@Template({
  reference: 'artgen.grammar.identifier',
  path: `./<%- identifier.path %>`,
})
export class IdentifierTemplate implements ITemplate {
  data(context: { $symbol: GrammarSymbol }) {
    return {
      identifier: {
        clss: context.$symbol.name.upperCase.suffix('Identifier'),
        path: context.$symbol.name.kebabCase.suffix('.identifier.ts'),
        products: context.$symbol.getProducts(),
      },
    };
  }

  render() {
    return `export enum <%- identifier.clss %> {
<% for(const product of identifier.products) { _%>
  <%- product %> = \`<%- product %>\`,
<% } %>
}
`;
  }
}
