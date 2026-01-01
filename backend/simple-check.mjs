import http from 'http';

const options = {
  hostname: '127.0.0.1',
  port: 8080,
  path: '/api/admin/usage',
  method: 'GET',
  headers: {
    'x-admin-token': '2026lyan9e6r77rhegiueegegidpd-ehdye'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('状态码:', res.statusCode);
    console.log('响应:', data);
  });
});

req.on('error', (error) => {
  console.error('错误:', error.message);
});

req.setTimeout(5000, () => {
  console.error('请求超时');
  req.destroy();
});

req.end();
