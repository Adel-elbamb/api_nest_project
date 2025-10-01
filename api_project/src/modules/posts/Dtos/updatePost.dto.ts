import { PickType } from "@nestjs/mapped-types";
import { PostDto } from "./Post.dto";


export class updatePostDto extends PickType(PostDto, ['title', 'body']) {}