import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List shop products (filters + pagination)' })
  @ApiOkResponse({ description: 'Product page' })
  list(@Query() query: ListProductsQueryDto) {
    return this.productsService.list(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Product detail' })
  @ApiOkResponse({ description: 'Product' })
  getOne(@Param('slug') slug: string) {
    return this.productsService.getBySlug(slug);
  }
}
