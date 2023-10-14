import { type SQSEvent } from 'aws-lambda'
import { validateSQSRecordSchema } from '../models/product'
import { executeHandlers } from '../services/utils'
import ProductAndStockDB from '../db/productAndStock'
import { sendSNSEmail } from '../services/aws'

const handlerCallback = async (event: SQSEvent) => {
  const records = event.Records.map(({ body }) => JSON.parse(body))
    .map((record) => {
      try {
        validateSQSRecordSchema.validateSync(record)
        return [true, record]
      } catch {
        return [false, record]
      }
    })
  const successValidatedRecords = records.filter((record) => record[0]).map((record) => record[1])
  const failedValidatedRecords = records.filter((record) => !record[0]).map((record) => record[1])

  // send email with list of invalid products
  if (failedValidatedRecords.length) {
    await sendSNSEmail('Failed to create products.', JSON.stringify(failedValidatedRecords), 'error')
  }
  if (successValidatedRecords.length) {
    // create/update all products by one batch request
    await ProductAndStockDB.db.createUpdateMany(successValidatedRecords)
    await sendSNSEmail('Successfully created products', JSON.stringify(successValidatedRecords), 'success')
  }
}

export const handler = executeHandlers(
  handlerCallback
)
