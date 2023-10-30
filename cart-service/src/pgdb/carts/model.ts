export enum CartStatus {
  Open = 'OPEN',
  Ordered = 'ORDERED'
}

export interface Cart {
  cartId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  status: CartStatus;
}