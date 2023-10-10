import { type APIGatewayProxyEvent } from 'aws-lambda'
import ProductAndStockDB from '../db/productAndStock'
import { successResponse, executeHandlers, validateBySchemas } from '../utils'
import { validateDataSchema } from '../models/product'

const schemaValidation = {
  body: validateDataSchema
}

const handlerCallback = async (event: APIGatewayProxyEvent) => {
  const body = JSON.parse(event.body)
  const { title, description = '', count = 0, price } = body

  const productId = await ProductAndStockDB.db.create({ description, price, title, count })

  return successResponse({
    productId
  })
}

export const handler = executeHandlers(
  validateBySchemas(schemaValidation),
  handlerCallback
)
