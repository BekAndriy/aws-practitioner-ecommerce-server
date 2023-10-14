import { handler } from '../../handlers/catalogBatchProcess'
import * as awsService from '../../services/aws'
import ProductAndStock from '../../db/productAndStock'

describe('catalogBatchProcess handler', () => {
  let createUpdateMany = jest.fn()
  let sendSNSEmail = jest.fn()

  beforeEach(() => {
    createUpdateMany = jest.fn()
    sendSNSEmail = jest.fn()
    jest.spyOn(awsService, 'sendSNSEmail').mockImplementation(sendSNSEmail)
    jest.spyOn(ProductAndStock.db, 'createUpdateMany').mockImplementation(createUpdateMany)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should send email with failed products', async () => {
    await handler({
      Records: [
        { body: '{}' }
      ]
    })
    expect(sendSNSEmail).toHaveBeenCalledTimes(1)
    expect(sendSNSEmail).toHaveBeenCalledWith('Failed to create products.', JSON.stringify([{}]), 'error')
  })

  it('should send email with saved products', async () => {
    const record = { title: 'Title', description: 'Description', price: 15, count: 5 }
    await handler({
      Records: [{ body: JSON.stringify(record) }]
    })
    expect(sendSNSEmail).toHaveBeenCalledTimes(1)
    expect(sendSNSEmail).toHaveBeenCalledWith('Successfully created products', JSON.stringify([record]), 'success')
    expect(createUpdateMany).toHaveBeenCalledWith([record])
  })

  it('should send error and success emails if batch contains valid/invalid products', async () => {
    const validRecord = { title: 'Title', description: 'Description', price: 15, count: 5 }
    const invalidRecord = {}
    await handler({
      Records: [
        { body: JSON.stringify(validRecord) },
        { body: JSON.stringify(invalidRecord) }
      ]
    })
    expect(sendSNSEmail).toHaveBeenCalledTimes(2)
    expect(sendSNSEmail).toHaveBeenNthCalledWith(1, 'Failed to create products.', JSON.stringify([invalidRecord]), 'error')
    expect(sendSNSEmail).toHaveBeenNthCalledWith(2, 'Successfully created products', JSON.stringify([validRecord]), 'success')
    expect(createUpdateMany).toHaveBeenCalledWith([validRecord])
  })

  it('should save all records in one transaction', async () => {
    const validRecord1 = { title: 'Title', description: 'Description', price: 15, count: 5 }
    const validRecord2 = { title: 'Title', description: 'Description', price: 15, count: 5 }
    await handler({
      Records: [
        { body: JSON.stringify(validRecord1) },
        { body: JSON.stringify(validRecord2) }
      ]
    })
    expect(sendSNSEmail).toHaveBeenCalledTimes(1)
    expect(sendSNSEmail).toHaveBeenCalledWith('Successfully created products', JSON.stringify([validRecord1, validRecord2]), 'success')
    expect(createUpdateMany).toHaveBeenCalledTimes(1)
    expect(createUpdateMany).toHaveBeenCalledWith([validRecord1, validRecord2])
  })
})
