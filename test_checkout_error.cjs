const axios = require('axios');
const http = require('http');

async function test() {
  try {
    const res = await axios.post('http://127.0.0.1:3000/api/storefront/v1/checkout/complete', {
      paymentMethod: "COD"
    }, {
      headers: {
        'X-Cart-Session-Id': 'test-session-123'
      }
    });
    console.log(res.data);
  } catch (e) {
    if (e.response) {
      console.log('HTTP Status:', e.response.status);
      console.log('Response Data:', JSON.stringify(e.response.data, null, 2));
    } else {
      console.error(e.message);
    }
  }
}

test();
