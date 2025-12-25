export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'POST') {
        try {
            const { url, service_type, captcha_token } = req.body;

            // 1. Verify Cloudflare Turnstile Token
            const verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
            const secretKey = '0x4AAAAAACI_-p8ezEAfpg3jd4ASIH8hRow';

            const verificationResponse = await fetch(verifyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `secret=${secretKey}&response=${captcha_token}`
            });

            const verificationResult = await verificationResponse.json();

            if (!verificationResult.success) {
                return res.status(403).json({ 
                    error: "Captcha failed", 
                    message: "Bot activity detected. Please try again." 
                });
            }

            // 2. If verified, forward to AxelHosting API
            const response = await fetch('https://axhfreeboosting.axelhosting.xyz/api/boost', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, service_type })
            });

            const data = await response.json();
            return res.status(response.status).json(data);

        } catch (error) {
            console.error("Verification Bridge Error:", error);
            return res.status(500).json({ error: 'Security Verification Failed' });
        }
    }

    return res.status(405).json({ message: "Method not allowed" });
}
    
