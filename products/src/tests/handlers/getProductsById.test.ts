import { handler } from '../../handlers/getProductsById'
import * as mockedProducts from '../../mocks/products'

describe('getProductsById', () => {
  describe('errors response', () => {
    it('should handle empty product id', async () => {
      jest.spyOn(mockedProducts, 'getProducts').mockResolvedValueOnce(Promise.resolve({ list: [] }))
      const res = await handler({
        pathParameters: {}
      })
      expect(res.statusCode).toBe(404)
      expect(JSON.parse(res.body)).toMatchObject({ id: 'Product not found' })
    })

    it('should handle invalid product id', async () => {
      jest.spyOn(mockedProducts, 'getProducts').mockResolvedValueOnce(Promise.resolve({ list: [] }))
      const res = await handler({
        pathParameters: { id: 'some-fake-id' }
      })
      expect(res.statusCode).toBe(404)
      expect(JSON.parse(res.body)).toMatchObject({ id: 'Product not found' })
    })

    it('should handle exception', async () => {
      jest.spyOn(mockedProducts, 'getProducts').mockRejectedValueOnce(null)
      const res = await handler({
        pathParameters: { id: 'some-fake-id' }
      })
      expect(res.statusCode).toBe(500)
      expect(JSON.parse(res.body)).toMatchObject({ unknown: 'Internal server error' })
    })
  })

  describe('success response', () => {
    it('should return product', async () => {
      const res = await handler({
        pathParameters: { id: '7567ec4b-b10c-48c5-9345-fc73c48a80aa' }
      })
      const responseBody = JSON.parse(res.body)

      expect(res.statusCode).toBe(200)
      expect(responseBody).toMatchObject({ id: '7567ec4b-b10c-48c5-9345-fc73c48a80aa' })
    })
  })
})
