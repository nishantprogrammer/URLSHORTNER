import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const adminUser = process.env.ADMIN_UI_USER || '';
const adminPass = process.env.ADMIN_UI_PASS || '';

app.use((req, res, next) => {
  if (!adminUser || !adminPass) {
    return res.status(500).send('Admin UI credentials not configured');
  }
  const header = req.headers['authorization'] || '';
  if (!header.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).send('Authentication required');
  }
  try {
    const base64 = header.replace('Basic ', '');
    const decoded = Buffer.from(base64, 'base64').toString('utf8');
    const [user, pass] = decoded.split(':');
    if (user === adminUser && pass === adminPass) {
      return next();
    }
  } catch (_) {}
  res.set('WWW-Authenticate', 'Basic realm="Admin"');
  return res.status(401).send('Unauthorized');
});

const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Admin UI server listening on ${port}`);
});


