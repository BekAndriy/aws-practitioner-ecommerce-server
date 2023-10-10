import { handler } from '../../handlers/getProductsById'
import ProductAndStockDB from '../../db/productAndStock'

describe('getProductsById', () => {
  describe('errors response', () => {
    it('should handle empty product id', async () => {
      const res = await handler({
        pathParameters: {}
      })
      expect(res.statusCode).toBe(400)
      expect(JSON.parse(res.body)).toHaveProperty('id')
    })

    it('should handle invalid product id', async () => {
      jest.spyOn(ProductAndStockDB.db, 'getItem').mockResolvedValue(null)
      const res = await handler({
        pathParameters: { id: '7567ec4b-b10c-48c5-9345-fc73c48a80ac' }
      })
      expect(res.statusCode).toBe(404)
      expect(JSON.parse(res.body)).toMatchObject({ id: 'Product not found' })
    })

    it('should handle exception', async () => {
      jest.spyOn(ProductAndStockDB.db, 'getItem').mockRejectedValueOnce(null)
      const res = await handler({
        pathParameters: { id: '7567ec4b-b10c-48c5-9345-fc73c48a80aa' }
      })
      expect(res.statusCode).toBe(500)
      expect(JSON.parse(res.body)).toMatchObject({ unknown: 'Internal server error' })
    })
  })

  describe('success response', () => {
    it('should return product', async () => {
      const productData = {
        id: '7567ec4b-b10c-48c5-9345-fc73c48a80aa',
        title: 'Tile',
        price: 12,
        count: 12
      }
      jest.spyOn(ProductAndStockDB.db, 'getItem').mockResolvedValue(productData)
      const res = await handler({
        pathParameters: { id: '7567ec4b-b10c-48c5-9345-fc73c48a80aa' }
      })
      const responseBody = JSON.parse(res.body)

      expect(res.statusCode).toBe(200)
      expect(responseBody).toMatchObject(productData)
    })
  })
})
