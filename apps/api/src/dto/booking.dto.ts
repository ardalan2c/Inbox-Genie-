import { IsDateString, IsString, IsOptional, IsEmail, Matches, ValidateNested, IsNotEmpty, MinLength } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class LeadDto {
  @ApiProperty({ 
    description: 'Lead name',
    example: 'John Doe',
    minLength: 1
  })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(1, { message: 'Name cannot be empty' })
  name!: string

  @ApiProperty({ 
    description: 'Phone number in E.164 format',
    example: '+15551234567',
    pattern: '^\\+[1-9]\\d{1,14}$'
  })
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, { 
    message: 'Phone must be in E.164 format (e.g., +15551234567)' 
  })
  phone!: string
}

export class StaffDto {
  @ApiPropertyOptional({ 
    description: 'Staff email address',
    example: 'staff@company.com'
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string
}

export class BookingHoldDto {
  @ApiProperty({ 
    description: 'Slot start time in ISO 8601 format',
    example: '2024-01-15T14:30:00Z'
  })
  @IsDateString({}, { message: 'slotIso must be a valid ISO 8601 date string' })
  slotIso!: string

  @ApiProperty({ 
    description: 'Tenant ID',
    example: 'demo-tenant'
  })
  @IsString()
  @IsNotEmpty({ message: 'tenantId is required' })
  tenantId!: string
}

export class BookingConfirmDto {
  @ApiProperty({ 
    description: 'Slot start time in ISO 8601 format',
    example: '2024-01-15T14:30:00Z'
  })
  @IsDateString({}, { message: 'slotIso must be a valid ISO 8601 date string' })
  slotIso!: string

  @ApiProperty({ 
    description: 'Tenant ID',
    example: 'demo-tenant'
  })
  @IsString()
  @IsNotEmpty({ message: 'tenantId is required' })
  tenantId!: string

  @ApiProperty({ 
    description: 'Lead information',
    type: LeadDto
  })
  @ValidateNested()
  @Type(() => LeadDto)
  lead!: LeadDto

  @ApiPropertyOptional({ 
    description: 'Staff information',
    type: StaffDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => StaffDto)
  staff?: StaffDto
}