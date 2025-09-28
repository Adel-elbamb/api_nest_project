import { Controller, Get, Post, Patch, Param, Delete, Body, HttpCode, UsePipes, ValidationPipe  } from '@nestjs/common';
import { CreateUser } from './Dtos/createUser.dto'
import { login } from './Dtos/login.dto'
import { UsersService } from './users.service';
import {ConfigService } from '@nestjs/config';
// make all vailadtions for all nd not add the eny value of data 
@Controller('users')
@UsePipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
}))
export class UsersController {
    constructor(private _UsersService: UsersService, private _ConfigService: ConfigService ) { }
    @Post()
    @HttpCode(201)

    create(@Body() user: CreateUser): Promise<CreateUser> {
        return this._UsersService.adduser(user)
    }
    @Post('login')
    @HttpCode(200) 
    login(@Body() login: login): Promise<CreateUser> {
        return this._UsersService.login(login)
    }

    @Get()
    findAll(): Promise<CreateUser[]> {
        // using == process.env ///or // this._ConfigService.get('test')
        // console.log(process.env.test);
        // console.log(this._ConfigService.get('test'))
        return this._UsersService.allUser()
    }
    
    @Get(':id')
    async findOne(@Param('id') id: string): Promise<CreateUser> {
        return this._UsersService.oneUser(id);
    }

}