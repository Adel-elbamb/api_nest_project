// send-message.dto.ts
import { IsOptional, IsString, IsMongoId } from 'class-validator';
import { Types } from 'mongoose';

export class SendMessageDto {
    @IsString()
    message: string; 

    @IsMongoId()
    @IsOptional()
    conversationId?: Types.ObjectId; 

    @IsMongoId()
    @IsOptional()
    userId?: Types.ObjectId;
}
