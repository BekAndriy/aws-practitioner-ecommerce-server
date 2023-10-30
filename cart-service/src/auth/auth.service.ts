import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/services/users.service';
import { User } from '../users/models';
import { PGDB } from 'src/pgdb';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
  ) { }

  async validateUser(userId: string, password: string) {
    const user = await this.usersService.findOne(userId);

    if (user && user.password === password) {
      return user;
    }
    return null;
  }

  async register(user: User) {
    const { name, email, password } = user;

    const userRec = await PGDB.db.users.findByEmail(email);

    // already registered
    if (userRec) return false;

    await PGDB.db.users.create({ userName: name, email, password });
    return true;
  }

  login(email: string, password: string) {
    // logic for other tokens can be placed here
    return this.loginBasic(email, password);
  }

  async loginBasic(email: string, password: string) {
    // const payload = { username: user.name, sub: user.id };
    const user = await this.validateUserCredentials(email);

    return user ? {
      token_type: 'Basic',
      access_token: this.encodeUserToken(user.userId, password),
    } : null;
  }

  private validateUserCredentials(email: string) {
    return PGDB.db.users.findByEmail(email);
  }

  // some custom logic for generation token
  private encodeUserToken(email: string, password: string) {
    const buf = Buffer.from([email, password].join(':'), 'utf8');

    return buf.toString('base64');
  }
}
