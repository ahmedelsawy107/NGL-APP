import mongosse from 'mongoose';

import { config } from 'dotenv';
config();

mongosse.connect(process.env.MONGODB_URL);