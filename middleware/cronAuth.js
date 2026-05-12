// Middleware to protect cron endpoints from unauthorized access
const cronAuth = (req, res, next) => {
  try {
    // Get the cron secret from headers
    const cronSecret = req.headers['x-cron-secret'] || req.headers['authorization']?.replace('Bearer ', '');
    
    // Check if secret is provided
    if (!cronSecret) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Cron secret is required',
      });
    }
    
    // Verify the secret matches environment variable
    if (cronSecret !== process.env.CRON_SECRET_KEY) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Invalid cron secret',
      });
    }
    
    // Secret is valid, proceed
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message,
    });
  }
};

module.exports = cronAuth;
