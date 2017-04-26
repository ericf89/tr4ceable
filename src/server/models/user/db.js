import mongoose from 'mongoose';
import hashy from 'hashy';
import { schema as Package } from '../package/db';

export const schema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
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
  packages: {
    type: [Package],
  },
}, { timestamps: true });

class User {
  async setPassword(rawPass) {
    this.passwordHash = await hashy.hash(rawPass);
  }

  verifyPass(rawAttempt) {
    return hashy.verify(rawAttempt, this.passwordHash);
  }
}

schema.loadClass(User);

export default mongoose.model('User', schema);
