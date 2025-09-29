import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class AuthenticationsGuard implements CanActivate {
  constructor(private _jwtService: JwtService, private readonly _configService: ConfigService,) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers['authorization'];
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }
    const [type, token] = authHeader.split(' ');

    if (type !== this._configService.get<string>('BearerKey') || !token) {
      throw new UnauthorizedException('Invalid authorization header format');
    }
    try {
      const payload =  this._jwtService.verifyAsync(token, {
        secret: this._configService.get<string>('JWT_SECRET'), 
      });
      request.user = payload;

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }
}
