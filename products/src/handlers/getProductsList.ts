import { type Handler } from 'aws-lambda'
import { errorsHandler, mapArray } from '../utils'
import ProductDB from '../db/product'
import ProductStockDB from '../db/productStock'

const handlerCallback: Handler = async () => {
  const [products, stocks] = await Promise.all([
    ProductDB.db.getItems(),
    ProductStockDB.db.getItems()
  ])
  const mappedStocks = mapArray(stocks.items, 'productId')

  const list = products.items.map((product) => ({
    ...product,
    count: mappedStocks.get(product.id)?.count || 0
  }))
  return {
    list,
    limit: list.length,
    offset: 0,
    total: list.length
  }
}

export const handler = errorsHandler(handlerCallback)
