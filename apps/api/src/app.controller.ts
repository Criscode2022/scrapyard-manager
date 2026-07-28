import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  root() {
    return {
      name: 'Scrapyard Manager API',
      version: '1.0.0',
      endpoints: ['/api/cars', '/api/parts', '/api/stats', '/api/stats/health'],
    };
  }
}
