import { type Handler } from 'aws-lambda'
import { errorsHandler } from '../utils'
import { getProducts } from '../mocks/products'

const handlerCallback: Handler = async () => {
  const obj = await getProducts()
  return {
    ...obj,
    limit: obj.list.length,
    offset: 0,
    total: obj.list.length
  }
}

export const handler = errorsHandler(handlerCallback)
