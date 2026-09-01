import https from 'https';

function checkEndpoint(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const isJson = res.headers['content-type']?.includes('application/json');
        const isHtml = data.trim().startsWith('<!DOCTYPE html>');
        resolve({
          status: res.statusCode,
          contentType: res.headers['content-type'],
          isJson,
          isHtml,
          bodySnippet: data.substring(0, 300)
        });
      });
    }).on('error', err => resolve({ error: err.message }));
  });
}

(async () => {
  console.log('Testing https://sarvottam-diksha.web.app/api/admin/courses/c1/full...');
  const res = await checkEndpoint('https://sarvottam-diksha.web.app/api/admin/courses/c1/full');
  console.log('Result:', JSON.stringify(res, null, 2));
})();
