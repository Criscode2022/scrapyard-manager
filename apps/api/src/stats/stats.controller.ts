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
    const configured = Boolean(process.env.DATABASE_URL?.trim());
    return {
      ok: true,
      db: this.db.mode,
      databaseUrlConfigured: configured,
      service: 'scrapyard-api',
      hint:
        this.db.mode === 'memory' && !configured
          ? 'DATABASE_URL is missing on this host. GitHub Environment secrets are only for Actions — set DATABASE_URL on the deploy host (Grok/Vercel project env vars).'
          : this.db.mode === 'memory' && configured
            ? 'DATABASE_URL is set but Neon mode did not activate (check URL / cold start).'
            : undefined,
    };
  }
}
