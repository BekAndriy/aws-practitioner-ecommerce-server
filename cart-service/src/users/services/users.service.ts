import { Injectable } from '@nestjs/common';

import { User } from '../models';
import { PGDB } from '../../pgdb';

@Injectable()
export class UsersService {
  findOne(userId: string) {
    return PGDB.db.users.findById(userId);
  }


  createOne({ name, password, email }: User) {
    return PGDB.db.users.create({ email, password, userName: name })
  }
}
