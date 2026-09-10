import { Controller, Get } from '@nestjs/common';
import { Publico } from './common/decorators/publico.decorator.js';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Publico()
  @Get('health')
  health() {
    return this.appService.health();
  }
}
