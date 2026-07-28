import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Request, Response, NextFunction } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';
import { AppModule } from './app.module';

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

  // Serve Angular production build when present (monolith deploy / preview).
  const clientDist = join(__dirname, '..', '..', 'web', 'dist', 'web', 'browser');
  if (existsSync(clientDist)) {
    app.useStaticAssets(clientDist);
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      if (req.path.startsWith('/api')) return next();
      // Avoid shadowing real static assets with SPA fallback
      if (req.path.includes('.')) return next();
      res.sendFile(join(clientDist, 'index.html'));
    });
  }

  const port = Number(process.env.PORT || 8080);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`Scrapyard API listening on 0.0.0.0:${port}`);
}

void bootstrap();
