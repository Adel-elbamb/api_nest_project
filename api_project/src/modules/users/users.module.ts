import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MongooseModule, Schema } from '@nestjs/mongoose';
import { UsersSchema, User } from '../../Schemas/User.Schema'


@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UsersSchema }]),],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule { }
