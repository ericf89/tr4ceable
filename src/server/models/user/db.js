import mongoose from 'mongoose';
import hashy from 'hashy';

export const schema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    select: true,
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
});

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
