require('dotenv').config();
import { readFile } from '../lib/utils/files';

export const constants = {
  JWT_ACCESS_PUBLIC: readFile('public-at.pem'),
  JWT_REFRESH_PUBLIC: readFile('public-rt.pem'),

  JWT_ACCESS_SECRET: readFile('private-at.pem'),
  JWT_REFRESH_SECRET: readFile('private-rt.pem'),

  JWT_ACCESS_EXPIRATION: process.env.JWT_ACCESS_EXPIRATION || '15',
  JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION || '1',

  PORT: process.env.PORT || 4000,
};
