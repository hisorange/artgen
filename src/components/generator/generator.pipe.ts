import { Bindings } from '../container/bindings';
import { Inject } from '../container/decorators/inject.decorator';
import { Events } from '../event-handler/events';
import { IEventEmitter } from '../event-handler/interfaces/event-emitter.interface';
import { Timings } from '../event-handler/timings';
import { IFileSystem } from '../file-system';
import { Logger } from '../logger';
import { ILogger } from '../logger/interfaces/logger.interface';
import { IKernelModuleManager } from '../module-handler/interfaces/kernel-module-manager.interface';
import { ModuleType } from '../module-handler/module-type.enum';
import { IPipe } from '../pipes/interfaces/pipe.interface';
import { IRenderer, RenderContext } from '../renderer';
import { SmartString } from '../smart-string';
import { IGeneratorJob } from './generator-job.interface';

export class GeneratorPipe
  implements IPipe<IGeneratorJob, Promise<IFileSystem>>
{
  public constructor(
    @Logger('GeneratorPipe') protected logger: ILogger,
    @Inject(Bindings.Components.EventEmitter)
    protected readonly eventEmitter: IEventEmitter,
    @Inject(Bindings.Provider.OutputFileSystem)
    protected readonly output: IFileSystem,
    @Inject(Bindings.Module.Handler)
    protected readonly module: IKernelModuleManager,
    @Inject(Bindings.Components.Renderer)
    protected readonly renderer: IRenderer,
  ) {}

  public async pipe(job: IGeneratorJob): Promise<IFileSystem> {
    this.logger.time(Timings.COMPILING);
    this.logger.info('Generating output');

    const generator = this.module.retrive(ModuleType.GENERATOR, job.reference);

    this.logger.start('Generator module invoked', {
      generator: generator.meta.name,
    });

    let input = new RenderContext();

    if (job.input) {
      if (typeof job.input === 'function') {
        // Convert the response properties into smart strings.
        const response = await job.input(generator.meta.input);

        for (const prop in response) {
          if (Object.prototype.hasOwnProperty.call(response, prop)) {
            response[prop] = new SmartString(response[prop]);
          }
        }

        input.extend(response);
      } else {
        input.extend(job.input);
      }
    }

    this.renderer.mergeContext(input);

    await generator.module.render(input);

    if (generator.meta.author) {
      this.logger.fav(
        `Thanks for ${generator.meta.author.name} for this awesome generator!`,
      );
    }

    this.renderer.write(
      '.artgenrc',
      JSON.stringify(
        {
          mode: 'generator',
          reference: job.reference,
          input: input,
        },
        null,
        2,
      ),
    );

    this.eventEmitter.publish(Events.COMPILED);
    this.logger.timeEnd(Timings.COMPILING);

    return this.output;
  }
}
