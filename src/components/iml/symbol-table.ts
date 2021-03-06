import { Logger } from '../logger';
import { ILogger } from '../logger/interfaces/logger.interface';
import { ISymbolId } from './interfaces/symbol-record.interface';
import { ISymbolTable } from './interfaces/symbol-table.interface';
import { ISymbol } from './interfaces/symbol.interface';

export class SymbolTable implements ISymbolTable {
  protected readonly table = new Map<string, ISymbolId>();
  protected increment: number = 1;

  constructor(@Logger('SymbolTable') protected logger: ILogger) {}

  lookup(context: string): ISymbolId {
    context = context.toLowerCase();

    this.logger.info('Lookup', { context });

    if (this.table.has(context)) {
      return this.table.get(context);
    }

    return undefined;
  }

  register(symbol: ISymbol): ISymbolId {
    const context = this.createContext(symbol);
    const record: ISymbolId = {
      id: this.increment++,
      reference: context.join('::'),
      context,
      instance: symbol,
      table: this,
    };

    this.table.set(record.reference, record);

    this.logger.success('Registered', {
      id: record.id,
      reference: record.reference,
      context: record.context,
    });

    return record;
  }

  protected createContext(symbol: ISymbol): string[] {
    const context: string[] = [symbol.name.lowerCase.toString()];

    if (symbol.hasParent()) {
      context.unshift(...this.createContext(symbol.getParent()));
    }

    return context.filter(c => c.length);
  }
}
