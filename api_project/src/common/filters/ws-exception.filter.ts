// src/common/filters/ws-exception.filter.ts

import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch() 
export class WsExceptionsFilter extends BaseWsExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToWs(); 
        const client = ctx.getClient<Socket>(); 

        
        let message = 'Unknown error occurred';

        if (exception instanceof WsException) {
            message = exception.getError() as string;
        } else if (exception instanceof Error) {
            message = exception.message;
        }

    
        client.emit('exception', {
            status: 'error',
            message,
            time: new Date().toISOString(),
        });

        super.catch(exception, host);
    }
}
