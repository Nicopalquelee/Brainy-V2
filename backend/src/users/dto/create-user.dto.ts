import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength, IsIn } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'usuario@uss.cl' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'usuario123', required: false })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ example: 'Nombre Apellido', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'student', enum: ['student', 'teacher', 'admin'], required: false })
  @IsOptional()
  @IsIn(['student', 'teacher', 'admin'])
  role?: 'student' | 'teacher' | 'admin';
}
