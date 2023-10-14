import { type APIGatewayProxyEvent } from 'aws-lambda'
import ProductAndStockDB from '../db/productAndStock'
import { successResponse, executeHandlers, validateBySchemas } from '../services/utils'
import { validateDataSchema, validateIdSchema } from '../models/product'
import { validateProductId } from '../validators/product'

const schemaValidation = {
  pathParameters: validateIdSchema,
  body: validateDataSchema
}

const handlerCallback = async (event: APIGatewayProxyEvent) => {
  const { id } = event.pathParameters
  const { title, description, count, price } = JSON.parse(event.body)
  await ProductAndStockDB.db.update({
    id, title, description, count, price
  })

  return successResponse({
    success: true
  })
}

export const handler = executeHandlers(
  validateBySchemas(schemaValidation),
  validateProductId,
  handlerCallback
)
