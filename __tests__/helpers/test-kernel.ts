import {
  IKernelConfig,
  Kernel,
  KernelEnvironment,
  ModuleType,
} from '../../src';
import { Bindings } from '../../src/components/container/bindings';
import { ArTestGenerator } from './test-generator';

export class TestKernel extends Kernel {
  constructor(
    config: IKernelConfig = {
      environment: KernelEnvironment.TESTING,
    },
  ) {
    super(config);
  }

  registerTestGenerator() {
    this.getContainer()
      .getSync(Bindings.Module.Handler)
      .register(ModuleType.GENERATOR, ArTestGenerator);
  }
}
