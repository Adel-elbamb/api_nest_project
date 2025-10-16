import { Types } from 'mongoose';
import { WsException } from '@nestjs/websockets';

export const toObjectId = (id: string): Types.ObjectId => {
    if (!Types.ObjectId.isValid(id)) throw new WsException(`Invalid ObjectId: ${id}`);
    return new Types.ObjectId(id);
};
