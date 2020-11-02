import { MetadataInspector } from '@loopback/context';
import { Bindings } from '../constants/bindings';
import { Container } from '../container';
import { IBackendMeta } from '../decorators/backend.decorator';
import { IFrontendMeta } from '../decorators/frontend.decorator';
import { IGeneratorMeta } from '../decorators/generator.decorator';
import { Inject } from '../decorators/inject.decorator';
import { ITemplateMeta } from '../decorators/template.decorator';
import { ModuleException } from '../exceptions/module.exception';
import { IBackend, IGenerator } from '../interfaces/backend.interface';
import { Constructor } from '../interfaces/constructor.interface';
import { MissingMetaDataExceptionContext } from '../interfaces/exception-contexts/missing-meta-data.exception-context';
import { MissingModuleBindingExceptionContext } from '../interfaces/exception-contexts/missing-module-binding.exception-context';
import { IFrontend } from '../interfaces/frontend.interface';
import { ITemplate } from '../interfaces/template.interface';
import { IModuleHandler } from './module-handler.interface';
import { IModule } from './module.interface';
import { ModuleType } from './module.type';

type ModuleMeta = ITemplateMeta | IGeneratorMeta | IBackendMeta | IFrontendMeta;
type ModuleData = ITemplate | IGenerator | IBackend | IFrontend;
type RetriveReturn = IModule<ModuleMeta, ModuleData>;

export class ModuleHandler implements IModuleHandler {
  /**
   * Private child context, this is used to separate the modules from the main context.
   */
  private readonly ctx: Container;

  /**
   * Create the kernel module handler with the kernel's context and create the child context for the modules.
   */
  constructor(@Inject(Bindings.Container) kernelContext: Container) {
    this.ctx = new Container(kernelContext, 'modules');
  }

  register(type: ModuleType.FRONTEND, mod: Constructor<IFrontend>): void;
  register(type: ModuleType.TEMPLATE, mod: Constructor<ITemplate>): void;
  register(type: ModuleType.GENERATOR, mod: Constructor<IGenerator>): void;
  register(type: ModuleType.BACKEND, mod: Constructor<IBackend>): void;
  register(type: ModuleType, module: Constructor<ModuleData>): void {
    // Acquire the meta data from the module.
    const meta = this.readMeta<ModuleMeta>(type, module);

    // Create the references.
    const metaRef = this.createMetaReference(type, meta.reference);
    const dataRef = this.createDataReference(type, meta.reference);

    // Register the implementations before the special hooks.
    this.ctx.bind(dataRef).toClass(module).tag(`${type}-data`);
    this.ctx.bind(metaRef).to(meta).tag(`${type}-meta`);

    // Run the special hooks.
    switch (type) {
      case ModuleType.GENERATOR:
        this.onRegisterGenerator(meta as IGeneratorMeta);
        break;
    }
  }

  retrive(type: ModuleType.FRONTEND, reference: string): IModule<IFrontendMeta, IFrontend>;
  retrive(type: ModuleType.TEMPLATE, reference: string): IModule<ITemplateMeta, ITemplate>;
  retrive(type: ModuleType.GENERATOR, reference: string): IModule<IGeneratorMeta, IGenerator>;
  retrive(type: ModuleType.BACKEND, reference: string): IModule<IBackendMeta, IBackend>;
  retrive(type: ModuleType, reference: string): RetriveReturn {
    const metaRef = this.createMetaReference(type, reference);
    const dataRef = this.createDataReference(type, reference);

    if (!this.ctx.contains(dataRef)) {
      throw new ModuleException<MissingModuleBindingExceptionContext>(`Module is not registered`, {
        type,
        reference,
      });
    }

    // Normaly this could not happen, but we check for consistence.
    if (!this.ctx.contains(metaRef)) {
      throw new ModuleException<MissingModuleBindingExceptionContext>(`Module meta is not registered`, {
        type,
        reference,
      });
    }

    // Retrive the implementations.
    const meta = this.ctx.getSync<ModuleMeta>(metaRef);
    const module = this.ctx.getSync<ModuleData>(dataRef);

    return { meta, module };
  }

  search(type: ModuleType.FRONTEND): IModule<IFrontendMeta, IFrontend>[];
  search(type: ModuleType.TEMPLATE): IModule<ITemplateMeta, ITemplate>[];
  search(type: ModuleType.GENERATOR): IModule<IGeneratorMeta, IGenerator>[];
  search(type: ModuleType.BACKEND): IModule<IBackendMeta, IBackend>[];
  search(type: ModuleType): RetriveReturn[] {
    return this.ctx
      .findByTag(`${type}-meta`)
      .map(metaRef => this.retrive(type as any, metaRef.getValue(this.ctx).reference));
  }

  /**
   * Hook to handle special cases when registering a generator module.
   */
  protected onRegisterGenerator(meta: IGeneratorMeta): void {
    if (meta.templates) {
      for (const template of meta.templates) {
        this.register(ModuleType.TEMPLATE, template);
      }
    }
  }

  /**
   * Creates a uniform reference key for module meta in the module context.
   */
  protected createMetaReference(type: ModuleType, reference: string): string {
    return type + '-meta.' + reference;
  }

  /**
   * Creates a uniform reference key for module data in the module context.
   */
  protected createDataReference(type: ModuleType, reference: string): string {
    return type + '-data.' + reference;
  }

  /**
   * Reads the meta data from the kernel module.
   */
  protected readMeta<M>(type: ModuleType, module: Constructor<ModuleData>): M {
    const meta = MetadataInspector.getClassMetadata<M>(type, module);

    // Happens when a class is registered as kernel module but does not have the right or any decorator for it.
    if (typeof meta === 'undefined') {
      throw new ModuleException<MissingMetaDataExceptionContext>('Module missing the required decorator', {
        type,
        module,
      });
    }

    return meta;
  }
}