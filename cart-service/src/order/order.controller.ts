import { Controller, Get, Req, UseGuards, HttpStatus } from '@nestjs/common';

import { BasicAuthGuard } from '../auth';
import { AppRequest } from '../shared';

import { OrderService } from './services';

@Controller('api/order')
export class OrderController {
  constructor(
    private orderService: OrderService
  ) { }

  // @UseGuards(JwtAuthGuard)
  @UseGuards(BasicAuthGuard)
  @Get()
  async findOrders(@Req() req: AppRequest) {
    const orders = await this.orderService.getList();
    const parsedOrders = orders.map(this.orderService.prepareResponse)

    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
      data: parsedOrders,
    }
  }

  // @UseGuards(JwtAuthGuard)
  @UseGuards(BasicAuthGuard)
  @Get(':id')
  async findOrder(@Req() req: AppRequest) {
    const order = await this.orderService.getOrder(req.params.id);
    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
      data: this.orderService.prepareResponse(order),
    }
  }
}
