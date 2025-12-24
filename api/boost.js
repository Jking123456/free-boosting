export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'POST') {
        try {
            const { url, service_type } = req.body;

            // Forward the request to the AxelHosting API
            const response = await fetch('https://axhfreeboosting.axelhosting.xyz/api/boost', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, service_type })
            });

            const data = await response.json();
            return res.status(response.status).json(data);

        } catch (error) {
            console.error("Boost Bridge Error:", error);
            return res.status(500).json({ error: 'Internal Bridge Error' });
        }
    }

    return res.status(405).json({ message: "Method not allowed" });
}

