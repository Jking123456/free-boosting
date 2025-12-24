export default async function handler(req, res) {
    // Enable CORS for Vercel
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'POST') {
        try {
            const { url, service_type } = req.body;

            // Strict check: only Facebook is allowed
            if (service_type !== 'facebook_boost') {
                return res.status(400).json({ 
                    error: "Service unavailable", 
                    message: "TikTok boosting is currently disabled." 
                });
            }

            // Forwarding the request to the official API base
            const response = await fetch('https://axhfreeboosting.axelhosting.xyz/api/boost', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, service_type })
            });

            const data = await response.json();
            return res.status(response.status).json(data);

        } catch (error) {
            return res.status(500).json({ error: 'Internal Bridge Error' });
        }
    }

    return res.status(405).json({ message: "Only POST allowed" });
}
