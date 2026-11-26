import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Health check (includes database)' })
  @ApiOkResponse({ description: 'API and database are healthy' })
  getHealth() {
    return this.healthService.getHealth();
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness check that does not touch the database' })
  @ApiOkResponse({ description: 'The API process is running' })
  getLive() {
    return { success: true, data: { status: 'ok' as const } };
  }
}
