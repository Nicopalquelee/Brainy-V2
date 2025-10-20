import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty({ example: 'Apuntes de Algoritmos' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Algoritmos', required: false })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({ example: 'Descripción del contenido del apunte', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'https://storage.example.com/doc.pdf', required: false })
  @IsOptional()
  @IsString()
  contentUrl?: string;

  @ApiProperty({ example: 'PDF', required: false })
  @IsOptional()
  @IsString()
  fileType?: string;

  @ApiProperty({ example: 1024000, required: false })
  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @ApiProperty({ example: 'algoritmos,programacion,estructuras', required: false })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiProperty({ example: '2024-1', required: false })
  @IsOptional()
  @IsString()
  semester?: string;

  @ApiProperty({ example: 2024, required: false })
  @IsOptional()
  @IsNumber()
  year?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
