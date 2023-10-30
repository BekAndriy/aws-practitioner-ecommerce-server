import { Injectable } from '@nestjs/common';

import { PGDB } from 'src/pgdb';
import { CartStatus } from 'src/pgdb/carts/model';
import { CartItem } from 'src/pgdb/cart-items/model';
import { OrderStatus, Order } from 'src/pgdb/orders/model';

@Injectable()
export class OrderService {

  findById(orderId: string) {
    return PGDB.db.orders.findById(orderId);
  }

  async getOrder(orderId: string) {
    const order = await PGDB.db.orders.findById(orderId);
    return (await this.parseOrders([order]))[0]
  }

  async getList() {
    const orders = await PGDB.db.orders.find();
    return this.parseOrders(orders)
  }

  async parseOrders(orders: Order[]) {
    const cartIds = orders.map((order) => order.cartId);
    const cartItems = await PGDB.db.cartItems.findManyByCartId(cartIds);
    const items = cartItems.reduce((res, cartItem) => {
      let orderList = res.get(cartItem.cartId);
      if (!orderList) {
        orderList = [];
        res.set(cartItem.cartId, orderList)
      }
      orderList.push(cartItem);
      return res;
    }, new Map<string, CartItem[]>());

    return orders.map((order) => ({
      ...order,
      items: items.get(order.cartId).map(({ productId, count }) => ({ productId, count }))
    }))
  }

  create(data: any) {
    const { cartId } = data;
    // use transactions to make everything in a proper way
    return PGDB.db.transactionQuery(async () => {
      await PGDB.db.orders.create(data);
      await PGDB.db.carts.updateStatusById(cartId, CartStatus.Ordered);
    })
  }

  async update(orderId: string, status: string) {
    const order = await PGDB.db.orders.updateStatusById(orderId, status as OrderStatus);

    if (!order) {
      throw new Error('Order does not exist.');
    }
    return order;
  }

  prepareResponse(order: Order & { items: Omit<CartItem, 'cartId'>[] }) {
    const { comments: comment, createdAt, items, status, orderId: id, delivery } = order;
    const { firstName, lastName, address } = delivery;
    return {
      id,
      items,
      address: {
        comment,
        firstName,
        lastName,
        address
      },
      statusHistory: [
        {
          status,
          comment,
          timestamp: new Date(createdAt).getTime()
        }
      ]
    }
  }
}
