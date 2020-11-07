import { Bindings } from '../container/bindings';
import { Container } from '../container/container';
import { Inject } from '../container/decorators/inject.decorator';
import { Events } from '../event-handler/events';
import { IEventEmitter } from '../event-handler/interfaces/event-emitter.interface';
import { Timings } from '../event-handler/timings';
import { ParserException } from '../exceptions';
import { Grammar } from '../iml/grammar';
import { IGrammar } from '../iml/interfaces/grammar.interface';
import { ILogger } from '../logger/interfaces/logger.interface';
import { LoggerFactory } from '../logger/logger.factory';
import { ICharacter } from '../models/interfaces/character.interface';
import { ICollection } from '../models/interfaces/collection.interface';
import { IToken } from '../models/interfaces/token.interface';
import { IModuleHandler } from '../module-handler/interfaces/module-handler.interface';
import { ModuleType } from '../module-handler/module-type.enum';
import { IPipe } from '../pipes/interfaces/pipe.interface';
import { ExtensionExceptionContext } from './interfaces/extension.exception-context';
import { IParserExceptionContext } from './interfaces/parser.exception-context';

export class ParserPipe implements IPipe<ICollection<ICharacter>, Promise<IToken>> {
  protected readonly logger: ILogger;

  public constructor(
    @Inject(Bindings.Factory.Logger) protected readonly loggerFactory: LoggerFactory,
    @Inject(Bindings.Module.Handler) protected readonly module: IModuleHandler,
    @Inject(Bindings.Container) protected readonly container: Container,
    @Inject(Bindings.Components.EventEmitter) protected readonly event: IEventEmitter,
  ) {
    this.logger = loggerFactory.create({ label: 'Parser' });
  }

  async pipe(characters: ICollection<ICharacter>): Promise<IToken> {
    this.logger.time(Timings.PARSING);

    const extension = characters.current.path.extension;
    const grammar = this.loadGrammar(extension);

    if (!grammar) {
      throw new ParserException<ExtensionExceptionContext>('No frontend for given extension', { extension });
    }

    // TODO: Get the Tokenizer, load the parsers and then run for the longest, then run again until the content is finished or no change is detected
    // by this, we can detect if the result is partial finished.
    // Grammar should be a helper class to handle the frontend, without collections like lexer?
    const result = grammar.parse(characters);

    if (!result.token || result.characters.isValid) {
      throw new ParserException<IParserExceptionContext>('Unexpected character', {
        grammar: grammar,
        characters: result.characters,
      });
    }

    // Publish the result, here the subscribers can even optimize or change the tokens.
    this.event.publish(Events.PARSED, result.token);
    this.logger.timeEnd(Timings.PARSING);

    return result.token;
  }

  protected loadGrammar(extension: string): IGrammar {
    let grammar: IGrammar;

    const frontends = this.module.search(ModuleType.FRONTEND);

    for (const frontendMod of frontends) {
      for (const ext of frontendMod.meta.extensions) {
        if (ext.toLowerCase() === extension.toLowerCase()) {
          const tknCls = frontendMod.meta.tokenizer;
          const tokenizer = new tknCls(this.loggerFactory);

          grammar = new Grammar(frontendMod.meta.name, tokenizer);

          if (frontendMod.meta.lexers) {
            this.container.getSync(Bindings.Collection.Lexer).push(...frontendMod.meta.lexers.map(l => new l()));
            this.container
              .getSync(Bindings.Collection.Interpreter)
              .push(...frontendMod.meta.interpreters.map(i => new i()));
          }
        }
      }
    }

    return grammar;
  }
}