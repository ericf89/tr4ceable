import express from 'express';
import bodyParser from 'body-parser';
import config from 'config';
import compression from 'compression';
import morgan from 'morgan';
import winston from 'winston';
import mongoose from 'mongoose';
import token from 'express-bearer-token';
import cors from 'cors';
import apiRoutes from './models';

mongoose.Promise = Promise;

export const mongoConnect = async () => {
  await mongoose.connect(config.get('mongoUrl'));
  return async () => {
    if (config.get('nodeEnv') === 'test') {
      await mongoose.connection.dropDatabase();
    }
    return mongoose.disconnect();
  };
};

export const server = () => {
  const app = express();

  app.set('port', config.get('port'));
  app.disable('x-powered-by');
  app.use(bodyParser.json());
  app.use(cors());
  app.use(compression());
  app.use(token());

  app.use('/api', apiRoutes);
  app.get('*', (req, res) => res.sendStatus(404));
  app.use((err, req, res, next) => {
    if (err.name === 'CastError' && err.kind === 'ObjectId') return res.sendStatus(404);
    return next();
  });
  return app;
};

export default (openDbConnection = mongoConnect, serverConfig = server) => {
  openDbConnection();
  const app = serverConfig();
  const development = config.get('nodeEnv') === 'development';
  app.locals.pretty = development;
  app.use(morgan(development ? 'dev' : 'combined'));
  app.listen(config.get('port'), () => winston.info('Listening on port %d', config.get('port')));
};

