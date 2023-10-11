import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
const getSignedUrl = jest.fn().mockResolvedValue('aws.url');
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl
}))
import { handler } from '../../handlers/importProductsFile'
import * as awsService from '../../services/aws'

describe('importProductsFile handler', () => {
  const BUCKET_NAME = 'test-example';
  const BUCKET_REGION = 'test';
  const OLD_ENV = process.env

  beforeEach(() => {
    process.env = {
      BUCKET_NAME,
      BUCKET_REGION
    }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  it('should create presigned url', async () => {
    const name = 'file-name.csv';
    const result = await handler({
      queryStringParameters: { name }
    } as any);


    const putCommandArg = getSignedUrl.mock.lastCall[1] as PutObjectCommand;

    expect(getSignedUrl).toHaveBeenCalledTimes(1);
    expect(getSignedUrl.mock.lastCall[0] instanceof S3Client).toBeTruthy();
    expect(putCommandArg instanceof PutObjectCommand).toBeTruthy();
    expect(getSignedUrl.mock.lastCall[2]).toMatchObject({
      expiresIn: 60
    });
    expect(putCommandArg.input.Bucket).toBe(BUCKET_NAME)
    expect(putCommandArg.input.Key).toBe(`uploaded/${name}`)
    expect(JSON.parse(result.body)).toMatchObject({ url: 'aws.url' })
  })

  it('should return error if name is invalid', async () => {
    const name = 'file-name$.csv';
    const result = await handler({
      queryStringParameters: { name }
    } as any);

    expect(result.statusCode).toBe(400)
    expect(JSON.parse(result.body)).toHaveProperty('message')
  })

  it('should return error if on exception', async () => {
    jest.spyOn(awsService, 'createPresignedUrl').mockRejectedValue(null)
    const name = 'file-name.csv';
    const result = await handler({
      queryStringParameters: { name }
    } as any);

    expect(result.statusCode).toBe(500)
    expect(JSON.parse(result.body)).toHaveProperty('message')
  })
})