import { Controller, All, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { Request } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {
    //
  }

  @All('*')
  connectServices(@Req() req: Request) {
    console.log('Load');

    return this.appService.requestData(req);
  }
}
