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

export type MergedProduct = Product & Pick<ProductStock, 'count'>

export const validateDataObject = {
  title: yup.string().required().min(3).max(250),
  description: yup.string().min(3).max(500),
  count: yup.number().integer().min(0).max(99999),
  price: yup.number().integer().required().min(1).max(999999)
}
export const validateDataSchema = yup.object(validateDataObject).required()

export const validateIdObject = {
  id: yup.string().required().uuid()
}
export const validateIdSchema = yup.object(validateIdObject).required()

export const validateSQSRecordSchema = yup.object({
  ...validateDataObject,
  id: yup.string().uuid()
}).required()
