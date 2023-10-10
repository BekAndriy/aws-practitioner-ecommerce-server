import * as yup from 'yup'

export interface Product {
  id: string
  title: string
  description?: string
  price: number
}

export interface ProductStock {
  productId: string
  count: number
}

export const validateDataSchema = yup.object({
  title: yup.string().required().min(3).max(250),
  description: yup.string().min(3).max(500),
  count: yup.number().integer().min(0).max(99999),
  price: yup.number().integer().required().min(1).max(999999)
}).required()

export const validateIdSchema = yup.object({
  id: yup.string().required().uuid()
}).required()
