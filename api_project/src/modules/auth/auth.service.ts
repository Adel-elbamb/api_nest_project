import {
    Injectable, ConflictException, UnauthorizedException,
    NotFoundException,
    InternalServerErrorException ,
    UseFilters
} from '@nestjs/common';
import { LoginDTO } from './dtos/Login.dto';
import { InjectModel } from '@nestjs/mongoose';
import {  User } from '../../Schemas/User.Schema';
import { RegesterDto } from './dtos/Regester.dto'
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs'


@Injectable()
export class AuthService {
    constructor(@InjectModel(User.name) private UserModel: Model<User>, private _JwtService: JwtService){}
   
    async Regester(user: RegesterDto): Promise<RegesterDto> {
        try {
            const userExist = await this.UserModel.findOne({ email: user.email });
            if (userExist) {
                throw new ConflictException('User already exists'); // 409 Conflict
            }

            const salt = await bcrypt.genSalt(10);
            const hashPassword = await bcrypt.hash(user.password, salt);

            const newUser = new this.UserModel({
                ...user,
                password: hashPassword,
            });

            return await newUser.save();
        } catch (error) {
            
            if (error instanceof ConflictException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to create user');
        }
    }
    

    async login(login: LoginDTO): Promise<{ token: string; user: { id: string; email: string , role :string } }> {
        try {
            const user = await this.UserModel.findOne({ email: login.email }).exec();
            if (!user) {
                throw new NotFoundException('User not found');
            }

            const isMatch = await bcrypt.compare(login.password, user.password);
            if (!isMatch) {
                throw new UnauthorizedException('Invalid email or password');
            }

            const payload = { id: user._id, email: user.email , role: user.role};
            const token = this._JwtService.sign(payload);

            return {
                token,
                user: {
                    id: user._id.toString(),
                    email: user.email,
                    role:user.role, 
                },
            };
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
                throw error;
            }
            console.error('Login error:', error);
            throw new InternalServerErrorException('Something went wrong during login');
        }
    }
}
