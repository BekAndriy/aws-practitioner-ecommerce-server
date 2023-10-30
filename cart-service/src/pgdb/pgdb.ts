import Connect from "./connect";

import Carts from './carts/carts'
import CartItems from './cart-items/cart-items'
import Users from './users/users'
import Orders from './orders/orders'

export class PGDB {
  private constructor(private readonly _client: Connect) { }

  private static _instance: PGDB

  private _carts: Carts;
  private _cartItems: CartItems;
  private _users: Users;
  private _orders: Orders;

  static init(client: Connect) {
    PGDB._instance = new PGDB(client);
  }

  static get db() {
    if (!PGDB._instance) {
      throw new Error('PGDB is not initialized.')
    }
    return PGDB._instance;
  }

  get carts() {
    if (!this._carts) {
      this._carts = new Carts(this._client);
    }
    return this._carts;
  }

  transactionQuery(callback: () => Promise<void>) {
    return this._client.transaction(callback);
  }

  get cartItems() {
    if (!this._cartItems) {
      this._cartItems = new CartItems(this._client);
    }
    return this._cartItems;
  }

  get users() {
    if (!this._users) {
      this._users = new Users(this._client);
    }
    return this._users;
  }

  get orders() {
    if (!this._orders) {
      this._orders = new Orders(this._client);
    }
    return this._orders;
  }
}