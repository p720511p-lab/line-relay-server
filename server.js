const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

let latestData = {
    kW: 0, V: '--', A: '--', PF: '--',
    rateTitle: '台電營業用',
    costWeek: '0.00', kwhWeek: '0.000',
    costBill: '0.00', kwhBill: '0.000',
    temp: '--', humidity: '--', wind: '--', rain: '0', clouds: '--',
    updateTime: '尚未收到資料'
};

const SECRET_KEY = "YOUR_SECURE_PASSWORD_123";
const LINE_ACCESS_TOKEN = "GE0BRQ4PWaFVkHOk0C5qLmcfTOZ+bOL35z8s80pGxLqD8+i4PcJRVVZ4DnZfzlq3IXu15wNPnORb/Jln/KaTJypc/Wk3YZ+0aEJE7+LaBR9Ytkrg83J5uu4dUE8104iRFWIqGpPAtZMz369UEMtxTQdB04t89/1O/w1cDnyilFU=";

app.post('/api/update', (req, res) => {
    const data = req.body;
    if (!data || data.secret_key !== SECRET_KEY) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    latestData = data;
    console.log('已更新最新電力與微氣候數據:', data.updateTime);
    res.json({ status: 'success', message: 'Data updated successfully' });
});

app.post('/webhook', async (req, res) => {
    res.status(200).end();

    const events = req.body.events;
    if (!events || events.length === 0) return;

    for (const event of events) {
        if (event.type === 'message' && event.message.type === 'text') {
            const replyToken = event.replyToken;

            let text = `📊 【廠區即時電力查詢回報】\n` +
                       `---------------------------\n` +
                       `⚡ 即時耗電：${Number(latestData.kW).toFixed(2)} kW\n` +
                       `• 計費模式：${latestData.rateTitle}\n` +
                       `• 電壓/電流：${latestData.V} V / ${latestData.A} A\n` +
                       `• 功率因數：${latestData.PF}\n\n` +
                       `💰 【電費估算與度數】\n` +
                       `• 本週預估：NT$ ${latestData.costWeek} (${latestData.kwhWeek} kWh)\n` +
                       `• 帳單週期：NT$ ${latestData.costBill} (${latestData.kwhBill} kWh)\n\n` +
                       `🌡️ 微氣候狀況：\n` +
                       `• 溫度：${latestData.temp} °C | 濕度：${latestData.humidity} %\n` +
                       `• 風速：${latestData.wind} m/s | 雨量：${latestData.rain} mm\n` +
                       `⏱️ 資料更新：${latestData.updateTime}`;

            try {
                await axios.post('https://api.line.me/v2/bot/message/reply', {
                    replyToken: replyToken,
                    messages: [{ type: 'text', text: text }]
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
                    }
                });
            } catch (error) {
                console.error('回覆 LINE 訊息失敗:', error.response?.data || error.message);
            }
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`中繼網頁伺服器已啟動，聆聽 Port ${PORT}`);
});
