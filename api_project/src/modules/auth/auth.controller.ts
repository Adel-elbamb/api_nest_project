import {
    Controller, Post, Body, HttpCode, UsePipes, ValidationPipe
} from '@nestjs/common';
import { RegesterDto } from './dtos/Regester.dto';
import { LoginDTO } from './dtos/Login.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private _AuthService: AuthService) { }

    @Post()
    @HttpCode(201)
    Regester(@Body() user: RegesterDto): Promise<RegesterDto> {
        return this._AuthService.Regester(user);
    }

    @Post('login')
    @HttpCode(200)
    Login(@Body() login: LoginDTO): Promise<{ token: string; user: { id: string; email: string } }> {
        return this._AuthService.login(login);
    }
}
