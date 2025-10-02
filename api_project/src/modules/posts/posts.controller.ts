import { Controller, Post, Body, Get, Patch, Param, Delete, Query } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostDto } from './../posts/Dtos/Post.dto'
import { Post as PostEntity } from 'src/Schemas/Post.Schema';
import { updatePostDto } from './../posts/Dtos/updatePost.dto'

// import {User} from 'src/Schemas/Post.S'

@Controller('posts')
export class PostsController {
    constructor(private readonly postsService: PostsService) { }

    @Post()
    async createPost(@Body() postDto: PostDto): Promise<PostEntity> {
        // console.log(postDto)
        return this.postsService.createPost(postDto);
    }

    @Get()
    async allPosts(
        @Query('limit') limit: number = 10,
        @Query('page') page: number = 1,
        @Query('title') title:string  
    ) {
        return this.postsService.allPosts(limit, page, title);
    }

    // @Get('/posts')
    // async posts(
    //     // @Query('title') title :string 
    // ) {
    //     return this.postsService.posts()
    // }

    @Patch(':id')
    async updatePost(
        @Param('id') id: string,
        @Body() postDto: updatePostDto,
    ): Promise<PostEntity> {
        return this.postsService.updatePost(id, postDto);
    }

    @Delete(':id')
    async deletePost(
        @Param('id') id: string
    ): Promise<string>{
        return this.postsService.deletePost(id)
    }

}
