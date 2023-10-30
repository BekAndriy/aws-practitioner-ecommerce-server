export enum OrderStatus {
  Pending = 'PENDING',
  Processing = 'PROCESSING',
  Shipped = 'SHIPPED',
  Delivered = 'DELIVERED',
  Cancelled = 'CANCELLED'
}

export interface Order {
  orderId: string;
  cartId: string;
  userId: string;
  payment: string;
  delivery: {
    firstName: string;
    lastName: string;
    address: string;
  };
  comments: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}