import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { BasicStrategy as Strategy } from 'passport-http';

import { AuthService } from '../auth.service';

@Injectable()
export class BasicStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      passReqToCallback: true
    });
  }

  async validate(req: Request): Promise<any> {
    // console.log(req.headers.authorization);
    const token = (req.headers as unknown as Record<string, string>).authorization;
    const [userId, password] = Buffer.from(token.replace('Basic ', ''), 'base64').toString('utf8').split(':')
    const user = await this.authService.validateUser(userId, password);

    if (!user) {
      throw new UnauthorizedException();
    }
    const { userName } = user;
    return {
      userId, userName
    };
  }
}
