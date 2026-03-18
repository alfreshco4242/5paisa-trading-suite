const fetch = require('node-fetch');

const BASE   = 'https://Openapi.5paisa.com/VendorLoginService';
const MARKET = 'https://Openapi.5paisa.com';

async function paisa(endpoint, body, jwt) {
  const headers = { 'Content-Type': 'application/json' };
  if (jwt) headers['Authorization'] = 'bearer ' + jwt;
  const url = endpoint.startsWith('http') ? endpoint : BASE + endpoint;
  const res  = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  const text = await res.text();
  try { return JSON.parse(text); } catch(e) { return { error: text }; }
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = { paisa, cors, BASE, MARKET };
