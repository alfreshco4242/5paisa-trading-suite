const { paisa, cors } = require('../_paisa');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const { apiKey, encKey, userId, requestToken, totp } = req.body;
    if (!requestToken || !totp)
      return res.status(400).json({ error: 'requestToken and totp required' });

    const data = await paisa('/V3/GetJWTToken', {
      head: { key: apiKey },
      body: { RequestToken: requestToken, TOTP: totp, UserKey: userId, EncryptionKey: encKey }
    });
    res.json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
};
