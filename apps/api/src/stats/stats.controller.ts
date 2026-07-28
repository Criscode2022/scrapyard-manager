import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  getStats() {
    return this.db.stats();
  }

  @Get('health')
  health() {
    return {
      ok: true,
      db: this.db.mode,
      service: 'scrapyard-api',
    };
  }
}
