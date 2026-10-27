import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import config from '../config/index.js';

export const registerUser = async ({ fullName, email, password, role, phoneNumber, city }) => {
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    const error = new Error('Email is already registered');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = bcrypt.hashSync(password, 10);

  const user = await User.create({
    name: fullName,
    email: email.toLowerCase(),
    password: passwordHash,
    role,
    phone: phoneNumber,
    city: city || '',
  });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  if (user.isBlocked) {
    const error = new Error('Your account has been blocked. Please contact support.');
    error.statusCode = 403;
    throw error;
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

export const googleLoginUser = async ({ idToken, role = 'student' }) => {
  if (!idToken) {
    const error = new Error('Google ID token is required');
    error.statusCode = 400;
    throw error;
  }

  let payload;
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!res.ok) {
      const error = new Error('Invalid or expired Google token');
      error.statusCode = 401;
      throw error;
    }
    payload = await res.json();
  } catch (err) {
    const error = new Error('Failed to verify Google token with Google servers');
    error.statusCode = 401;
    throw error;
  }

  const { sub: googleId, email, name, picture } = payload;
  if (!email) {
    const error = new Error('Google account does not have a verified email');
    error.statusCode = 400;
    throw error;
  }

  let user = await User.findOne({
    $or: [{ googleId }, { email: email.toLowerCase() }]
  });

  if (user) {
    if (user.isBlocked) {
      const error = new Error('Your account has been blocked. Please contact support.');
      error.statusCode = 403;
      throw error;
    }

    let modified = false;
    if (!user.googleId) {
      user.googleId = googleId;
      modified = true;
    }
    if (!user.profileImage && picture) {
      user.profileImage = picture;
      modified = true;
    }
    if (modified) {
      await user.save();
    }
  } else {
    user = await User.create({
      name: name || 'Google User',
      email: email.toLowerCase(),
      googleId,
      authProvider: 'google',
      role: role || 'student',
      profileImage: picture || '',
    });
  }

  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
    },
  };
};

export default {
  registerUser,
  loginUser,
  googleLoginUser,
};
