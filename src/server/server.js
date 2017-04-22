import express from 'express';
import bodyParser from 'body-parser';
import config from 'config';
import compression from 'compression';
import morgan from 'morgan';
import winston from 'winston';

export const server = () => {
  const app = express();
  const development = config.get('nodeEnv') === 'development';

  app.locals.pretty = development;
  app.set('port', config.get('port'));
  app.disable('x-powered-by');
  app.use(bodyParser.json());
  app.use(compression());
  app.use(morgan(development ? 'dev' : 'combined'));

  app.get('*', (req, res) => res.status(200).json({}));
  return app;
};

export default () => server().listen(config.get('port'), () => winston.info('Listening on port %d', config.get('port')));

