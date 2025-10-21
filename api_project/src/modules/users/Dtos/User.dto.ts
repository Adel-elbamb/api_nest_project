import { IsNotEmpty, IsString, Length, Matches } from "class-validator";
import { UserRole } from './../../../Schemas/user_role.interface'

export class UserDto{
    @IsString()
    @IsNotEmpty()
    @Length(2, 20, { message: "errror in this name " })
    name: String;
    @IsString()
    @IsNotEmpty()
    // @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, { message: 'Invalid email format' })
    email: String;
    @IsString()
    @IsNotEmpty()
    // @Length(6, 20, { message: "errror in this password " })
    // @Matches(/^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/, { message: 'Password must be at least 8 characters long, include one uppercase letter and one number', })
    password: string;
    @IsString()
    role?: UserRole
}
