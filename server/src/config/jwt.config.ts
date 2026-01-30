const isProduction = process.env.NODE_ENV === 'production';
const envSecret = process.env.JWT_SECRET;

if (isProduction && !envSecret) {
  throw new Error('JWT_SECRET environment variable must be set in production');
}

export const JWT_SECRET = envSecret || 'pickchords-dev-secret-key';
export const JWT_EXPIRES_IN = '7d';
