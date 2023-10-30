const dbBase = require('./dbBase').init;

const insertUsersScript = `
  INSERT INTO users (user_id, user_name, email, password)
  VALUES
    ('e35aa9db-6e6e-4d07-af3e-336b5cfbe1e1', 'Name 1', 'Email1@test.com', 'password 1'),
    ('f00f0121-7c00-4d20-8f01-2071e991bf5e', 'Name 2', 'Email2@test.com', 'password 2'),
    ('a152a4ea-3e08-4d5d-8a5d-50e86d45a021', 'Name 3', 'Email3@test.com', 'password 3'),
    ('8b7b0e7e-ff13-4eef-9ce4-80e7efcf741b', 'Name 4', 'Email4@test.com', 'password 4'),
    ('d5ce4c10-9e35-40d7-9326-1aa21f3c6eb8', 'Name 5', 'Email5@test.com', 'password 5');
`;

// Insert 10 test carts
const insertCartsScript = `
  INSERT INTO carts (cart_id, user_id, created_at, updated_at, status)
  VALUES
    ('fcc6dcc0-a634-4df5-a236-a74d7c8da225', 'e35aa9db-6e6e-4d07-af3e-336b5cfbe1e1', '2023-10-24', '2023-10-24', 'OPEN'),
    ('4ea16b44-db80-416f-8958-94c81b6474a7', 'e35aa9db-6e6e-4d07-af3e-336b5cfbe1e1', '2023-10-23', '2023-10-23', 'OPEN'),
    ('15cbe7aa-4189-42ba-b4fe-836c1bf443cc', 'f00f0121-7c00-4d20-8f01-2071e991bf5e', '2023-10-22', '2023-10-22', 'ORDERED'),
    ('78d03dc7-d29c-4a62-91e9-d3c172462c1f', 'f00f0121-7c00-4d20-8f01-2071e991bf5e', '2023-10-21', '2023-10-21', 'OPEN'),
    ('8e295ada-0f4c-4fd8-a155-ac22a3497d6f', 'a152a4ea-3e08-4d5d-8a5d-50e86d45a021', '2023-10-20', '2023-10-20', 'ORDERED'),
    ('64e1dab3-7a60-46e6-8b03-2e1f17e3bb40', 'a152a4ea-3e08-4d5d-8a5d-50e86d45a021', '2023-10-19', '2023-10-19', 'OPEN'),
    ('a72f0972-64b3-4c70-bff7-179c753d2b35', '8b7b0e7e-ff13-4eef-9ce4-80e7efcf741b', '2023-10-18', '2023-10-18', 'OPEN'),
    ('94354c25-6eb7-47cc-8c3c-38f3c0b07a79', '8b7b0e7e-ff13-4eef-9ce4-80e7efcf741b', '2023-10-17', '2023-10-17', 'ORDERED'),
    ('017b5b6e-509e-43c5-9f5a-e8a2bb19ce97', 'd5ce4c10-9e35-40d7-9326-1aa21f3c6eb8', '2023-10-16', '2023-10-16', 'OPEN'),
    ('db6b26b1-c4ce-462c-8b0a-22b4bf42f2b0', 'd5ce4c10-9e35-40d7-9326-1aa21f3c6eb8', '2023-10-15', '2023-10-15', 'ORDERED');
`;

// Insert 10 test cart items
const insertCartItemsScript = `
  INSERT INTO cart_items (cart_id, product_id, count)
  VALUES
    ('fcc6dcc0-a634-4df5-a236-a74d7c8da225', '11111111-1111-1111-1111-111111111111', 3),
    ('4ea16b44-db80-416f-8958-94c81b6474a7', '22222222-2222-2222-2222-222222222222', 2),
    ('15cbe7aa-4189-42ba-b4fe-836c1bf443cc', '33333333-3333-3333-3333-333333333333', 5),
    ('8e295ada-0f4c-4fd8-a155-ac22a3497d6f', '44444444-4444-4444-4444-444444444444', 1),
    ('8e295ada-0f4c-4fd8-a155-ac22a3497d6f', '55555555-5555-5555-5555-555555555555', 4),
    ('8e295ada-0f4c-4fd8-a155-ac22a3497d6f', '66666666-6666-6666-6666-666666666666', 2),
    ('8e295ada-0f4c-4fd8-a155-ac22a3497d6f', '77777777-7777-7777-7777-777777777777', 1),
    ('8e295ada-0f4c-4fd8-a155-ac22a3497d6f', '88888888-8888-8888-8888-888888888888', 6),
    ('8e295ada-0f4c-4fd8-a155-ac22a3497d6f', '99999999-9999-9999-9999-999999999999', 2),
    ('8e295ada-0f4c-4fd8-a155-ac22a3497d6f', '10101010-1010-1010-1010-101010101010', 3);
`;

(async () => {
  const dbClient = await dbBase();

  await dbClient.query(insertUsersScript);
  await dbClient.query(insertCartsScript);
  await dbClient.query(insertCartItemsScript);

  process.exit()
})()

