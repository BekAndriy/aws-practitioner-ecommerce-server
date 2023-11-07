import serverlessExpress from '@vendia/serverless-express';
import { type Callback, type Context, type Handler } from 'aws-lambda';
import bootstrap from './bootstrap';


let server: Handler;

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  server = server ?? (await bootstrap().then(async (app) => {
    app.enableCors({
      origin: (req, callback) => callback(null, true),
    });
    await app.init();

    const expressApp = app.getHttpAdapter().getInstance();
    return serverlessExpress({ app: expressApp })
  }));
  return server(event, context, callback);
};