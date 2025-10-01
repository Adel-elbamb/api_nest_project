import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from 'src/Schemas/Post.Schema';
import { User, UsersSchema } from 'src/Schemas/User.Schema' 
@Module({
  imports: [MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UsersSchema  }]),
  ],
  controllers: [PostsController],
  providers: [PostsService]
})
export class PostsModule {}
