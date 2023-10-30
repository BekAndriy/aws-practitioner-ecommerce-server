import { Controller, Get, Request, Post, UseGuards, HttpStatus, HttpException } from '@nestjs/common';
import { LocalAuthGuard, AuthService, BasicAuthGuard } from './auth';

@Controller()
export class AppController {

  constructor(private authService: AuthService) { }

  @Get(['', 'ping'])
  healthCheck(): any {
    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
    };
  }

  @Post('api/auth/login')
  async login(@Request() req) {
    const { email, password } = req.body;
    const token = await this.authService.login(email, password);

    if (!token) {
      throw new HttpException('Email or password is invalid.', HttpStatus.BAD_REQUEST);
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
      data: {
        ...token,
      },
    };
  }

  @Post('api/auth/register')
  async register(@Request() req) {
    const success = await this.authService.register(req.body);
    if (!success) {
      throw new HttpException('Current email is already used.', HttpStatus.BAD_REQUEST);
    }
    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
      data: {},
    };
  }

  @UseGuards(BasicAuthGuard)
  @Get('api/profile')
  async getProfile(@Request() req) {
    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
      data: {
        user: req.user,
      },
    };
  }
}
