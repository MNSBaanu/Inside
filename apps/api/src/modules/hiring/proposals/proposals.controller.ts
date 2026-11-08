import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthUser } from '../../identity/auth/auth.service';
import { CurrentUser } from '../../identity/auth/decorators/current-user.decorator';
import { ClientModeGuard } from '../../identity/auth/guards/client-mode.guard';
import { DesignerModeGuard } from '../../identity/auth/guards/designer-mode.guard';
import { JwtAuthGuard } from '../../identity/auth/guards/jwt-auth.guard';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { ProposalsService } from './proposals.service';

@ApiTags('proposals')
@ApiBearerAuth()
@Controller()
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Post('requests/:requestId/proposals')
  @UseGuards(JwtAuthGuard, DesignerModeGuard)
  @ApiOperation({ summary: 'Submit a proposal (designer)' })
  @ApiCreatedResponse({ description: 'Created' })
  create(
    @CurrentUser() user: AuthUser,
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() dto: CreateProposalDto,
  ) {
    return this.proposalsService.create(user, requestId, dto);
  }

  @Get('requests/:requestId/proposals')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List proposals for a request' })
  @ApiOkResponse({ description: 'Proposals' })
  list(
    @CurrentUser() user: AuthUser,
    @Param('requestId', ParseUUIDPipe) requestId: string,
  ) {
    return this.proposalsService.listByRequestId(user, requestId);
  }

  @Patch('proposals/:id/withdraw')
  @UseGuards(JwtAuthGuard, DesignerModeGuard)
  @ApiOperation({ summary: 'Withdraw proposal (designer)' })
  @ApiOkResponse({ description: 'Withdrawn' })
  withdraw(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.proposalsService.withdraw(user, id);
  }

  @Patch('proposals/:id/reject')
  @UseGuards(JwtAuthGuard, ClientModeGuard)
  @ApiOperation({ summary: 'Reject proposal (client)' })
  @ApiOkResponse({ description: 'Rejected' })
  reject(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.proposalsService.reject(user, id);
  }

  @Patch('proposals/:id/accept')
  @UseGuards(JwtAuthGuard, ClientModeGuard)
  @ApiOperation({ summary: 'Accept proposal and create project (client)' })
  @ApiOkResponse({ description: 'Project created' })
  accept(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.proposalsService.accept(user, id);
  }
}
