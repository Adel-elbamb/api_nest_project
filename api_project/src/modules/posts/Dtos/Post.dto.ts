import { IsAlpha, IsString, length, IsNotEmpty, Length, IsOptional, IsMongoId } from "class-validator";
import { mongo, Types } from "mongoose";

export class PostDto {
    @IsString()
    @IsNotEmpty()
    @Length(3, 20)
    title: string;
    @IsString()
    @IsNotEmpty()
    body: string;
    @IsString()
    @IsOptional()
    image?: string;

    @IsString()
    @IsNotEmpty()
    @IsMongoId()
    createdBy: string; 
}