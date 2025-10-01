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
    UseInterceptors,
    ClassSerializerInterceptor,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserDto } from './Dtos/User.dto';
import { AuthenticationsGuard } from '../../common/guards/authentications/authentications.guard';
import { AuthorizationGuard } from 'src/common/guards/authorization/authorization.guard';
import { Roles } from 'src/common/decorators/roles/roles.decorator';


@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @Roles("user","admin")
    @UseGuards(AuthenticationsGuard, AuthorizationGuard)
    allUsers(): Promise<UserDto[]> {
        return this.usersService.allUser();
    }
    
    @Get(':id')
    @Roles("user", "admin")
    @UseGuards(AuthenticationsGuard, AuthorizationGuard)
    oneUser(@Param('id') id: string): Promise<UserDto> {
        return this.usersService.oneUser(id);
    }
    
    @Patch(':id')
    @Roles("admin")
    @UseGuards(AuthenticationsGuard, AuthorizationGuard)
    updateUser(
        @Param('id') id: string,
        @Body() updateData: Partial<UserDto>,
    ): Promise<UserDto> {
        return this.usersService.updateUser(id, updateData);
    }
    
    @Delete(':id')
    @Roles("admin")
    @UseGuards(AuthenticationsGuard, AuthorizationGuard)
    @UseGuards(AuthenticationsGuard)
    deleteUser(@Param('id') id: string): Promise<{ message: string }> {
        return this.usersService.deleteUser(id);
    }
}
