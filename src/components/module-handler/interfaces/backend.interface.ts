import { ISymbol } from '../../iml/interfaces/symbol.interface';
import { IRenderer } from '../../renderer';

export interface IBackend {
  render(renderer: IRenderer, symbol: ISymbol): Promise<void>;
}

export interface IGenerator {
  render(ctx?: any): Promise<void>;
}
