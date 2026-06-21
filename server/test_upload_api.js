const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testUpload() {
  const token = jwt.sign({ user: { id: 'test-user-id', role: 'user' } }, process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production_2024');
  
  const form = new FormData();
  form.append('image', Buffer.from('dummy image content'), { filename: 'test.jpg', contentType: 'image/jpeg' });

  try {
    const res = await axios.post('http://localhost:5000/api/upload', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Upload success:', res.data);
  } catch (err) {
    console.log('Upload failed with status:', err.response?.status);
    console.log('Response data:', err.response?.data);
  }
}

testUpload();
