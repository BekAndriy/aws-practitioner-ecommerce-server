import { type APIGatewayProxyEvent, type Handler } from 'aws-lambda'
import { type AnyObjectSchema, type ValidationError } from 'yup'

export type RequireAtLeastOne<T extends object> = {
  [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>;
}[keyof T]

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

export const errorsHandler = (callback: Handler) => async (...args: Partial<Parameters<Handler>>): Promise<Response> => {
  try {
    const result = await callback.apply(null, args as Parameters<Handler>) satisfies Response
    return result.statusCode ? result : successResponse(result)
  } catch (error) {
    return errorResponse('Internal server error', 500)
  }
}

// type APIGatewayProxyHandler = Handler<APIGatewayProxyEvent>

export type ExecuteHandler<T extends object, L extends object> = (event: T, locals: L) => Promise<null | Response | unknown> | null | Response | unknown

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

interface ValidationSchemaOptions {
  errorCode?: number
  parseErrorResponse?: (response: Response) => Response
}

export const validateBySchemas = (data: ValidateSchema | ValidateCallback, options: ValidationSchemaOptions = {}) => async (event: object, locals: object) => {
  const { errorCode, parseErrorResponse } = options
  const schemas = typeof data === 'function' ? await data(event, locals) : data
  const errorsPromises = (Object.keys(schemas) as Array<keyof ValidateSchema>)
    .map((key) => {
      const data = event[key as keyof typeof event]
      const itemData = typeof data === 'string' && key === 'body'
        ? JSON.parse(data)
        : data
      return schemas[key].validate(itemData, { abortEarly: false })
    })
  const results = await Promise.allSettled(errorsPromises)
  const errors: ErrorsObj = results.filter((result) => result.status === 'rejected').reduce<ErrorsObj>((errorsObj: ErrorsObj, res) => {
    const error = (res as PromiseRejectedResult<ValidationError>).reason
    if (error?.inner) {
      error.inner.forEach((e) => {
        errorsObj[e.path ?? 'unknown'] = e.errors[0]
      })
    }
    return errorsObj
  }, {})

  if (Object.keys(errors).length) {
    const response = errorResponse(errors, errorCode)
    return parseErrorResponse ? parseErrorResponse(response) : response
  }
  return null
}

export const logInputData = (event: APIGatewayProxyEvent): null => {
  const { body, headers, httpMethod, path, queryStringParameters, pathParameters } = event

  // task-4 All lambdas do console.log for each incoming requests and their arguments
  console.log({
    body, headers, httpMethod, path, queryStringParameters, pathParameters
  })
  return null
}

export const executeHandlers = (...rest: Array<ExecuteHandler<any, any>>) => errorsHandler(async (event: object) => {
  // for temporary data between executors
  const locals = {}
  for (const handler of [logInputData, ...rest]) {
    const res = await handler(event, locals)
    if (res) {
      return res
    }
  }
  return errorResponse('Internal server error', 500)
})

export const snakeToCamel = (inputString: string): string => {
  if (!inputString) {
    return inputString
  }

  const words = inputString.split('_')

  // Convert the first word to lowercase and capitalize the rest
  const camelCaseWords = words.map((word, index) => {
    return index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  })

  return camelCaseWords.join('')
}

type SnakeToCamelObj<T> = {
  [K in keyof T as K extends string
    ? K extends `${infer F}_${infer R}`
      ? `${Uncapitalize<F>}${Capitalize<R>}`
      : K
    : K]: T[K];
}

export const convertKeysToCamelCase = <T>(inputObject: T): SnakeToCamelObj<T> => {
  if (!inputObject || typeof inputObject !== 'object') {
    return inputObject as any // You can use "as any" to handle non-object types
  }

  const camelCaseObject: Partial<SnakeToCamelObj<T>> = {}

  for (const key in inputObject) {
    if (Object.prototype.hasOwnProperty.call(inputObject, key)) {
      const camelKey = snakeToCamel(key) as keyof typeof camelCaseObject
      camelCaseObject[camelKey] = inputObject[key] as unknown as SnakeToCamelObj<T>[keyof SnakeToCamelObj<T>]
    }
  }

  return camelCaseObject as SnakeToCamelObj<T>
}

export const convertKeysToSnakeCase = <T extends object>(inputObject: object): T => {
  if (!inputObject || typeof inputObject !== 'object') {
    return inputObject as any // You can use "as any" to handle non-object types
  }

  const snakeCaseObject: Partial<T> = {}

  for (const key in inputObject) {
    if (Object.prototype.hasOwnProperty.call(inputObject, key)) {
      const snakeKey = key.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`) as keyof T
      snakeCaseObject[snakeKey] = (inputObject as any)[key]
    }
  }

  return snakeCaseObject as T
}

interface MapArray {
  <T, K extends keyof T>(values: T[], key: K, initMap?: Map<T[K], T>): Map<T[K], T>
  <T, C extends (item: T) => unknown>(values: T[], callback: C, initMap?: Map<ReturnType<C>, T>): Map<ReturnType<C>, T>
}

export const mapArray: MapArray = <T>(
  values: T[],
  key: unknown,
  initMap: Map<unknown, T>
) => {
  const res = values.reduce((
    mapped,
    item
  ) => {
    const parsedKey = typeof key === 'function' ? key(item) : item[key as keyof T]
    return mapped.set(parsedKey, item)
  }, initMap ?? new Map())
  return res
}
