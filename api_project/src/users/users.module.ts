import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MongooseModule, Schema } from '@nestjs/mongoose';
import { usersSchema , User } from './../Schemas/User.Schema'

@Module({
  imports: [MongooseModule.forFeature([{ name:User.name, schema:usersSchema}])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
