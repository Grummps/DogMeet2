const multer = require('multer');

// Configure Multer for memory storage
const storage = multer.memoryStorage();  // No disk storage, files will be in memory

const upload = multer({ storage });

module.exports = upload;
