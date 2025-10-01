import { Injectable, NotFoundException } from '@nestjs/common';
import { PostSchema, Post } from 'src/Schemas/Post.Schema';   
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PostDto } from './Dtos/Post.dto';
import { User } from 'src/Schemas/User.Schema'
import { PostDocument } from 'src/Schemas/Post.Schema'
import { updatePostDto } from 'src/modules/posts/Dtos/updatePost.dto'

@Injectable()
export class PostsService {
    constructor(
        @InjectModel(Post.name) private postModel: Model<PostDocument>,
        @InjectModel(User.name) private userModel: Model<User>,
    ) { }
    // async CreatePost(Post:Post):P



    async createPost(postDto: PostDto): Promise<Post> {
        const userExist = await this.userModel.findById(postDto.createdBy);
        if (!userExist) {
            throw new NotFoundException('User not found');
        }

        const newPost = await this.postModel.create(postDto);
        // console.log(newPost)
        return newPost
    }

    async allPosts(limit: number = 10, page: number = 1, title?: string) {
        const skip = (page - 1) * limit;

        const filter = title
            ? { title: { $regex: title, $options: 'i' } }
            : {};

        
        const posts = await this.postModel
            .find(filter)
            .populate('createdBy', 'name email')
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await this.postModel.countDocuments(filter);

        return {
            data: posts,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async updatePost(id: string, postDto: updatePostDto): Promise<Post> {
        const post = await this.postModel.findByIdAndUpdate(id, postDto, { new: true })
        if (!post) {
            throw new NotFoundException("post is not found ")
        }

        return post
    }

    async deletePost(id: string): Promise<string> {
        const post = await this.postModel.findByIdAndUpdate({ _id: id })
        if (!post) {
            throw new NotFoundException("post is not found ")
        }
        return "post deleted sucessfully "
    }
    // using the aggragation pipline
        async posts(title?: string): Promise<any> {
            const posts = await this.postModel.aggregate([
                {
                    $match: title ? { title: { $regex: title, $options: 'i' } } : {}
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "createdBy",
                        foreignField: "_id",
                        as: "ownerPost"
                    }
                },
                {
                    $unwind: "$ownerPost"
                },
                {
                    $project: {
                        title: 1,
                        body: 1,
                        "ownerPost.name": 1,
                        "ownerPost.email": 1
                    }
                }
            ]);

            return posts;
        }
    }



//     async posts(): Promise<any> {
//         const posts = await this.postModel.aggregate([
//             {
//                 $lookup: {
//                     from: "users",              // collection name
//                     localField: "createdBy",    // الحقل في posts
//                     foreignField: "_id",        // الحقل في users
//                     as: "ownerPost"
//                 }
//             },
//             {
//                 $unwind: "$ownerPost" // عشان ما يبقاش Array
//             },
//             {
//                 $project: {
//                     title: 1,
//                     body: 1,
//                     "ownerPost.name": 1,
//                     "ownerPost.email": 1
//                 }
//             }
//         ]);

//         return posts;
//     }
// }