const dbBase = require('./dbBase').init;

const createCartStatusScript = `
  DO $$ 
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
      CREATE TYPE cart_status AS ENUM ('OPEN', 'ORDERED');
    END IF;
  END $$;
`;

const createOrderStatusScript = `
  DO $$ 
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
      CREATE TYPE order_status AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');
    END IF;
  END $$;
`;

const createCartsTableScript = `
  CREATE TABLE IF NOT EXISTS carts (
    cart_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status cart_status NOT NULL
  );
`;

const createCartItemsTableScript = `
  CREATE TABLE IF NOT EXISTS cart_items (
    cart_id UUID REFERENCES carts(cart_id) ON DELETE CASCADE NOT NULL,
    product_id UUID NOT NULL,
    count INTEGER NOT NULL,
    PRIMARY KEY (cart_id, product_id)
  );
`;

const createOrdersTableScript = `
  CREATE TABLE IF NOT EXISTS orders (
    order_id UUID DEFAULT gen_random_uuid() PRIMARY KEY UNIQUE NOT NULL,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    cart_id UUID REFERENCES carts(cart_id) ON DELETE CASCADE NOT NULL,
    payment JSON,
    delivery JSON,
    comments TEXT,
    status order_status NOT NULL,
    total NUMERIC,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );
`;

const createUsersTableScript = `
  CREATE TABLE IF NOT EXISTS users (
    user_id UUID DEFAULT gen_random_uuid() PRIMARY KEY UNIQUE NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );
`;

const updateTimestampFunctionScript = `
  CREATE OR REPLACE FUNCTION update_timestamp()
  RETURNS TRIGGER AS $$
  BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
`;

const updateUserTimestampTriggerScript = `
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1
                  FROM pg_trigger
                  WHERE tgname = 'update_user_timestamp_trigger') THEN
      CREATE TRIGGER update_user_timestamp_trigger
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_timestamp();
    END IF;
  END $$;  
`;

const updateCartTimestampTriggerScript = `
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1
                  FROM pg_trigger
                  WHERE tgname = 'update_cart_timestamp_trigger') THEN
      CREATE TRIGGER update_cart_timestamp_trigger
      BEFORE UPDATE ON carts
      FOR EACH ROW
      EXECUTE FUNCTION update_timestamp();
    END IF;
  END $$;
`;

const updateOrderTimestampTriggerScript = `
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1
                FROM pg_trigger
                WHERE tgname = 'update_order_timestamp_trigger') THEN
    CREATE TRIGGER update_order_timestamp_trigger
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();
  END IF;
END $$;
`;

(async () => {
  const dbClient = await dbBase();
  // create custom enum types
  await dbClient.query(createCartStatusScript);
  await dbClient.query(createOrderStatusScript);

  // create "users" table if it is not exist
  await dbClient.query(createUsersTableScript);
  // create "carts" table if it is not exist
  await dbClient.query(createCartsTableScript);
  // create "cart_items" table if it is not exist
  await dbClient.query(createCartItemsTableScript);
  // create "orders" table if it is not exist
  await dbClient.query(createOrdersTableScript);
  // create function for updating timestamps automatically
  await dbClient.query(updateTimestampFunctionScript);
  // triggers for update timestamps
  await dbClient.query(updateUserTimestampTriggerScript);
  await dbClient.query(updateCartTimestampTriggerScript);
  await dbClient.query(updateOrderTimestampTriggerScript);

  process.exit()
})()