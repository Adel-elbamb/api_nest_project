import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        console.log('Before...');

        return next.handle().pipe(
            map((data) => {
                console.log('After...');
                if (Array.isArray(data)) {
                    return data.map(({ password, ...rest }) => rest);
                } else if (data && typeof data === 'object') {
                    const { password, ...rest } = data;
                    return rest;
                }
                return data; 
            }),
        );
    }
}
