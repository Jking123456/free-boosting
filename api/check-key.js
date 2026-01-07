import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send("POST only");
    
    const { key } = req.body;

    try {
        const ttl = await redis.ttl(key);
        const lockedIP = await redis.get(`lock:${key}`);

        if (ttl <= 0) {
            return res.json({ success: false, message: "Key Not Found or Expired" });
        }

        const h = Math.floor(ttl / 3600);
        const m = Math.floor((ttl % 3600) / 60);

        return res.json({
            success: true,
            hours: h,
            mins: m,
            ip: lockedIP || "Not yet activated"
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error" });
    }
}
