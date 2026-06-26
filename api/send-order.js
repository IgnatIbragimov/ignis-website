/* ============================================================
   IGNIS — /api/send-order  (Vercel serverless function, Node.js)
   Принимает данные заказа от checkout.js и отправляет письмо
   клиенту через Resend. API-ключ берётся из переменной окружения
   RESEND_API_KEY (задаётся в настройках проекта Vercel, НЕ в коде).
   ============================================================ */

const FROM = 'IGNIS <order@mail.ignisclothing.online>';
const ORDER_COPY = 'ignaibragimov@gmail.com'; // копия каждого заказа владельцу
const SUBJECT = 'Заказ принят — IGNIS';

// Экранирование пользовательских данных в HTML
function esc(s = '') {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Строка одного товара в карточке заказа
function itemRow(it) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #E8E4DC;">
      <tr>
        <td style="padding-top:16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="84" valign="top" style="padding-right:16px;">
                <img src="${esc(it.image)}" alt="${esc(it.name)}" width="84" style="display:block; width:84px; height:112px; object-fit:cover; background-color:#E8E4DC; border:0;" />
              </td>
              <td valign="top" style="font-family:Georgia,'Times New Roman',serif;">
                <div style="font-size:15px; color:#1A1A18; letter-spacing:1px;">${esc(it.name)}</div>
                <div style="font-size:13px; color:#6B5B4E; padding-top:6px;">Размер: ${esc(it.size)} · ${esc(it.qty)} шт.</div>
                <div style="font-size:13px; color:#6B5B4E; padding-top:4px;">${esc(it.priceFormatted)}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

// Полный HTML письма
function buildHtml({ customerName, items, totalFormatted }) {
  const rows = items.map(itemRow).join('');
  return `<!DOCTYPE html>
<html lang="ru"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0; padding:0; background-color:#F5F4F0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F4F0; padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background-color:#F5F4F0;">

        <tr><td align="center" style="padding:8px 0 24px 0; border-bottom:1px solid #C8C4BC;">
          <div style="font-family:Georgia,'Times New Roman',serif; font-size:30px; letter-spacing:10px; color:#1A1A18; padding-left:10px;">IGNIS</div>
          <div style="font-family:Georgia,'Times New Roman',serif; font-size:10px; letter-spacing:4px; color:#6B5B4E; margin-top:4px;">CLOTHING</div>
        </td></tr>

        <tr><td style="padding:32px 8px 8px 8px; font-family:Georgia,'Times New Roman',serif; font-size:20px; color:#1A1A18;">
          ${esc(customerName)}, спасибо за предзаказ!
        </td></tr>
        <tr><td style="padding:0 8px 24px 8px; font-family:Georgia,'Times New Roman',serif; font-size:15px; line-height:1.6; color:#6B5B4E;">
          Мы получили ваш заказ и уже передаём его в работу.
        </td></tr>

        <tr><td style="padding:0 8px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF; border:1px solid #E8E4DC;">
            <tr><td style="padding:20px;">
              ${rows}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #E8E4DC; margin-top:18px;">
                <tr>
                  <td style="padding-top:16px; font-family:Georgia,'Times New Roman',serif; font-size:14px; color:#6B5B4E;">Итого</td>
                  <td align="right" style="padding-top:16px; font-family:Georgia,'Times New Roman',serif; font-size:16px; color:#1A1A18;">${esc(totalFormatted)}</td>
                </tr>
              </table>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:32px 8px 8px 8px; font-family:Georgia,'Times New Roman',serif; font-size:12px; letter-spacing:2px; text-transform:uppercase; color:#6B5B4E;">Что дальше</td></tr>
        <tr><td style="padding:0 8px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Georgia,'Times New Roman',serif; font-size:14px; line-height:1.6; color:#1A1A18;">
            <tr><td style="padding:8px 0; border-bottom:1px solid #E8E4DC;">Мы свяжемся с вами для подтверждения оплаты и адреса доставки.</td></tr>
            <tr><td style="padding:8px 0; border-bottom:1px solid #E8E4DC;">Изделие шьётся под текущий дроп. Срок отправки — 2 недели с момента подтверждения.</td></tr>
            <tr><td style="padding:8px 0;">Трек-номер пришлём отдельным письмом.</td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:28px 8px; font-family:Georgia,'Times New Roman',serif; font-size:14px; line-height:1.6; color:#6B5B4E;">
          Вопросы — пишите в ответ на это письмо или в Telegram (@stafflud).
        </td></tr>

        <tr><td align="center" style="padding:28px 8px 8px 8px; border-top:1px solid #C8C4BC;">
          <div style="font-family:Georgia,'Times New Roman',serif; font-size:18px; letter-spacing:6px; color:#1A1A18; padding-left:6px;">IGNIS</div>
          <div style="font-family:Georgia,'Times New Roman',serif; font-size:13px; color:#C8C4BC; margin-top:8px;">Форма, которая говорит за вас.</div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Vercel парсит JSON в req.body; на всякий случай разбираем строку вручную
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { customerName, customerEmail, items, totalFormatted } = body || {};

  if (!customerEmail || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Некорректные данные заказа' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'RESEND_API_KEY не задан в окружении' });
  }

  const html = buildHtml({ customerName: customerName || 'Клиент', items, totalFormatted });

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [customerEmail],
        bcc: [ORDER_COPY],          // копия заказа владельцу
        reply_to: ORDER_COPY,       // ответы клиента летят владельцу
        subject: SUBJECT,
        html,
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return res.status(502).json({ error: 'Resend error', detail: data });
    }
    return res.status(200).json({ ok: true, id: data.id });
  } catch (err) {
    return res.status(500).json({ error: 'send_failed', detail: String(err) });
  }
}
