import { Injectable, Controller, Get, Post, Patch, Param, Delete, Body, HttpCode, UsePipes, ValidationPipe } from '@nestjs/common';
import { CreateUser } from './Dtos/createUser.dto'
import { login } from './Dtos/login.dto'
import  { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/Schemas/User.Schema';
import { Model } from 'mongoose';
import { promises } from 'dns';
import * as bcrypt  from 'bcryptjs'

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private UserModel :Model<User>){}
    
    async adduser(user: CreateUser): Promise<CreateUser> {
        const userExist = await this.UserModel.findOne({ email: user.email })
        if (userExist) {
            throw new Error("user already exist")
        }
        const salt = await bcrypt.genSalt(10)
        const hashPassword  = await bcrypt.hash(user.password, salt)
        const newUser = new this.UserModel({
            ...user,
            password : hashPassword
        })
        return await newUser.save()
    }

    async login(login: login): Promise<CreateUser> {
        const user = await this.UserModel.findOne({ email: login.email })
        if (!user) {
            throw new Error("user is not found ")
        }
        const isMatch = await bcrypt.compare(login.password, user.password)
        if (!isMatch) {
            throw new Error("invalid credentials")
        }
        return user   
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



}
