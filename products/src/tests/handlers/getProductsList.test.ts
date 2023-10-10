import { handler } from '../../handlers/getProductsList'
import ProductDB from '../../db/product'
import ProductStockDB from '../../db/productStock'

describe('getProductsById', () => {
  describe('errors response', () => {
    it('should handle exception', async () => {
      jest.spyOn(ProductDB.db, 'getItems').mockRejectedValueOnce(null)
      jest.spyOn(ProductStockDB.db, 'getItems').mockRejectedValueOnce(null)
      const res = await handler()

      expect(res.statusCode).toBe(500)
      expect(JSON.parse(res.body)).toMatchObject({ unknown: 'Internal server error' })
    })
  })

  describe('success response', () => {
    it('should return product', async () => {
      const mockProduct1 = {
        description: 'Short Product Description1',
        id: '7567ec4b-b10c-48c5-9345-fc73c48a80aa',
        price: 24,
        title: 'ProductOne'
      }
      const mockProduct2 = {
        description: 'Short Product Description7',
        id: '7567ec4b-b10c-48c5-9345-fc73c48a80a1',
        price: 15,
        title: 'ProductTitle'
      }
      const mockStockProduct1 = {
        productId: '7567ec4b-b10c-48c5-9345-fc73c48a80aa',
        count: 5
      }
      const mockStockProduct2 = {
        productId: '7567ec4b-b10c-48c5-9345-fc73c48a80a1',
        count: 3
      }
      jest.spyOn(ProductDB.db, 'getItems').mockResolvedValue({
        items: [
          mockProduct1, mockProduct2
        ],
        count: 2,
        lastEvaluatedKey: null
      })
      jest.spyOn(ProductStockDB.db, 'getItems').mockResolvedValue({
        items: [
          mockStockProduct1, mockStockProduct2
        ],
        count: 2,
        lastEvaluatedKey: null
      })
      const res = await handler()

      const { list } = (JSON.parse(res.body))

      expect(res.statusCode).toBe(200)
      expect(list[0]).toMatchObject({
        ...mockProduct1,
        count: mockStockProduct1.count
      })
      expect(list[1]).toMatchObject({
        ...mockProduct2,
        count: mockStockProduct2.count
      })
    })
  })
})
