/**
 * 5Paisa Trading Suite — Proxy Server
 * Handles CORS, auth flow, and all API calls to Openapi.5paisa.com
 * Run: node server.js   (default port 3000)
 */

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const fetch   = require('node-fetch');
const path    = require('path');

const app  = express();
// Railway injects PORT automatically — fallback to 3000 for local dev
const PORT = process.env.PORT || 3000;

const BASE_URL   = 'https://Openapi.5paisa.com/VendorLoginService';
const MARKET_URL = 'https://Openapi.5paisa.com';

// Allow all origins (safe since this is a personal trading proxy)
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─────────────────────────────────────────────
// HELPER: forward POST to 5paisa
// ─────────────────────────────────────────────
async function paisa(endpoint, body, jwtToken) {
  const headers = { 'Content-Type': 'application/json' };
  if (jwtToken) {
    headers['Authorization'] = 'bearer ' + jwtToken;
    headers['x-clientcode']  = body && body.body && body.body.ClientCode ? body.body.ClientCode : '';
  }
  const url = endpoint.startsWith('http') ? endpoint : BASE_URL + endpoint;
  const res  = await fetch(url, {
    method:  'POST',
    headers: headers,
    body:    JSON.stringify(body)
  });
  const text = await res.text();
  try { return JSON.parse(text); }
  catch(e) { return { error: text }; }
}

// ─────────────────────────────────────────────
// AUTH — Step 1: Get Request Token
// ─────────────────────────────────────────────
app.post('/api/auth/request-token', async (req, res) => {
  try {
    const { apiKey, encKey, userId, userPassword, dob, appSource } = req.body;
    if (!apiKey || !userId || !userPassword) {
      return res.status(400).json({ error: 'apiKey, userId and userPassword are required' });
    }

    const payload = {
      head: {
        appName:     userId,
        appVer:      '1.0',
        key:         apiKey,
        osName:      'WEB',
        requestCode: '5PLoginV4',
        userId:      userId,
        password:    userPassword
      },
      body: {
        Email_ID:   userId,
        Password:   userPassword,
        LocalIP:    '127.0.0.1',
        PublicIP:   '106.193.137.55',
        HDSerialNo: '',
        MACAddress: '',
        MachineID:  'MAC',
        VersionNo:  '1.7',
        RequestNo:  '1',
        DPIN:       dob || ''
      }
    };

    const data = await paisa('/V4/GetRequestToken', payload);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// AUTH — Step 2: Get JWT Token (with TOTP)
// ─────────────────────────────────────────────
app.post('/api/auth/get-jwt', async (req, res) => {
  try {
    const { apiKey, encKey, userId, requestToken, totp } = req.body;
    if (!requestToken || !totp) {
      return res.status(400).json({ error: 'requestToken and totp are required' });
    }

    const payload = {
      head: { key: apiKey },
      body: {
        RequestToken:  requestToken,
        TOTP:          totp,
        UserKey:       userId,
        EncryptionKey: encKey
      }
    };

    const data = await paisa('/V3/GetJWTToken', payload);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// MARKET — Live Quote / Market Feed
// ─────────────────────────────────────────────
app.post('/api/market/quote', async (req, res) => {
  try {
    const { jwtToken, clientCode, scripList } = req.body;
    // scripList = [{ Exch:"N", ExchType:"C", ScripCode:1660 }, ...]

    const payload = {
      head: { key: jwtToken },
      body: {
        Count:  scripList.length,
        Data:   scripList.map(s => ({
          Exch:     s.Exch     || 'N',
          ExchType: s.ExchType || 'C',
          ScripCode: s.ScripCode
        }))
      }
    };

    const data = await paisa(
      MARKET_URL + '/VendorLoginService/V1/Market/MarketFeed',
      payload,
      jwtToken
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// MARKET — Search Scrip
// ─────────────────────────────────────────────
app.post('/api/market/search', async (req, res) => {
  try {
    const { jwtToken, search } = req.body;
    const payload = {
      head: { key: jwtToken },
      body: { SearchValue: search }
    };
    const data = await paisa('/V1/Market/ScripSearch', payload, jwtToken);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// MARKET — Historical Data
// ─────────────────────────────────────────────
app.post('/api/market/historical', async (req, res) => {
  try {
    const { jwtToken, exchange, exchType, scripCode, timeframe, from, to } = req.body;

    const payload = {
      head: { key: jwtToken },
      body: {
        Exch:      exchange  || 'N',
        ExchType:  exchType  || 'C',
        ScripCode: scripCode,
        TimeFrame: timeframe || '60',
        From:      from,
        To:        to
      }
    };

    const data = await paisa('/V2/GetHistoricalData', payload, jwtToken);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// MARKET — Market Depth (Order Book)
// ─────────────────────────────────────────────
app.post('/api/market/depth', async (req, res) => {
  try {
    const { jwtToken, exchange, exchType, scripCode } = req.body;
    const payload = {
      head: { key: jwtToken },
      body: {
        Count: 1,
        Data: [{ Exch: exchange||'N', ExchType: exchType||'C', ScripCode: scripCode }]
      }
    };
    const data = await paisa(
      MARKET_URL + '/VendorLoginService/V1/Market/MarketDepth',
      payload, jwtToken
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// PORTFOLIO — Holdings
// ─────────────────────────────────────────────
app.post('/api/portfolio/holdings', async (req, res) => {
  try {
    const { jwtToken, clientCode } = req.body;
    const payload = {
      head: { key: jwtToken },
      body: { ClientCode: clientCode }
    };
    const data = await paisa('/V2/Trading/Holdings', payload, jwtToken);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// PORTFOLIO — Positions
// ─────────────────────────────────────────────
app.post('/api/portfolio/positions', async (req, res) => {
  try {
    const { jwtToken, clientCode } = req.body;
    const payload = {
      head: { key: jwtToken },
      body: { ClientCode: clientCode }
    };
    const data = await paisa('/V2/Trading/NetPositions', payload, jwtToken);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// PORTFOLIO — Margin
// ─────────────────────────────────────────────
app.post('/api/portfolio/margin', async (req, res) => {
  try {
    const { jwtToken, clientCode } = req.body;
    const payload = {
      head: { key: jwtToken },
      body: { ClientCode: clientCode }
    };
    const data = await paisa('/V2/Trading/Margin', payload, jwtToken);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// PORTFOLIO — Order Book
// ─────────────────────────────────────────────
app.post('/api/portfolio/orders', async (req, res) => {
  try {
    const { jwtToken, clientCode } = req.body;
    const payload = {
      head: { key: jwtToken },
      body: { ClientCode: clientCode }
    };
    const data = await paisa('/V2/Trading/OrderBook', payload, jwtToken);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// PORTFOLIO — Trade Book
// ─────────────────────────────────────────────
app.post('/api/portfolio/trades', async (req, res) => {
  try {
    const { jwtToken, clientCode } = req.body;
    const payload = {
      head: { key: jwtToken },
      body: { ClientCode: clientCode }
    };
    const data = await paisa('/V2/Trading/TradeBook', payload, jwtToken);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// TRADING — Place Order
// ─────────────────────────────────────────────
app.post('/api/trading/place-order', async (req, res) => {
  try {
    const { jwtToken, clientCode, order } = req.body;
    // order = { exchange, exchType, scripCode, qty, price, orderType, buySell, isIntraday }

    const payload = {
      head: { key: jwtToken },
      body: {
        ClientCode:   clientCode,
        Exchange:     order.exchange    || 'N',
        ExchangeType: order.exchType    || 'C',
        ScripCode:    order.scripCode,
        Qty:          order.qty,
        Price:        order.price       || 0,
        OrderType:    order.orderType   || 'MKT',   // MKT | LMT | SL | SLM
        BuySell:      order.buySell,                // B or S
        IsIntraday:   order.isIntraday  || false,
        IsAHOrder:    'N',
        ValidTillDate: '/Date(0)/',
        AHPlaced:     'N',
        RemoteOrderID: String(Date.now())
      }
    };

    const data = await paisa('/V1/Trading/PlaceOrder', payload, jwtToken);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// TRADING — Cancel Order
// ─────────────────────────────────────────────
app.post('/api/trading/cancel-order', async (req, res) => {
  try {
    const { jwtToken, clientCode, exchangeOrderId, exchange, exchType, scripCode } = req.body;
    const payload = {
      head: { key: jwtToken },
      body: {
        ClientCode:      clientCode,
        ExchOrderID:     exchangeOrderId,
        Exchange:        exchange  || 'N',
        ExchangeType:    exchType  || 'C',
        ScripCode:       scripCode,
        RemoteOrderID:   String(Date.now())
      }
    };
    const data = await paisa('/V1/Trading/CancelOrder', payload, jwtToken);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// DASHBOARD SUMMARY — combines margin + positions + holdings
// ─────────────────────────────────────────────
app.post('/api/portfolio/summary', async (req, res) => {
  try {
    const { jwtToken, clientCode } = req.body;
    const base = { head: { key: jwtToken }, body: { ClientCode: clientCode } };

    const [marginRes, posRes, holdRes, orderRes] = await Promise.all([
      paisa('/V2/Trading/Margin',       base, jwtToken),
      paisa('/V2/Trading/NetPositions', base, jwtToken),
      paisa('/V2/Trading/Holdings',     base, jwtToken),
      paisa('/V2/Trading/OrderBook',    base, jwtToken),
    ]);

    // Calculate portfolio value from holdings + positions
    const holdings  = holdRes?.body?.Data || [];
    const positions = posRes?.body?.Data  || [];
    const orders    = orderRes?.body?.OrderBookDetail || [];
    const margin    = marginRes?.body;

    let holdingsValue = holdings.reduce((sum, h) => sum + (h.CurrentValue || 0), 0);
    let positionsPnl  = positions.reduce((sum, p) => sum + (p.MTOM || 0), 0);
    let openOrders    = orders.filter(o => o.Status === 'Pending' || o.Status === 'Open').length;

    res.json({
      summary: {
        portfolioValue: holdingsValue,
        dayPnl:         positionsPnl,
        availableMargin: margin?.NetAvailableMargin || 0,
        usedMargin:      margin?.MarginUtilized     || 0,
        openOrders:      openOrders,
        positions:       positions.length,
      },
      holdings:  holdings,
      positions: positions,
      orders:    orders,
      margin:    margin
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log('5Paisa Trading Suite running at http://localhost:' + PORT);
  console.log('API proxy ready — CORS handled server-side');
});
