export const requireDashboardKey = (req, res, next) => {
  const key = req.headers['x-dashboard-key'] || req.query.key;
  if (!key || key !== process.env.REPORT_TOKEN) {
    return res.status(401).json({ ok: false, message: 'Unauthorized: Invalid dashboard key' });
  }
  next();
};