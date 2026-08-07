const axios = require('axios');
axios.post('http://localhost:3000/api/v1/products', { name: "Test", sku: "TEST-SKU", price: 99.99 }).catch(e => console.log(e.response.data));
