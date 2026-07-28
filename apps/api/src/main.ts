import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Request, Response, NextFunction } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';
import { AppModule } from './app.module';

function resolveClientDist(): string | null {
  // Prefer monorepo Angular output, then staged public/ (Vercel / publish)
  const candidates = [
    join(__dirname, '..', '..', 'web', 'dist', 'web', 'browser'),
    join(__dirname, '..', '..', '..', 'public'),
    join(process.cwd(), 'public'),
    join(process.cwd(), 'apps', 'web', 'dist', 'web', 'browser'),
  ];
  for (const dir of candidates) {
    if (existsSync(join(dir, 'index.html'))) return dir;
  }
  return null;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const clientDist = resolveClientDist();
  if (clientDist) {
    app.useStaticAssets(clientDist);
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      if (req.path.startsWith('/api')) return next();
      if (req.path.includes('.')) return next();
      res.sendFile(join(clientDist, 'index.html'));
    });
    // eslint-disable-next-line no-console
    console.log(`Serving SPA from ${clientDist}`);
  }

  const port = Number(process.env.PORT || 8080);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`Scrapyard API listening on 0.0.0.0:${port}`);
}

void bootstrap();
