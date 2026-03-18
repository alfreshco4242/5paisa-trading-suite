const { paisa, cors } = require('../_paisa');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const { jwtToken, clientCode, order } = req.body;
    const data = await paisa('/V1/Trading/PlaceOrder', {
      head: { key: jwtToken },
      body: {
        ClientCode:   clientCode,
        Exchange:     order.exchange    || 'N',
        ExchangeType: order.exchType    || 'C',
        ScripCode:    order.scripCode,
        Qty:          order.qty,
        Price:        order.price       || 0,
        OrderType:    order.orderType   || 'MKT',
        BuySell:      order.buySell,
        IsIntraday:   order.isIntraday  || false,
        IsAHOrder:    'N',
        ValidTillDate:'/Date(0)/',
        AHPlaced:     'N',
        RemoteOrderID: String(Date.now())
      }
    }, jwtToken);
    res.json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
};
