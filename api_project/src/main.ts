import { NestFactory } from '@nestjs/core';
import { ValidationPipe, UsePipes } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from 'src/common/filters/globel-filter/globel-filter.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
