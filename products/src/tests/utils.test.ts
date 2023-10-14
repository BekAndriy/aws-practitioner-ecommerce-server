import * as utils from '../services/utils'

describe('utils', () => {
  describe('convertKeysToCamelCase function', () => {
    it('should convert all keys', () => {
      expect(utils.convertKeysToCamelCase({
        product_id: 'someId',
        product_data_obj: 'someId',
        title: 'title string'
      }))
        .toMatchObject({
          productId: 'someId',
          productDataObj: 'someId',
          title: 'title string'
        })
    })
  })

  describe('convertKeysToSnakeCase function', () => {
    it('should convert all keys', () => {
      expect(utils.convertKeysToSnakeCase({
        productId: 'someId',
        title: 'title string'
      }))
        .toMatchObject({
          product_id: 'someId',
          title: 'title string'
        })
    })
  })
})
