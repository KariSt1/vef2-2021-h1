import dotenv from 'dotenv';

dotenv.config();

const {
  DEBUG = false,
} = process.env;

export default function debug(...m) {
  if (DEBUG) {
    console.info(...m);
  }
}
