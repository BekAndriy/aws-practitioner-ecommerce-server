import { type APIGatewayProxyEvent } from 'aws-lambda'
import ProductAndStockDB from '../db/productAndStock'
import { successResponse, executeHandlers, validateBySchemas } from '../utils'
import { validateIdSchema } from '../models/product'
import { validateProductId } from '../validators/product'

const schemaValidation = {
  pathParameters: validateIdSchema
}

const handlerCallback = async (event: APIGatewayProxyEvent) => {
  await ProductAndStockDB.db.delete(event.pathParameters.id)

  return successResponse({
    success: true
  })
}

export const handler = executeHandlers(
  validateBySchemas(schemaValidation),
  validateProductId,
  handlerCallback
)
