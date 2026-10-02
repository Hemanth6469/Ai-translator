export default function handler(req, res) {
  res.status(200).json({
    status: 'online',
    platform: 'Vercel Serverless',
    timestamp: new Date().toISOString()
  });
}
