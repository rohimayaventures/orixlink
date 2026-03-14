const http = require('http');

const data = JSON.stringify({
  messages: [{
    role: "user",
    content: "38 year old male. Day 7 post radial artery cardiac catheterization and coronary stent placement. Access site was right wrist. Forearm is swollen, hard and woody to touch. Pain had improved days 2-4 but has returned and is now worse than initial. He woke from sleep last night due to pain. He cannot grip a door handle or open a jar. Fingers feel slightly numb and tingly on the inside of the hand. He is on aspirin and Plavix."
  }],
  role: "family",
  context: "recent procedure",
  language: "English"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/assess',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
  });
});

req.on('error', (e) => console.error('Error:', e));
req.write(data);
req.end();