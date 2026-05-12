const http = require('http');

http.get('http://localhost:3000/customer/dashboard', (res) => {
  console.log('Status Code:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    if (data.includes('Remaining Session Time')) {
      console.log('Dashboard loaded correctly.');
    } else if (data.includes('ReferenceError')) {
      console.log('Dashboard failed with ReferenceError.');
    } else {
      console.log('Dashboard content unexpected.');
    }
    process.exit(0);
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
