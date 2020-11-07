import { Template } from '../../../../../components/module-handler/decorators/template.decorator';
import { ITemplate } from '../../../../../components/module-handler/interfaces/template.interface';
import { GrammarSymbol } from '../../../../frontends/wsn/symbols/grammar.symbol';

@Template({
  reference: 'artgen.grammar.grammar',
  path: `./<%- grammar.path %>`,
})
export class GrammarTemplate implements ITemplate {
  data(input: { $symbol: GrammarSymbol }) {
    return {
      grammar: {
        $name: input.$symbol.name,
        clss: input.$symbol.name.upperCase.suffix('Grammar'),
        path: input.$symbol.name.kebabCase.suffix('.grammar.ts'),
      },
    };
  }

  render() {
    return `import { Language } from '../../constants/language';
import { IPluginConfig } from '../../interfaces/plugin/plugin-config.interface';
import { IPluginInvoker } from '../../interfaces/plugin/plugin-invoker.interface';
import { IPlugin } from '../../interfaces/plugin/plugin.interface';
import { createParsers } from './<%- grammar.$name.kebabCase %>.parsers';
import { <%- 'LEXER' %>Lexers } from './<%- grammar.$name.kebabCase  %>.lexers';
import { <%- 'INTP'  %>Interpreters } from './<%- grammar.$name.kebabCase %>.interpreters';

@Grammar({
  name: '<%- grammar.$name.upperCase %>',
  extensions: ['<%- grammar.$name.lowerCase %>'],
  parsers: [],
  lexers: [],
  interpreters: [],
})
export class <%- grammar.clss %> implements IGrammar {
}
    `;
  }
}