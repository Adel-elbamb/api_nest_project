// src/chat/dto/message.dto.ts
import { IsString, MinLength, IsOptional } from 'class-validator';

export class MessageDto {
 
    @IsString({ message: 'Message must be a string' })
    @MinLength(3, { message: 'Message must be at least 3 characters long' })
    message: string;
}
