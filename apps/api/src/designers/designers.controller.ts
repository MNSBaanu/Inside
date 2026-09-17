import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DesignersService } from './designers.service';
import { ListDesignersQueryDto } from './dto/list-designers-query.dto';

@ApiTags('designers')
@Controller('designers')
export class DesignersController {
  constructor(private readonly designersService: DesignersService) {}

  @Get()
  @ApiOperation({ summary: 'List active designers (filters + pagination)' })
  @ApiOkResponse({ description: 'Designer page' })
  list(@Query() query: ListDesignersQueryDto) {
    return this.designersService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Public designer profile with published work' })
  @ApiOkResponse({ description: 'Designer profile' })
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.designersService.getById(id);
  }
}
