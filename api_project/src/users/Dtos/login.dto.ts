import { CreateUser } from './createUser.dto'
import { PickType } from '@nestjs/mapped-types';

export class login extends PickType(CreateUser, ['email', 'password']){

}