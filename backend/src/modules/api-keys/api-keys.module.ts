import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  LlaveApi,
  LlaveApiScope,
} from '../../database/entities/schema.js';
import { ApiKeysController } from './api-keys.controller.js';
import { ApiKeyGuard } from './api-keys.guard.js';
import { ApiKeyContextMiddleware } from './api-keys.middleware.js';
import { ApiKeysService } from './api-keys.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([LlaveApi, LlaveApiScope])],
  controllers: [ApiKeysController],
  providers: [ApiKeysService, ApiKeyGuard, ApiKeyContextMiddleware],
  exports: [ApiKeysService, ApiKeyContextMiddleware],
})
export class ApiKeysModule {}
