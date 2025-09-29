import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersSchema, User } from '../../Schemas/User.Schema'
@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UsersSchema }]),
       JwtModule.registerAsync({
         imports: [ConfigModule],
         inject: [ConfigService],
         useFactory: (configService: ConfigService) => ({
           secret: configService.get<string>('JWT_SECRET'), 
           signOptions: { expiresIn: '1h' },
         }),
         global: true,
       } ),
   ], 
  providers: [AuthService],
  controllers: [AuthController]
})
export class AuthModule {}
