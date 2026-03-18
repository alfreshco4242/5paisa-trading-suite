const { paisa, cors } = require('../_paisa');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const { jwtToken, exchange, exchType, scripCode, timeframe, from, to } = req.body;
    const data = await paisa('/V2/GetHistoricalData', {
      head: { key: jwtToken },
      body: { Exch: exchange||'N', ExchType: exchType||'C', ScripCode: scripCode, TimeFrame: timeframe||'60', From: from, To: to }
    }, jwtToken);
    res.json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
};
