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

// Function that opens a db connection, used below and also from the tests. :/
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
  app.use(compression()); // gzip nice to have
  app.use(token());  // Pulls token out of the auth header, or from the request body. Nifty.

  app.use('/api', apiRoutes);  // Where the magic happens
  app.get('*', (req, res) => res.sendStatus(404));

  // A little hacky looking, but this makes sure we 404 when someone tries to look up
  // /api/users/bljadflkdjf   Since 'bljadflkdjf' can't be cast as a ObjectId, mongoose throws instead of just returning
  // nothing.   We catch these specific kinds of exceptions and 404, the rest of the exceptions we pass on to
  // express' default exception handler.
  app.use((err, req, res, next) => {
    if (err.name === 'CastError' && err.kind === 'ObjectId') return res.sendStatus(404);
    return next();
  });
  return app;
};

// Arguments and defaults here are for testing purposes.  Poor man's dependency injection.
// Called from tests and from our es5 index file.
export default (openDbConnection = mongoConnect, serverConfig = server) => {
  openDbConnection();
  const app = serverConfig();
  const development = config.get('nodeEnv') === 'development';
  app.locals.pretty = development;
  app.use(morgan(development ? 'dev' : 'combined'));
  app.listen(config.get('port'), () => winston.info('Listening on port %d', config.get('port')));
};

