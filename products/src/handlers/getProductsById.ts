import { type APIGatewayProxyEvent } from 'aws-lambda'
import { type Product } from '../models/product'
import * as yup from 'yup'
import { getProducts } from '../mocks/products'
import { errorResponse, successResponse, executeHandlers, validateBySchemas } from '../utils'

interface Locals {
  product: Product
}

const findProduct = (products: Product[], productId: string) => products.find(({ id }) => id === productId)

const validateProduct = async (event: APIGatewayProxyEvent, locals: Locals) => {
  const mockedProducts = await getProducts()

  const { pathParameters } = event
  const product = findProduct(mockedProducts.list, pathParameters.id)

  if (!product) {
    return errorResponse({ id: 'Product not found' }, 404)
  }
  locals.product = product
  return null
}

const handlerCallback = async (_event: APIGatewayProxyEvent, locals: Locals) => {
  return successResponse(locals.product)
}

export const handler = executeHandlers(
  validateBySchemas({
    pathParameters: yup.object({
      id: yup.string().required('Product not found').uuid()
    }).required()
  }),
  validateProduct,
  handlerCallback
)
