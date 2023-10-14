import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'

const snsClient = new SNSClient({})
const { TOPIC_ARN } = process.env

export const sendSNSEmail = (subject: string, message: string, status: 'success' | 'error') => {
  try {
    const input = {
      TopicArn: TOPIC_ARN,
      Message: message,
      Subject: subject,
      MessageAttributes: {
        productsStatus: {
          DataType: 'String',
          StringValue: status
        }
      }
    }
    const command = new PublishCommand(input)
    return snsClient.send(command)
  } catch (error) {
    console.log('Failed to send SNS message', (error as Error).message)
  }
}
