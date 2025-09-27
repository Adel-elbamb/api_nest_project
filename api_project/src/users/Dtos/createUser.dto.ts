import { IsNotEmpty, IsString ,Length} from "class-validator";

export class CreateUser{
    @IsString()
    @IsNotEmpty()
    @Length(2, 20, { message:"errror in this name " })
    name: String;
    @IsString()
    @IsNotEmpty()
    email: String;
    @IsString()
    password: String;

}