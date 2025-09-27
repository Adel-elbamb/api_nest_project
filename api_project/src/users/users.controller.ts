import { Controller, Get, Post, Patch, Param, Delete, Body, HttpCode, UsePipes, ValidationPipe  } from '@nestjs/common';
import { CreateUser } from './Dtos/createUser.dto'
import { UsersService } from './users.service';
// make all vailadtions for all nd not add the eny value of data 
@Controller('users')
    @UsePipes(new ValidationPipe({
        whitelist: true,
    forbidNonWhitelisted:true, 
 }))
export class UsersController {
    private users: any[] = [];
    constructor(private _UsersService: UsersService){}
    @Post()
    @HttpCode(201)

    create(@Body() user: CreateUser): Promise<CreateUser> {
      return  this._UsersService.adduser(user)
    }


    @Get()
    findAll(): Promise<CreateUser[]> {
        return this._UsersService.allUser()
    }
    
    @Get(':id')
    async findOne(@Param('id') id: string):Promise<CreateUser> {
        return this._UsersService.oneUser(id);
    }


    @Patch(':id')
    updateUser(@Param('id') userId: string): string {
        const user = this.users.find(u => u.id == userId);
        if (!user) {
            return `User with id ${userId} not found`;
        }
        return `This action updates user with id ${userId}`;
    }

    @Delete(':id')
    deleteUser(@Param('id') id: string): string {
        return `Deleted user ${id}`;
    }
}
