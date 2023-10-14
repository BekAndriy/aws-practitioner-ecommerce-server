import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

const s3 = new S3Client({});

export const createPresignedUrl = (bucket: string, region: string, key: string) => {
  const client = new S3Client({ region });
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  // expired in 60 seconds
  return getSignedUrl(client, command, {
    expiresIn: 60
  });
};

export const getS3ObjectStream = async (bucketName: string, key: string) => {
  const params = {
    Bucket: bucketName,
    Key: key,
  };
  const command = new GetObjectCommand(params);
  const response = await s3.send(command);

  const body = await response.Body.transformToWebStream();
  return body;
}


export const moveS3Objects = async (bucketName: string, sourceFolder: string, destinationFolder: string, objectToMoveKey: string) => {
  // Define the source and destination object paths
  const sourceObjectKey = `${sourceFolder}/${objectToMoveKey}`;
  const destinationObjectKey = `${destinationFolder}/${objectToMoveKey}`;

  // Copy the object to the destination folder
  const copyObjectParams = {
    Bucket: bucketName,
    CopySource: `${bucketName}/${sourceObjectKey}`,
    Key: destinationObjectKey,
  };

  try {
    await s3.send(new CopyObjectCommand(copyObjectParams));

    // If the copy was successful, delete the source object
    const deleteObjectParams = {
      Bucket: bucketName,
      Key: sourceObjectKey,
    };

    await s3.send(new DeleteObjectCommand(deleteObjectParams));

  } catch (error) {
    console.error(`Error moving ${sourceObjectKey}: ${(error as Error).message}`);
  }
}

const sqs = new SQSClient({});

export const sqsSendMessage = async (sqsQueueUrl: string, body: string) => {
  try {
    const command = new SendMessageCommand({
      QueueUrl: sqsQueueUrl,
      DelaySeconds: 10,
      MessageBody: body,
    });

    const response = await sqs.send(command);
    return response;
  } catch (error) {
    console.error(`Error sending sqs message URL: ${sqsQueueUrl} | ${(error as Error).message}`);
  }
}