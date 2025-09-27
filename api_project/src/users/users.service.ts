import { Injectable, Controller, Get, Post, Patch, Param, Delete, Body, HttpCode, UsePipes, ValidationPipe } from '@nestjs/common';
import { CreateUser } from './Dtos/createUser.dto'
import  { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/Schemas/User.Schema';
import { Model } from 'mongoose';
import { promises } from 'dns';

@Injectable()
export class UsersService {
    private users: CreateUser[] = [];
    constructor(@InjectModel(User.name) private UserModel :Model<User>){}
    
    async adduser(user: CreateUser): Promise<CreateUser> {
        const newUser = await this.UserModel.create(user)
        return newUser
    }

    async allUser(): Promise<CreateUser[]> {
        const alldata = await this.UserModel.find()
        return alldata
    }

    async oneUser(id:string): Promise<CreateUser> {
        const user = await this.UserModel.findById(id)
        if (!user) {
            throw new Error("user is not found ")
        }
        return user 
    }
    // async updateuser(id: string) {
    //     c
    // }


}
