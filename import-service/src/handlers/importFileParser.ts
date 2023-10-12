import { S3Event } from 'aws-lambda';
import { parseReadableStream } from '../services/csv'
import { getS3ObjectStream, moveS3Objects } from '../services/aws';



export const handler = async (event: S3Event) => {
  // Get the object from the event and show its content type
  const bucket = event.Records[0].s3.bucket.name;
  const encodedKey = event.Records[0].s3.object.key.replace(/\+/g, ' ')
  const key = decodeURIComponent(encodedKey);

  try {
    const body = await getS3ObjectStream(bucket, key);
    const reader = body.getReader();

    const parser = parseReadableStream(reader);

    parser.on('row-parsed', (record, index) => {
      console.log('Record: ', record, ' / Index: ', index)
    })

    const records = await parser.promise();
    console.log('Records: ', records);

    // move file to another folder
    const [folder, filename] = encodedKey.split('/')
    await moveS3Objects(bucket, folder, 'parsed', decodeURIComponent(filename));
  } catch (err) {
    console.log('Error: ', err)
  }
}