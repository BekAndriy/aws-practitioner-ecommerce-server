import { type APIGatewayAuthorizerCallback, type APIGatewayTokenAuthorizerEvent } from 'aws-lambda'

const response = (success: boolean, resource: string) => ({
  principalId: 'userAuth',
  policyDocument: {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: success ? 'Allow' : 'Deny',
        Resource: resource
      }
    ]
  }
})

export const handler = (event: APIGatewayTokenAuthorizerEvent, _context: unknown, callback: APIGatewayAuthorizerCallback) => {
  const { methodArn = '', authorizationToken } = event
  try {
    if (!authorizationToken) {
      // 401 Unauthorize
      callback(new Error('Unauthorized'))
      return
    } else if (!authorizationToken.startsWith('Basic ')) {
      throw new Error('Invalid token type')
    }

    // get clean token w\o prefix
    const base64Token = authorizationToken.replace('Basic ', '')

    // decode token
    const data = Buffer.from(base64Token, 'base64').toString('ascii')

    // get user info from data
    const [name, password] = data.split(':')

    if (!name || !process.env[name] || process.env[name] !== password) {
      throw new Error('Invalid credentials')
    }
    // 200 Allowed
    callback(null, response(true, methodArn))
  } catch (e) {
    // 403 Forbidden
    callback(null, response(false, methodArn))
  }
}
