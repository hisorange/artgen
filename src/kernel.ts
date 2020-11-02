import { IFileSystem } from '@artgen/file-system';
import { Constructor } from '@loopback/context';
import { Bindings } from './constants/bindings';
import { Timings } from './constants/timings';
import { Container } from './container';
import { Path } from './dtos/path';
import { KernelException } from './exceptions/kernel.exception';
import { IBackend, IGenerator } from './interfaces/backend.interface';
import { ILogger } from './interfaces/components/logger.interface';
import { IPath } from './interfaces/dtos/path.interface';
import { MissingBindingExceptionContext } from './interfaces/exception-contexts/missing-binding.exception-context';
import { IFrontend } from './interfaces/frontend.interface';
import { IGeneratorInput } from './interfaces/generator-input.interface';
import { IKernel } from './interfaces/kernel.interface';
import { ITemplate } from './interfaces/template.interface';
import { IModuleHandler } from './module-handler/module-handler.interface';
import { ModuleType } from './module-handler/module.type';
import { ContainerProvider } from './providers/container.provider';

export class Kernel implements IKernel {
  /**
   * Dependency container, always created when the artgen is constructed
   * this container is shared with the kernel modules.
   */
  protected readonly ctx: Container;

  /**
   * Hidden implementation for module registering.
   */
  protected readonly module: IModuleHandler;

  /**
   * Private logger for the kernel instance.
   */
  protected readonly logger: ILogger;

  constructor() {
    // Prepare a new container and inject every neccessary dependency.
    this.ctx = new ContainerProvider().value();

    // Configure the kernel, later it can be overwritten.
    this.ctx.bind(Bindings.Config).to({
      debug: true,
    });

    // Create a custom logger for the main instance.
    this.logger = this.createLogger(['Kernel']);
    this.module = this.ctx.getSync(Bindings.Module.Handler);

    this.logger.info('System is ready to rock!');
  }

  createLogger(label: string[]): ILogger {
    if (this.ctx.contains(Bindings.Factory.Logger)) {
      throw new KernelException<MissingBindingExceptionContext>(`Missing kernel binding`, {
        binding: Bindings.Factory.Logger.key,
      });
    }

    return this.ctx.getSync(Bindings.Factory.Logger).create({ label });
  }

  createFileSystem(): IFileSystem {
    if (this.ctx.contains(Bindings.Factory.FileSystem)) {
      throw new KernelException<MissingBindingExceptionContext>(`Missing kernel binding`, {
        binding: Bindings.Factory.FileSystem.key,
      });
    }

    return this.ctx.getSync(Bindings.Factory.FileSystem).create();
  }

  mount(input: IFileSystem): void {
    this.ctx.bind(Bindings.Provider.InputFileSystem).to(input);
  }

  frontend(frontend: Constructor<IFrontend>): void {
    this.module.register(ModuleType.FRONTEND, frontend);
  }

  template(template: Constructor<ITemplate>): void {
    this.module.register(ModuleType.TEMPLATE, template);
  }

  generator(generator: Constructor<IGenerator>): void {
    this.module.register(ModuleType.GENERATOR, generator);
  }

  backend(backend: Constructor<IBackend>): void {
    this.module.register(ModuleType.BACKEND, backend);
  }

  async generate(reference: string, input: IGeneratorInput = {}): Promise<IFileSystem> {
    this.logger.time(Timings.OVERALL);
    this.logger.start('Generate job starts');

    try {
      const output = await this.ctx.getSync(Bindings.Pipeline.Generator).pipe({ reference, input });
      this.logger.timeEnd(Timings.OVERALL);

      // All pipe finished, display the elapsed time.
      // And cheer for our success ^.^
      this.logger.success('Generate job successful!');

      return output;
    } catch (error) {
      // Something went wrong while running the generator, maybe bad user input.
      this.logger.fatal('Could not execute the generator job!');

      throw error;
    }
  }

  async compile(path: IPath | string): Promise<IFileSystem> {
    // Convert the path into a Path object if it's provided as a string.
    if (typeof path === 'string') {
      path = new Path(path);
    }

    this.logger.time(Timings.OVERALL);
    this.logger.start('Compiling input path', { path });

    try {
      const output = await this.ctx.getSync(Bindings.Pipeline.Compiler).pipe(path);
      this.logger.timeEnd(Timings.OVERALL);

      // All pipe finished, display the elapsed time.
      // And cheer for our success ^.^
      this.logger.success('Compilation successful!');

      return output;
    } catch (error) {
      // Destruct everything here, send an error
      // report if possible and notify the user about
      // the fatal error, then throw it to propagate
      // to the implementer's error handler.
      this.logger.fatal('Could not compile the input!');

      throw error;
    }
  }
}
