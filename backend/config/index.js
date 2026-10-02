import dotenv from 'dotenv';
dotenv.config();

const requiredEnvs = ['JWT_SECRET'];

// In production, enforce that all essential environment variables are set
if (process.env.NODE_ENV === 'production') {
  requiredEnvs.forEach((envVar) => {
    if (!process.env[envVar]) {
      throw new Error(`CRITICAL: Environment variable ${envVar} is missing!`);
    }
  });
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/focusdesk',
  jwtSecret: process.env.JWT_SECRET || 'focusdesk_super_secret_key_change_me_in_prod',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
};

export default config;
