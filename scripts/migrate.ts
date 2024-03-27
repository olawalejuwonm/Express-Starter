import 'dotenv/config';

import connectDb from '../src/config/connectDb';

// migrate all profile data to user
import { UserModel } from '../src/models';

const migrate = async () => {
  try {
    await connectDb();
    const users = await UserModel.find();
    console.log('Users found', users.length);

    console.log('Migration successful');
  } catch (error) {
    console.log('Migration failed', error);
  }
};

migrate();
