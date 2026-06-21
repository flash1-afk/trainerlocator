const axios = require('axios');
const client = axios.create({ baseURL: '/api' });
console.log(client.getUri({ url: '/upload' }));
console.log(client.getUri({ url: 'upload' }));
