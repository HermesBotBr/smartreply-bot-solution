// api/check-update-queue.js

export default async function handler(req, res) {
  const { seller_id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Use GET' });
  }

  if (!seller_id) {
    return res.status(400).json({ success: false, error: 'seller_id ausente' });
  }

  try {
    const txtUrl = 'https://projetohermes-dda7e0c8d836.herokuapp.com/all_notifications.txt';
    const raw = await fetch(txtUrl).then(r => r.text());

    const updates = raw
      .trim()
      .split('\n')
      .map(line => {
        const [pack_id, sid] = line.trim().split(',');
        return { seller_id: sid, pack_id };
      })
      .filter(item => item.seller_id === seller_id);

    return res.status(200).json({
      success: true,
      updates
    });
  } catch (error) {
    console.error('Erro ao consultar notificações:', error.message);
    return res.status(500).json({ success: false, error: 'Falha ao consultar notificações' });
  }
}
