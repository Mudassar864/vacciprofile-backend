const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation Error', 
      details: err.message 
    });
  }
  
  if (err.code === 11000) {
    return res.status(409).json({ 
      error: 'Duplicate Entry', 
      details: 'This record already exists' 
    });
  }
  
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: err.message 
  });
};

module.exports = errorHandler;