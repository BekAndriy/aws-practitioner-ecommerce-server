import { Module, ExecutionContext } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CacheModule, CacheInterceptor } from '@nestjs/cache-manager';
import { APP_INTERCEPTOR } from '@nestjs/core';

class CacheInterceptorOverride extends CacheInterceptor {
  isRequestCacheable(context: ExecutionContext): boolean {
    const [req] = context.getArgs();
    if (req.url && (req.url as string).startsWith('/import')) {
      return false;
    }
    return super.isRequestCacheable(context);
  }
}

@Module({
  imports: [
    ConfigModule.forRoot(),
    CacheModule.register({
      ttl: 2 * 60 * 1000, // 2 mins in ms
      max: 20, // maximum number of items in cache
    }),
    HttpModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptorOverride,
    },
    AppService,
  ],
})
export class AppModule { }
