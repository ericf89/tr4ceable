import mongoose from 'mongoose';

export const schema = new mongoose.Schema({
  username: String,
  email: String,
  password: {
    type: String,
    select: false,
  },
});

export default mongoose.model('User', schema);
