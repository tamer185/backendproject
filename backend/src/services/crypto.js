// services/crypto.js
import bcrypt from 'bcryptjs';

export function cryptoService({ rounds = 10 } = {}) {
  return {
    hash: (p) => bcrypt.hash(p, rounds),
    compare: (p, h) => bcrypt.compare(p, h),
  };
}
