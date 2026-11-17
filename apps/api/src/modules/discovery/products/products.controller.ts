import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductSlugParamDto } from './dto/product-slug-param.dto';
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
  getOne(@Param() params: ProductSlugParamDto) {
    return this.productsService.getBySlug(params.slug);
  }
}
