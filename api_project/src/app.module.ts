import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { config } from 'process';
import { JwtModule } from '@nestjs/jwt';
import { ChatGateway } from './modules/chat/chat.gateway';
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [UsersModule, AuthModule,
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('DB_URL'),
      }),
    }),
    UsersModule,
    ChatModule

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
