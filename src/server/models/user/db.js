import mongoose from 'mongoose';
import hashy from 'hashy';
import { schema as Package } from '../package/db';

export const schema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    // eslint-disable-next-line no-useless-escape
    validate: [email => /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email), 'Invalid Email'],
  },
  passwordHash: {
    type: String,
    select: false,
  },
  admin: {
    type: Boolean,
    default: false,
    select: false,
  },
  name: {
    type: String,
    select: true,
  },
  phone: {
    type: String,
    select: true,
  },
  packages: {
    type: [Package],
  },
}, { timestamps: true });


class User {
  // We asynchrounsly set the password using this instance method.  Async setters aren't a thing.  I've checked.
  async setPassword(rawPass) {
    // Hashy uses bcrypt by default.
    this.passwordHash = await hashy.hash(rawPass);
  }

  verifyPass(rawAttempt) {
    return hashy.verify(rawAttempt, this.passwordHash);
  }
}

// Mongoose fanciness to merge the methods into our schema.
schema.loadClass(User);

export default mongoose.model('User', schema);
