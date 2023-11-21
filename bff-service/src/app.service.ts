import { catchError, firstValueFrom } from 'rxjs';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosRequestConfig } from 'axios';

const allowedHeaders = ['Authorization', 'Content-type'];

@Injectable()
export class AppService {
  constructor(private readonly httpService: HttpService) {
    //
  }

  async requestData(req: Request) {
    const { body, originalUrl, method, headers } = req;
    const [, serviceName, ...rest] = originalUrl.split('/');
    const envName = `SERVICE_${serviceName
      .match(/^[a-zA-Z-_]+/)[0]
      ?.toUpperCase()}`;
    const servicePath = process.env[envName];

    if (!serviceName || !servicePath) {
      // return error, service not fount
      throw new HttpException(
        'Cannot process request',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const serviceReqPath = rest.join('/');
    const requestParams: AxiosRequestConfig = {
      method,
      url: [servicePath, serviceName, serviceReqPath].filter(Boolean).join('/'),
      headers: this.getAllowedHeader(
        headers as Record<string, string>,
        allowedHeaders,
      ),
    };

    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      requestParams.data = body;
    }

    const response = await this.request(requestParams);
    return response.data;
  }

  private getAllowedHeader(headers: Record<string, string>, list: string[]) {
    return list.reduce(
      (res, key) =>
        !headers[key.toLocaleLowerCase()]
          ? res
          : {
            ...res,
            [key]: headers[key.toLocaleLowerCase()],
          },
      {},
    );
  }

  private request(config: AxiosRequestConfig) {
    return firstValueFrom(
      this.httpService.request(config).pipe(
        catchError((error: AxiosError) => {
          // forward error to the client
          throw new HttpException(
            error.response?.data || error.message,
            error.response?.status || error.status || 500,
          );
        }),
      ),
    );
  }
}
