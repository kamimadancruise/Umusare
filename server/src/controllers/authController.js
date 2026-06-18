const authService = require("../services/authService");
const { successResponse } = require("../utils/apiResponse");

async function register(req, res, next) {
  try {
    const result = await authService.registerLocalUser(req.body);
    res.status(201).json(successResponse(result.message, {
      user: result.user,
      role: result.role,
      token: result.token
    }));
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.loginLocalUser(req.body);
    res.json(successResponse(result.message, {
      user: result.user,
      role: result.role,
      token: result.token
    }));
  } catch (error) {
    next(error);
  }
}

async function googleLogin(req, res, next) {
  try {
    const result = await authService.loginWithGoogle(req.body);
    res.json(successResponse(result.message, {
      user: result.user,
      role: result.role,
      token: result.token
    }));
  } catch (error) {
    next(error);
  }
}

async function appleLogin(req, res, next) {
  try {
    const result = await authService.loginWithApple(req.body);
    res.json(successResponse(result.message, {
      user: result.user,
      role: result.role,
      token: result.token
    }));
  } catch (error) {
    next(error);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const result = await authService.forgotPassword(req.body);
    res.json(successResponse(result.message));
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const result = await authService.resetPassword(req.body);
    res.json(successResponse(result.message));
  } catch (error) {
    next(error);
  }
}

async function me(req, res) {
  res.json(successResponse("Current user loaded", {
    user: authService.serializeUser(req.user)
  }));
}

async function logout(req, res) {
  res.json(successResponse("Logged out successfully. Remove the token on the frontend."));
}

async function protectedRoute(req, res) {
  res.json(successResponse("Protected route access granted", {
    user: authService.serializeUser(req.user)
  }));
}

async function adminOnly(req, res) {
  res.json(successResponse("Admin-only route access granted", {
    user: authService.serializeUser(req.user)
  }));
}

module.exports = {
  register,
  login,
  googleLogin,
  appleLogin,
  forgotPassword,
  resetPassword,
  me,
  logout,
  protectedRoute,
  adminOnly
};
