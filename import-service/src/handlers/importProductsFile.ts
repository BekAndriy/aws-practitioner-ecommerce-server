import { type APIGatewayProxyEvent } from 'aws-lambda'

import { errorResponse, successResponse } from '../services/response'
import { createPresignedUrl } from '../services/aws';

export const handler = async (event: APIGatewayProxyEvent) => {
  const { BUCKET_NAME, BUCKET_REGION } = process.env

  // expect that name already validated by APIGateway configuration
  // validation config is in serverless.yml
  const { name } = event.queryStringParameters ?? {}
  const decodedName = decodeURIComponent(name);
  if (!/^[a-zA-Z\d\s-_]+\.csv$/.test(decodedName)) {
    return errorResponse({
      message: 'Invalid name pattern. You can use only [a-zA-Z\d\s-_]+.csv'
    }, 400)
  }

  try {
    const fileUploadKey = `uploaded/${decodedName}`;
    const clientUrl = await createPresignedUrl(BUCKET_NAME, BUCKET_REGION, fileUploadKey);

    return successResponse({
      url: clientUrl
    })
  } catch (err) {
    return errorResponse({
      message: 'Internal server error'
    }, 500)
  }
};