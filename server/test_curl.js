const jwt = require('jsonwebtoken');
require('dotenv').config();
const token = jwt.sign({ user: { id: 'test-user-id', role: 'user' } }, process.env.JWT_SECRET || 'fallback-secret');
console.log(token);
