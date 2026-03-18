const { paisa, cors, MARKET } = require('../_paisa');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const { jwtToken, scripList } = req.body;
    const data = await paisa(MARKET + '/VendorLoginService/V1/Market/MarketFeed', {
      head: { key: jwtToken },
      body: { Count: scripList.length, Data: scripList }
    }, jwtToken);
    res.json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
};
