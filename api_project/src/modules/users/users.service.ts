import {
    Injectable,
    NotFoundException,
    InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from 'src/Schemas/User.Schema';
import { UserDto } from './Dtos/User.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private UserModel: Model<UserDocument>
    ) { }
     
    async allUser(): Promise<UserDto[]> {
        const users = await this.UserModel.find().exec();
        return users.map(user => new User(user.toObject()));
    }


    async oneUser(id: string): Promise<UserDto> {
        const user = await this.UserModel.findById(id).exec();
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }

    async updateUser(id: string, updateData: Partial<UserDto>): Promise<UserDto> {
        try {
            if (updateData.password) {
                // hash new password if provided
                const salt = await bcrypt.genSalt(10);
                updateData.password = await bcrypt.hash(updateData.password, salt);
            }

            const updatedUser = await this.UserModel.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true }, // return updated doc
            ).exec();

            if (!updatedUser) {
                throw new NotFoundException('User not found');
            }

            return updatedUser;
        } catch (error) {
            throw new InternalServerErrorException('Failed to update user');
        }
    }

    async deleteUser(id: string): Promise<{ message: string }> {
        const deletedUser = await this.UserModel.findByIdAndDelete(id).exec();
        if (!deletedUser) {
            throw new NotFoundException('User not found');
        }
        return { message: 'User deleted successfully' };
    }
}
