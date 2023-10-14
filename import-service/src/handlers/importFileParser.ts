import { S3Event } from 'aws-lambda';
import { parseReadableStream } from '../services/csv'
import { getS3ObjectStream, moveS3Objects, sqsSendMessage } from '../services/aws';

const requiredColumns = ['title', 'price', 'count'];
const allowedColumns = ['id', 'description', ...requiredColumns];


const mergeRows = (colsNames: string[]) => {
  const colsIndexes: [string, number][] = allowedColumns.map((name) => [name, colsNames.indexOf(name)] satisfies [string, number])
    .filter((item) => item[1] !== -1) || [];

  // list of required fields with indexes
  const requiredIndexes = colsIndexes.filter((item) => requiredColumns.includes(item[0]));

  return (values: string[]) => {
    if (requiredIndexes.length !== requiredColumns.length) return null;

    return colsIndexes.reduce((res, item) => ({
      ...res,
      [item[0]]: values[item[1]]
    }), {} satisfies Record<string, string>);
  }
}

export const handler = async (event: S3Event) => {
  const { SQS_QUEUE_URL } = process.env
  // Get the object from the event and show its content type
  const bucket = event.Records[0].s3.bucket.name;
  const encodedKey = event.Records[0].s3.object.key.replace(/\+/g, ' ')
  const key = decodeURIComponent(encodedKey);

  try {
    const body = await getS3ObjectStream(bucket, key);
    const reader = body.getReader();

    const parser = parseReadableStream(reader);
    let parseData: (values: string[]) => object;

    parser.on('row-parsed', (record, index) => {
      if (!index) {
        parseData = mergeRows(record);
      } else {
        const productData = parseData(record);
        if (productData) {
          sqsSendMessage(SQS_QUEUE_URL, JSON.stringify(productData))
        }
      }
    })

    await parser.promise();

    // move file to another folder
    const [folder, filename] = encodedKey.split('/')
    await moveS3Objects(bucket, folder, 'parsed', decodeURIComponent(filename));
  } catch (err) {
    console.log('Error: ', err)
  }
}