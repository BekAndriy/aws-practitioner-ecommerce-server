import { Injectable } from '@nestjs/common';

import { UpdateCartItem } from '../models';
import { PGDB } from 'src/pgdb';
import { CartStatus } from 'src/pgdb/carts/model';

@Injectable()
export class CartService {
  async findByUserId(userId: string) {
    const cart = await PGDB.db.carts.findByUserId(userId, CartStatus.Open);
    // this should be implemented throw the JOINs but for AWS course it is enough
    if (cart) {
      const items = await PGDB.db.cartItems.findManyByCartId(cart.cartId);
      return {
        ...cart,
        items
      }
    }
    return null;
  }

  createByUserId(userId: string) {
    return PGDB.db.carts.create({ userId });
  }

  async findOrCreateByUserId(userId: string) {
    let userCart = await PGDB.db.carts.findByUserId(userId, CartStatus.Open);
    const items = userCart?.cartId ? await PGDB.db.cartItems.findManyByCartId(userCart.cartId) : [];
    userCart ??= await this.createByUserId(userId)
    const { cartId } = userCart

    return {
      cartId,
      items
    }
  }

  async updateByUserId(userId: string, items: UpdateCartItem[]) {
    const cart = await this.findOrCreateByUserId(userId);
    const { cartId } = cart;

    const updatedCart = {
      ...cart,
      items: [...items],
    }

    await PGDB.db.cartItems.delete(cartId);
    if (items.length) {
      await PGDB.db.cartItems.createMany(cartId, items);
    }

    return { ...updatedCart };
  }

  updateStatusById(cartId: string, status: CartStatus) {
    return PGDB.db.carts.updateStatusById(cartId, status);
  }

  async removeByUserId(userId) {
    await PGDB.db.carts.deleteByUserId(userId, CartStatus.Open)
  }

}
