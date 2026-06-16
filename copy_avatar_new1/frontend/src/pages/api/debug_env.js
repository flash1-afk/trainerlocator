export default function handler(req, res) {
  res.status(200).json({ url: process.env.NEXT_PUBLIC_BACKEND_URL });
}
