const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 静的ファイルを提供
app.use(express.static(__dirname));

// ルートパスでindex.htmlを提供
app.get('/', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, 'index.html'));
  } catch (error) {
    console.error('Error serving index.html:', error);
    res.status(500).send('Internal Server Error');
  }
});

// 404エラーハンドリング
app.get('*', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, 'index.html'));
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(404).send('File not found');
  }
});

// Railway では 0.0.0.0 でリッスンする必要がある
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Current directory: ${__dirname}`);
  console.log(`Files in directory: ${require('fs').readdirSync(__dirname).join(', ')}`);
}).on('error', (error) => {
  console.error('Server error:', error);
}); 