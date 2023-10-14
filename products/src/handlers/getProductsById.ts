import { type APIGatewayProxyEvent } from 'aws-lambda'
import { type ProductStock, type Product } from '../models/product'
import { errorResponse, executeHandlers, validateBySchemas } from '../services/utils'
import { validateIdSchema } from '../models/product'
import ProductAndStockDB from '../db/productAndStock'

interface Locals {
  product: Product & Pick<ProductStock, 'count'>
}

const schemaValidation = {
  pathParameters: validateIdSchema
}

const validateProduct = async (event: APIGatewayProxyEvent, locals: Locals) => {
  const { pathParameters } = event

  const product = await ProductAndStockDB.db.getItem(pathParameters.id)

  if (!product) {
    return errorResponse({ id: 'Product not found' }, 404)
  }
  locals.product = product
  return null
}

const handlerCallback = async (_event: APIGatewayProxyEvent, locals: Locals) => {
  return locals.product
}

export const handler = executeHandlers(
  validateBySchemas(schemaValidation),
  validateProduct,
  handlerCallback
)
