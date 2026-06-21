const jwt = require('jsonwebtoken');
const token = jwt.sign({ user: { id: 'test-user-id', role: 'user' } }, process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production_2024');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function test() {
  const form = new FormData();
  form.append('image', Buffer.from('dummy image content'), 'test_image.jpg');

  try {
    const res = await axios.post('http://localhost:5000/api/upload', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Success:', res.data);
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}
test();
