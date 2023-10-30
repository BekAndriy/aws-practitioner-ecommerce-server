import helmet from 'helmet';

import bootstrap from './bootstrap';

const port = process.env.PORT || 4000;

bootstrap()
  .then((app) => {
    app.enableCors({
      origin: (req, callback) => callback(null, true),
    });
    app.use(helmet());
    app.listen(port);
  })
  .then(() => {
    console.log('App is running on %s port', port);
  });
