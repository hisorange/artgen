import { Frontend, IFrontend } from '../../../components';
import { IdentifierInterpreter } from './interpreters/identifier.interpreter';
import { ProductionInterpreter } from './interpreters/production.interpreter';
import { SyntaxInterpreter } from './interpreters/syntax.interpreter';
import { AliasLexer } from './lexers/alias.lexer';
import { ChannelLexer } from './lexers/channel.lexer';
import { GrammarLexer } from './lexers/grammar.lexer';
import { IdentifierLexer } from './lexers/identifier.lexer';
import { LiteralLexer } from './lexers/literal.lexer';
import { LogicalLexer } from './lexers/logical.lexer';
import { ProductionLexer } from './lexers/production.lexer';
import { RegexpLexer } from './lexers/regexp.lexer';
import { WSNTokenizer } from './wsn.tokenizer';

@Frontend({
  name: 'Writh Syntax Notation',
  reference: 'wsn',
  extensions: ['wsn'],
  tokenizer: WSNTokenizer,
  lexers: [
    GrammarLexer,
    LiteralLexer,
    IdentifierLexer,
    ProductionLexer,
    AliasLexer,
    ChannelLexer,
    RegexpLexer,
    LogicalLexer,
  ],
  interpreters: [SyntaxInterpreter, ProductionInterpreter, IdentifierInterpreter],
})
export class WSNFrontend implements IFrontend {
  onInit() {}
}
