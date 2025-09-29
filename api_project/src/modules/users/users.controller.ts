import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Delete,
    Body,
    HttpCode,
    UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserDto } from './Dtos/User.dto';
import { AuthenticationsGuard } from '../../common/guards/authentications/authentications.guard';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @UseGuards(AuthenticationsGuard)
    allUsers(): Promise<UserDto[]> {
        return this.usersService.allUser();
    }

    @Get(':id')
    oneUser(@Param('id') id: string): Promise<UserDto> {
        return this.usersService.oneUser(id);
    }

    @Patch(':id')
    updateUser(
        @Param('id') id: string,
        @Body() updateData: Partial<UserDto>,
    ): Promise<UserDto> {
        return this.usersService.updateUser(id, updateData);
    }

    @Delete(':id')
    deleteUser(@Param('id') id: string): Promise<{ message: string }> {
        return this.usersService.deleteUser(id);
    }
}
