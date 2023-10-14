import { PutCommand, DeleteCommand, BatchWriteCommand, ScanCommand, DynamoDBDocumentClient, type BatchWriteCommandInput, UpdateCommand, type UpdateCommandInput } from '@aws-sdk/lib-dynamodb'
import { DynamoDBClient, TransactWriteItemsCommand, TransactGetItemsCommand, type TransactGetItem, type TransactWriteItem } from '@aws-sdk/client-dynamodb'
import { convertKeysToCamelCase, convertKeysToSnakeCase } from '../services/utils'

// DB service singleton
abstract class DB {
  private static _docClient: DynamoDBDocumentClient = null

  protected abstract _tableName: string

  get tableName() {
    return this._tableName
  }

  protected get docClient() {
    if (!DB._docClient) {
      const client = new DynamoDBClient({})
      DB._docClient = DynamoDBDocumentClient.from(client)
    }
    return DB._docClient
  }

  protected async putItem<T extends object>(item: T) {
    const command = new PutCommand({
      TableName: this._tableName,
      Item: item
    })

    const response = await this.docClient.send(command)
    return response
  }

  protected async deleteItem<T extends object>(key: T) {
    const command = new DeleteCommand({
      TableName: this._tableName,
      Key: key
    })

    return await this.docClient.send(command)
  }

  protected async queryItems(fields: string[]) {
    const fieldsObj = Object.fromEntries(
      // generate unique keys to prevent reserved names issue
      fields.map((field) => ['#' + Math.random().toString(16).slice(2), field])
    )
    const command = new ScanCommand({
      TableName: this._tableName,
      ProjectionExpression: Object.keys(fieldsObj).join(', '),
      ExpressionAttributeNames: fieldsObj,
      // Limit: 1,
      ConsistentRead: true
    })

    return await this.docClient.send(command).then((res) => ({
      items: res.Items.map(convertKeysToCamelCase),
      count: res.Count,
      lastEvaluatedKey: res.LastEvaluatedKey
    }))
  }

  protected async batchWriteItems(data: BatchWriteCommandInput['RequestItems']) {
    const batchCOmmand = new BatchWriteCommand({
      RequestItems: data
    })

    return await this.docClient.send(batchCOmmand)
  }

  protected async transactWriteItems(items: TransactWriteItem[]) {
    const transactionCommand = new TransactWriteItemsCommand({
      TransactItems: items,
      ReturnItemCollectionMetrics: 'NONE'
    })
    return await this.docClient.send(transactionCommand)
  }

  protected async transactGetItemsItems(items: TransactGetItem[]) {
    const transactionCommand = new TransactGetItemsCommand({
      TransactItems: items,
      ReturnConsumedCapacity: 'NONE'
    })
    return await this.docClient.send(transactionCommand)
  }

  /**
   * Takes a javascript object and transforms it into update expressions on the dynamodb object.
   *
   * It translates all of the actions to SET which will overwrite any attribute that is already there.
   * It works best with simple types but can also serialise arrays and objects.
   *
   * https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/dynamodb-example-dynamodb-utilities.html
   *
   * @param key The primary key name to update on and scsan key
   * @param item The item to update
   */
  protected async upsertProperties(key: Record<string, string>, item: Record<string, any>) {
    const { updateExpression, expressionAttribute, expressionAttributeNames } =
      this.createUpdateExpressions(item)
    const input: UpdateCommandInput = {
      Key: convertKeysToSnakeCase(key),
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeValues: expressionAttribute,
      ExpressionAttributeNames: expressionAttributeNames,
      TableName: this._tableName
    }

    const command = new UpdateCommand(input)
    return await this.docClient.send(command)
  }

  /**
   * We alias properties to be sure we can insert reserved names (status fx).
   *
   * It is a bit complicated:
   * updateExpression: The actual update state, example: SET #alias = :placeholder
   * expressionAttribute: The value to insert in placeholder example: :placeholder = value
   * expressionAttributeNames: Are the aliases properties to avoid clashe: #alias = key
   *
   * So in the end it ties together and both the inserted value and alias are fixed.
   */
  private createUpdateExpressions(item: Record<string, any>) {
    const updateExpression: string[] = []
    const expressionAttribute: Record<string, any> = {}
    const expressionAttributeNames: Record<string, any> = {}
    Object.keys(item).forEach((key) => {
      const placeholder = `:p${key}`
      const alias = `#a${key}`
      updateExpression.push(`${alias} = ${placeholder}`)
      expressionAttribute[placeholder] = item[key]
      expressionAttributeNames[alias] = key
    })
    return { updateExpression, expressionAttribute, expressionAttributeNames }
  }
}

export default DB
