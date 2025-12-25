export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const { url, service_type, captcha_token } = req.body;

        // Verify with Cloudflare
        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=0x4AAAAAACI_-p8ezEAfpg3jd4ASIH8hRow&response=${captcha_token}`
        });

        const vResult = await verifyRes.json();

        if (!vResult.success) {
            return res.status(403).json({ message: "Captcha failed or expired" });
        }

        // Forward to AxelHosting
        const response = await fetch('https://axhfreeboosting.axelhosting.xyz/api/boost', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, service_type })
        });

        const data = await response.json();
        return res.status(response.status).json(data);

    } catch (error) {
        return res.status(500).json({ message: "Server Error" });
    }
}
