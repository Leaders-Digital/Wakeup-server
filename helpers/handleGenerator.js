const Product = require('../Models/Produit.model');

// Function to generate a SEO-friendly handle from product name
const generateHandle = (name) => {
  if (!name) return '';
  
  // Convert to lowercase
  let handle = name.toLowerCase();
  
  // Remove accents and special characters
  handle = handle.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Replace spaces and special characters with hyphens
  handle = handle.replace(/[^a-z0-9]+/g, '-');
  
  // Remove leading and trailing hyphens
  handle = handle.replace(/^-+|-+$/g, '');
  
  // Limit length to 100 characters
  if (handle.length > 100) {
    handle = handle.substring(0, 100);
    handle = handle.replace(/-+$/, ''); // Remove trailing hyphen if cut
  }
  
  return handle;
};

// Function to generate a unique handle
const generateUniqueHandle = async (name, excludeId = null) => {
  let baseHandle = generateHandle(name);
  
  // If handle is empty, use a fallback
  if (!baseHandle) {
    baseHandle = 'product';
  }
  
  let handle = baseHandle;
  let counter = 1;
  
  // Check if handle exists and make it unique
  while (true) {
    const query = { handle };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const existingProduct = await Product.findOne(query);
    
    if (!existingProduct) {
      return handle;
    }
    
    // Handle exists, append counter
    handle = `${baseHandle}-${counter}`;
    counter++;
    
    // Safety limit to prevent infinite loop
    if (counter > 1000) {
      // Fallback to timestamp if too many collisions
      handle = `${baseHandle}-${Date.now()}`;
      break;
    }
  }
  
  return handle;
};

module.exports = {
  generateHandle,
  generateUniqueHandle,
};

