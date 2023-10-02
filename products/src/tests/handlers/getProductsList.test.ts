import { handler } from '../../handlers/getProductsList'
import * as mockedProducts from '../../mocks/products'

describe('getProductsById', () => {
  describe('errors response', () => {
    it('should handle exception', async () => {
      jest.spyOn(mockedProducts, 'getProducts').mockRejectedValueOnce(null)
      const res = await handler()

      expect(res.statusCode).toBe(500)
      expect(JSON.parse(res.body)).toMatchObject({ unknown: 'Internal server error' })
    })
  })

  describe('success response', () => {
    it('should return product', async () => {
      const res = await handler()

      expect(res.statusCode).toBe(200)
      expect(Array.isArray(JSON.parse(res.body).list)).toBeTruthy()
    })
  })
})
