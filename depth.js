const { paisa, cors, MARKET } = require('../_paisa');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const { jwtToken, exchange, exchType, scripCode } = req.body;
    const data = await paisa(MARKET + '/VendorLoginService/V1/Market/MarketDepth', {
      head: { key: jwtToken },
      body: { Count: 1, Data: [{ Exch: exchange||'N', ExchType: exchType||'C', ScripCode: scripCode }] }
    }, jwtToken);
    res.json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
};
