// src/messages/dto/create-message.dto.ts
import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { Types } from 'mongoose';

export class MessageDto {
    @IsMongoId()
    @Transform(({ value }) => new Types.ObjectId(value))
    senderId: Types.ObjectId;

    @IsMongoId()
    @Transform(({ value }) => new Types.ObjectId(value))
    receiverId: Types.ObjectId;

    @IsString()
    @IsNotEmpty()
    message: string;
}


