export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: "POST only" });

    const VALID_KEYS = [
        "boosting_Jd137jda",
        "boosting_H74ajdtr",
        "boosting_a62Hra7q",
        "boosting_jH38vsH4"
    ];

    try {
        const { url, service_type, access_key } = req.body;

        // 1. Validate Access Key
        if (!VALID_KEYS.includes(access_key)) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid or Expired Access Key" 
            });
        }

        // 2. Forward to AxelHosting API
        const response = await fetch('https://axhfreeboosting.axelhosting.xyz/api/boost', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, service_type })
        });

        const data = await response.json();
        return res.status(response.status).json(data);

    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
