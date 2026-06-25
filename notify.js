// Vercel Serverless Function - Enviar notificaciones via OneSignal
// La API key vive aquí en el servidor, nunca en el cliente

export default async function handler(req, res) {
  // Solo aceptar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, message, userIds, url } = req.body;

  if (!title || !message || !userIds || userIds.length === 0) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  const apiKey = process.env.ONESIGNAL_API_KEY;
  const appId = '14d8dcf8-a7d6-4b8c-b033-3f3e81254e6e';

  if (!apiKey) {
    return res.status(500).json({ error: 'API key no configurada' });
  }

  try {
    const payload = {
      app_id: appId,
      include_aliases: { external_id: userIds },
      target_channel: 'push',
      headings: { en: title, es: title },
      contents: { en: message, es: message },
      url: url || 'https://ignite-gules-six.vercel.app',
    };

    const response = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OneSignal error:', data);
      return res.status(response.status).json({ error: data });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error enviando notificación:', error);
    return res.status(500).json({ error: error.message });
  }
}
