const jwt = require('jsonwebtoken');
const { User, Role, Permission, Session } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { auditLogin, auditLogout } = require('../middleware/auditMiddleware');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

const register = async (req, res) => {
  try {
    const { email, password, full_name, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password_hash: password,
      full_name,
      phone
    });

    // Generate token
    const token = generateToken(user.id);

    // Create session
    await Session.create({
      user_id: user.id,
      token,
      user_agent: req.get('User-Agent'),
      ip: req.ip,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with roles and permissions
    const user = await User.findOne({
      where: { email, is_active: 1 },
      include: [{
        model: Role,
        include: [Permission]
      }]
    });

    if (!user || !(await user.validatePassword(password))) {
      // Log failed login attempt
      await auditLogin(req, res, null, false, {
        email,
        reason: 'Invalid credentials'
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user.id);

    // Create session
    await Session.create({
      user_id: user.id,
      token,
      user_agent: req.get('User-Agent'),
      ip: req.ip,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    // Log successful login
    await auditLogin(req, res, user.id, true, {
      email: user.email,
      full_name: user.full_name
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    // Log failed login attempt
    await auditLogin(req, res, null, false, {
      email: req.body.email,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      await Session.destroy({
        where: { token }
      });
    }

    // Log logout
    await auditLogout(req, res, req.user?.id, {
      session_ended: true
    });

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: Role,
        include: [Permission]
      }]
    });

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { full_name, phone } = req.body;
    
    await User.update(
      { full_name, phone },
      { where: { id: req.user.id } }
    );

    const updatedUser = await User.findByPk(req.user.id);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Profile update failed',
      error: error.message
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    const user = await User.findByPk(req.user.id);
    
    if (!(await user.validatePassword(current_password))) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    await User.update(
      { password_hash: new_password },
      { where: { id: req.user.id } }
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Password change failed',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword
};