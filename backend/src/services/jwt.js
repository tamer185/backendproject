import jwtlib from 'jsonwebtoken';
export function jwtService({ secret, ttlHours = 2 }) {
  if (!secret) console.warn('[warn] JWT secret is empty');
  return {
    sign(payload) {
      return jwtlib.sign(payload, secret, { expiresIn: ttlHours * 3600 });
    },
    verify(token) {
      return jwtlib.verify(token, secret);
    }
  };
}
