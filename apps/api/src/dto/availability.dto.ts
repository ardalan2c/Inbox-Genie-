import { IsInt, IsOptional, Max, Min } from 'class-validator'
import { Transform, Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class AvailabilityQueryDto {
  @ApiProperty({ 
    description: 'Duration in minutes for each slot',
    minimum: 15,
    maximum: 480,
    example: 30
  })
  @Type(() => Number)
  @IsInt()
  @Min(15, { message: 'Duration must be at least 15 minutes' })
  @Max(480, { message: 'Duration cannot exceed 8 hours (480 minutes)' })
  durationMin!: number

  @ApiPropertyOptional({ 
    description: 'Number of available slots to return',
    minimum: 1,
    maximum: 50,
    example: 3,
    default: 3
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Count must be at least 1' })
  @Max(50, { message: 'Count cannot exceed 50 slots' })
  count?: number = 3
}