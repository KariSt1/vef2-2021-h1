import dotenv from 'dotenv';
import { isEmpty } from './validation.js';

dotenv.config();

export function requireEnv(vars = []) {
  const missing = [];

  vars.forEach((v) => {
    if (!process.env[v] || isEmpty(process.env[v])) {
      missing.push(v);
    }
  });

  if (missing.length > 0) {
    console.error(`${missing.join(', ')} vantar í umhverfi`);
    process.exit(1);
  }
}
