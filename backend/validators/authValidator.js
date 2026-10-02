export const validateRegister = (req, res, next) => {
  const { fullName, email, password, role } = req.body;

  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    return res.status(400).json({
      status: 'error',
      message: 'Full name is required and must be at least 2 characters long.',
    });
  }

  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({
      status: 'error',
      message: 'A valid email address is required.',
    });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({
      status: 'error',
      message: 'Password is required and must be at least 8 characters long.',
    });
  }

  if (!role || !['student', 'owner'].includes(role)) {
    return res.status(400).json({
      status: 'error',
      message: 'Role is required and must be either "student" or "owner".',
    });
  }

  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      status: 'error',
      message: 'Both email and password are required fields.',
    });
  }

  next();
};
