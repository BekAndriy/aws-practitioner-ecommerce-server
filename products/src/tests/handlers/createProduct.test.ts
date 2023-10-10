import { randomUUID } from 'crypto'
import { handler } from '../../handlers/createProduct'
import ProductAndStockDB from '../../db/productAndStock'

describe('createProduct', () => {
  const OLD_ENV = process.env
  beforeEach(() => {
    process.env = {
      DB_PRODUCTS_TABLE_NAME: 'products',
      DB_STOCKS_TABLE_NAME: 'stocks'
    }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  describe('errors response', () => {
    it('should validate required fields', async () => {
      const result = await handler({
        body: JSON.stringify({})
      })
      const resBody = JSON.parse(result.body)

      expect(result.statusCode).toBe(400)
      expect(resBody).toHaveProperty('title')
      expect(resBody).toHaveProperty('price')
    })
  })

  describe('success response', () => {
    it('should create product', async () => {
      const id = randomUUID()
      jest.spyOn(ProductAndStockDB.db, 'create').mockResolvedValueOnce(id)

      const data = {
        title: 'Title',
        description: 'Description',
        price: 15,
        count: 5
      }
      const res = await handler({
        body: JSON.stringify(data)
      })
      const responseBody = JSON.parse(res.body)

      expect(res.statusCode).toBe(200)
      expect(responseBody).toHaveProperty('productId')
      expect(ProductAndStockDB.db.create).toHaveBeenCalledTimes(1)
      expect(responseBody.productId).toBe(id)
    })
  })
})
