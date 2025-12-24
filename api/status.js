export default async function handler(req, res) {
    // Allow your frontend to access this data
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    try {
        const response = await fetch('https://axhfreeboosting.axelhosting.xyz/api/status');
        
        if (!response.ok) throw new Error('External API error');
        
        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error("Status Bridge Error:", error);
        return res.status(500).json({ error: "Failed to fetch status from AxelHosting" });
    }
}
