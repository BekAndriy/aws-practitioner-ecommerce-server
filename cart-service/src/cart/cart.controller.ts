import { Controller, Get, Delete, Put, Body, Req, Post, UseGuards, HttpStatus } from '@nestjs/common';

import { BasicAuthGuard } from '../auth';
import { OrderService } from '../order';
import { AppRequest, getUserIdFromRequest } from '../shared';

import { CartService } from './services';
import { OrderStatus } from 'src/pgdb/orders/model';

@Controller('api/profile/cart')
export class CartController {
  constructor(
    private cartService: CartService,
    private orderService: OrderService
  ) { }

  // @UseGuards(JwtAuthGuard)
  @UseGuards(BasicAuthGuard)
  @Get()
  async findUserCart(@Req() req: AppRequest) {
    const cart = await this.cartService.findOrCreateByUserId(getUserIdFromRequest(req));

    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
      data: cart,
    }
  }

  // @UseGuards(JwtAuthGuard)
  @UseGuards(BasicAuthGuard)
  @Put()
  async updateUserCart(@Req() req: AppRequest, @Body() body) { // TODO: validate body payload...
    const cart = await this.cartService.updateByUserId(getUserIdFromRequest(req), body.items)

    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
      data: {
        cart
      }
    }
  }

  // @UseGuards(JwtAuthGuard)
  @UseGuards(BasicAuthGuard)
  @Delete()
  async clearUserCart(@Req() req: AppRequest) {
    await this.cartService.removeByUserId(getUserIdFromRequest(req));

    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
    }
  }

  // @UseGuards(JwtAuthGuard)
  @UseGuards(BasicAuthGuard)
  @Post('checkout')
  async checkout(@Req() req: AppRequest, @Body() body) {
    const userId = getUserIdFromRequest(req);
    const cart = await this.cartService.findByUserId(userId);

    if (!(cart && cart.items.length)) {
      const statusCode = HttpStatus.BAD_REQUEST;
      req.statusCode = statusCode

      return {
        statusCode,
        message: 'Cart is empty',
      }
    }

    const { cartId, items } = cart;
    // 'cartId' | 'comments' | 'delivery' | 'status' | 'total' | 'userId' | 'payment'
    const { address } = body;
    const { comment: comments, ...delivery } = address;
    const order = await this.orderService.create({
      userId,
      cartId,
      comments,
      delivery,
      items,
      status: OrderStatus.Pending,
      // should be calculated depends on the Products-service
      // out of the modules scope
      total: 0,
      payment: {},
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
      data: { order }
    }
  }
}
