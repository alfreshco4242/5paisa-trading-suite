const { paisa, cors } = require('../_paisa');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const { jwtToken, clientCode } = req.body;
    const base = { head: { key: jwtToken }, body: { ClientCode: clientCode } };

    const [marginRes, posRes, holdRes, orderRes] = await Promise.all([
      paisa('/V2/Trading/Margin',       base, jwtToken),
      paisa('/V2/Trading/NetPositions', base, jwtToken),
      paisa('/V2/Trading/Holdings',     base, jwtToken),
      paisa('/V2/Trading/OrderBook',    base, jwtToken),
    ]);

    const holdings  = holdRes?.body?.Data  || [];
    const positions = posRes?.body?.Data   || [];
    const orders    = orderRes?.body?.OrderBookDetail || [];
    const margin    = marginRes?.body;

    res.json({
      summary: {
        portfolioValue:  holdings.reduce((s,h) => s+(h.CurrentValue||0), 0),
        dayPnl:          positions.reduce((s,p) => s+(p.MTOM||0), 0),
        availableMargin: margin?.NetAvailableMargin || 0,
        usedMargin:      margin?.MarginUtilized     || 0,
        openOrders:      orders.filter(o => o.Status==='Pending'||o.Status==='Open').length,
        positions:       positions.length,
      },
      holdings, positions, orders, margin
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
};
