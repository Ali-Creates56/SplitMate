import { connectDB, User } from './db.js';

connectDB().then(async () => {
  await User.updateMany({}, { avatarUrl: '/default_avatar.png' });
  console.log('Avatars updated');
  process.exit(0);
}).catch(console.error);
