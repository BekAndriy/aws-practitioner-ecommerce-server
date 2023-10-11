
export interface Response {
  statusCode: number
  headers: Record<string, string>
  body: string
}

export const response = <T extends object | string>(body: T, statusCode: number): Response => {
  const isStringBody = typeof body === 'string'
  return {
    statusCode,
    headers: {
      'Content-Type': isStringBody ? 'text/plain' : 'application/json',
      // temporary only for development
      'Access-Control-Allow-Origin': '*',
      // 'Access-Control-Allow-Origin': 'https://d20glp57bxrxom.cloudfront.net',
      'Access-Control-Allow-Credentials': 'true'
    },
    body: isStringBody ? body : JSON.stringify(body)
  }
}

export const successResponse = <T extends object>(data: T) => response(data, 200)
export const errorResponse = <T extends object | string>(data: T, code = 400) => {
  return response(typeof data === 'string' ? { unknown: data } : data, code)
}