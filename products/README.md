# Products service

### NPM Scripts

`build` - is short version of `build:prod`.

`build:prod` - validates code and creates _"dist"_ folder for deployment.

`build:modules` - builds node modules by moving from the root folder and removing all unused.

`rm:dist` - removes _"dist"_ folder by using Nodejs

`lint` - ESLint statically analyzes your code to quickly find problems.

`lint:fix` - analyzes and fixes code issues.

`lint:doc` - validates & builds Swagger documentation. If you get an issue on execution you should install `swagger-cli` globally.

`test` - executes Test cases for handlers.

`test:coverage` - executes Test cases for handlers and analyzes code coverage.

`test:lambda` - launches a test for the lambda function locally by serverless framework. Before run, please change the function name in the "package.json"

`deploy` - deploys lambda functions to the server. Before launch, you should create a build (`npm run build`).

`deploy:doc` - deploys API documentation to S3. API folder _/openapi_. Before launch, your S3 bucket should be created. Bucket creates automatically in the build script.

`remove` - removes lambda function and S3 API Bucket.

### URLs Endpoints

[Swagger API](https://oqczke881c.execute-api.eu-central-1.amazonaws.com/dev/openapi)

[GET Products List](https://oqczke881c.execute-api.eu-central-1.amazonaws.com/dev/products)

[GET Product by ID](https://oqczke881c.execute-api.eu-central-1.amazonaws.com/dev/products/{id})
