const axios = require('axios');
console.log(axios.getUri({ baseURL: 'https://trainerlocator-api.vercel.app/api', url: '/api/auth/register' }));
