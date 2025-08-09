export default function adminAuth(req, res, next) {
  try {
    const expectedKey = process.env.ADMIN_API_KEY;
    if (!expectedKey) {
      return res.status(500).json({ message: 'Admin key not configured' });
    }
    const providedKey = req.headers['x-admin-key'];
    if (typeof providedKey === 'string' && providedKey === expectedKey) {
      return next();
    }
    return res.status(401).json({ message: 'Unauthorized' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}

