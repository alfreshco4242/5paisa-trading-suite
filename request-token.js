const { paisa, cors } = require('../_paisa');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const { apiKey, encKey, userId, userPassword, dob, appSource } = req.body;
    if (!apiKey || !userId || !userPassword)
      return res.status(400).json({ error: 'apiKey, userId and userPassword required' });

    const data = await paisa('/V4/GetRequestToken', {
      head: {
        appName: userId, appVer: '1.0', key: apiKey,
        osName: 'WEB', requestCode: '5PLoginV4',
        userId, password: userPassword
      },
      body: {
        Email_ID: userId, Password: userPassword,
        LocalIP: '127.0.0.1', PublicIP: '106.193.137.55',
        HDSerialNo: '', MACAddress: '', MachineID: 'MAC',
        VersionNo: '1.7', RequestNo: '1', DPIN: dob || ''
      }
    });
    res.json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
};
