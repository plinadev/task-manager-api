import { ConfigService } from '@nestjs/config';
import { ConfigType } from './app.types';

export class TypedConfigService extends ConfigService<ConfigType> {}
