const { cors } = require('./_paisa');
module.exports = (req, res) => {
  cors(res);
  res.json({ status: 'ok', time: new Date().toISOString(), platform: 'vercel' });
};
