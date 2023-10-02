import { type Handler } from 'aws-lambda'
import { type AnyObjectSchema, type ValidationError } from 'yup'

export type RequireAtLeastOne<T extends object> = {
  [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>;
}[keyof T]

interface Response {
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

export const errorsHandler = (callback: Handler) => async (...args: Partial<Parameters<Handler>>): Promise<Response> => {
  try {
    const result = await callback.apply(null, args as Parameters<Handler>) satisfies Response
    return result.statusCode ? result : successResponse(result)
  } catch (error) {
    return errorResponse('Internal server error', 500)
  }
}

// type APIGatewayProxyHandler = Handler<APIGatewayProxyEvent>

export type ExecuteHandler<T extends object, L extends object> = (event: T, locals: L) => Promise<null | Response> | null | Response

interface ValidateSchemaData {
  pathParameters?: AnyObjectSchema
  body?: AnyObjectSchema
  queryStringParameters?: AnyObjectSchema
  [key: string]: AnyObjectSchema
}

type ValidateSchema = RequireAtLeastOne<ValidateSchemaData>

type ValidateCallback = (event: object, locals: object) => ValidateSchema | Promise<ValidateSchema>

type ErrorsObj = Record<string, string>

interface PromiseRejectedResult<T = unknown> {
  status: 'rejected'
  reason: T
}

export const validateBySchemas = (data: ValidateSchema | ValidateCallback) => async (event: object, locals: object) => {
  const schemas = typeof data === 'function' ? await data(event, locals) : data
  const errorsPromises = (Object.keys(schemas) as Array<keyof ValidateSchema>)
    .map((key) => {
      const itemData = event[key as keyof typeof event]
      return schemas[key].validate(itemData)
    })
  const results = await Promise.allSettled(errorsPromises)
  const errors: ErrorsObj = results.filter((result) => result.status).reduce<ErrorsObj>((errorsObj: ErrorsObj, res) => {
    const error = (res as PromiseRejectedResult<ValidationError>).reason
    if (error?.inner) {
      error.inner.forEach((e) => {
        errorsObj[e.path ?? 'unknown'] = e.errors[0]
      })
    }
    return errorsObj
  }, {})
  return Object.keys(errors).length ? errorResponse(errors) : null
}

export const executeHandlers = (...rest: Array<ExecuteHandler<any, any>>) => errorsHandler(async (event: object) => {
  // for temporary data between executors
  const locals = {}
  for (const handler of rest) {
    const res = await handler(event, locals)
    if (res) {
      return res
    }
  }
  return errorResponse('Internal server error', 500)
})
