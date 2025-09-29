import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private _Reflector:Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest();
    const role = req.user.role;
    // to get roles form dectorator 
    const roles = this._Reflector.get<string[]>('roles', context.getHandler());
    if (!roles.includes(role)) {
      throw new UnauthorizedException('You do not have permission to access this resource');
    }
    return true;
  }
}
