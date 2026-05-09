const isMasterAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'masterAdmin') {
    next();
  } else {
    res.status(403).json({ 
      message: 'Access denied. Master Admin privileges required.' 
    });
  }
};

module.exports = { isMasterAdmin };
