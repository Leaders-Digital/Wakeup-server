// Middleware to check API key
const apiKeyMiddleware = (req, res, next) => {
    const apiKey = req.headers['x-api-key']; // API key from request headers
    const serverApiKey = process.env.API_KEY; // API key from environment variables
  
    if (!apiKey || apiKey !== serverApiKey) {
      return res.status(401).json({ message: "Unauthorized. Invalid API key." });
    }
    next(); // Proceed if API key is valid
  };
  