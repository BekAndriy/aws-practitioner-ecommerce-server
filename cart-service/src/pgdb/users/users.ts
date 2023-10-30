import Connect from "../connect";
import { objKeysToCamelCase } from "../utils";
import { User } from './model'

class PGUsers {
  private readonly tableName = 'users'
  constructor(private readonly client: Connect) { }

  findById(userId: string) {
    return this.client.exec(`SELECT * FROM ${this.tableName} WHERE user_id = $1 LIMIT 1;`, [userId])
      .then(({ rows }) => rows.length ? objKeysToCamelCase<User>(rows[0] as object) : null);
  }

  findByEmail(email: string) {
    return this.client.exec(`SELECT * FROM ${this.tableName} WHERE email = $1 LIMIT 1;`, [email])
      .then(({ rows }) => rows.length ? objKeysToCamelCase<User>(rows[0] as object) : null);
  }

  create(data: Pick<User, 'email' | 'password' | 'userName'>) {
    const { email, password, userName } = data;
    const query = `
      INSERT INTO ${this.tableName} (email, password, user_name)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;
    return this.client.exec(query, [email, password, userName])
      .then(({ rows }) => rows[0] as User)
  }

  updateById(userId: string, data: Pick<User, 'email' | 'password' | 'userName'>) {
    const { email, password, userName } = data;
    const query = `
      UPDATE ${this.tableName}
        SET email = $2, password = $3, user_name = $4
        WHERE user_id = $1
        RETURNING *;
    `;
    return this.client.exec(query, [userId, email, password, userName])
      .then(({ rows }) => !!rows.length)
  }

  deleteById(userId: string) {
    const query = `
      DELETE
        FROM ${this.tableName}
        WHERE user_id = $1
        RETURNING *;
    `;
    return this.client.exec(query, [userId])
      .then(({ rows }) => !!rows.length)
  }
}

export default PGUsers