import { RegesterDto } from './Regester.dto';
import { PickType } from '@nestjs/mapped-types';

export class LoginDTO extends PickType(RegesterDto, ['email', 'password']){

}