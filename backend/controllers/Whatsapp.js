import axios from 'axios';
import jwt from 'jsonwebtoken';

// Masukkan access token yang didapatkan dari Meta WhatsApp API secara langsung
const DEFAULT_WHATSAPP_TOKEN = process.env.ACCESS_TOKEN || 'EAApQ3C3gdI0BPJKQoANIeiaRfqjwaN4fnzgMW8TIK3oJZCm2PeOs0MjjUQQFLaFwHR3ZACYeBABkhWQ1poZB3AqjyJCMMJDqMHUzzC4qj2gWfZAXH1y4eZADKQTOCLNdyXOyGPi8lqOv5wzyLk41ngW6lREroNZBIE2PtaEZB7KUsutBo24OmTkuZA8yig6eXxHO18nV37SlZC5Cv2k9GFflZB8ZAbKulZBjf49jqVMqcnRZCqgZDZD';
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID; // ID nomor WhatsApp bisnis

// Fungsi untuk mengenerate JWT RS256 jika perusahaan ingin generate token sendiri
const generateRS256Token = (payload, privateKey, options = {}) => {
    return jwt.sign(payload, privateKey, { algorithm: 'RS256', ...options });
};

// Fungsi untuk mengirim pesan WhatsApp
const sendWhatsappMessage = async (to, message, token) => {
    try {
        const url = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;
        const data = {
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: {
                body: message
            }
        };
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        const response = await axios.post(url, data, { headers });
        return response.data;
    } catch (error) {
        console.error('Error sending WhatsApp message:', error.response ? error.response.data : error.message);
        throw error;
    }
};

// Endpoint Express untuk mengirim pesan WhatsApp
// Perusahaan bisa mengirimkan access_token (RS256 JWT) di body request
export const sendMessage = async (req, res) => {
    const { to, message, access_token, private_key, payload } = req.body;

    if (!to || !message) {
        return res.status(400).json({ error: 'to dan message harus diisi' });
    }

    let tokenToUse = DEFAULT_WHATSAPP_TOKEN;

    // Jika perusahaan mengirimkan access_token (JWT RS256) langsung
    if (access_token) {
        tokenToUse = access_token;
    }
    // Atau jika perusahaan ingin generate JWT RS256 dari private_key dan payload
    else if (private_key && payload) {
        try {
            tokenToUse = generateRS256Token(payload, private_key);
        } catch (err) {
            return res.status(400).json({ error: 'Gagal generate JWT RS256: ' + err.message });
        }
    }

    try {
        const result = await sendWhatsappMessage(to, message, tokenToUse);
        res.json({ success: true, result });
    } catch (err) {
        res.status(500).json({ error: 'Gagal mengirim pesan WhatsApp' });
    }
};
