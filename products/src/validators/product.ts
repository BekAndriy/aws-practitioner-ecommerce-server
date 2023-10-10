import { type APIGatewayProxyEvent } from 'aws-lambda'
import ProductStockDB from '../db/productStock'
import { errorResponse } from '../utils'

// queue middleware to validate product id
// before should have a yup validation model for the required and uuid format handler
export const validateProductId = async (event: APIGatewayProxyEvent) => {
  const record = await ProductStockDB.db.getItem(event.pathParameters.id)

  return record ? null : errorResponse({ id: 'Product not found' }, 404)
}
