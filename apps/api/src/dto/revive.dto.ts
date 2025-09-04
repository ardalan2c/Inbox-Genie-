import { IsInt, IsOptional, IsArray, IsString, Min, Max } from 'class-validator'
import { Transform, Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class ReviveFetchDto {
  @ApiPropertyOptional({ 
    description: 'Number of days since last activity to consider leads dormant',
    minimum: 1,
    maximum: 365,
    example: 30,
    default: 30
  })
  @Transform(({ value }) => value ? parseInt(value, 10) : 30)
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'lastActivityDays must be at least 1' })
  @Max(365, { message: 'lastActivityDays cannot exceed 365 days' })
  lastActivityDays?: number = 30

  @ApiPropertyOptional({ 
    description: 'Lead stages to include in revive',
    example: ['cold', 'warm', 'nurture'],
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  stages?: string[]

  @ApiPropertyOptional({ 
    description: 'Whether this is a dry run (no actual processing)',
    example: false,
    default: false
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  dryRun?: boolean = false
}

export class ReviveEnqueueDto {
  @ApiProperty({ 
    description: 'Cadence ID to use for the revive campaign',
    example: 'cadence_12345'
  })
  @IsString()
  cadenceId!: string

  @ApiProperty({ 
    description: 'Array of lead IDs to enqueue for revive',
    example: ['lead_123', 'lead_456'],
    isArray: true
  })
  @IsArray()
  @IsString({ each: true })
  leadIds!: string[]
}