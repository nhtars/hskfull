import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  try {
    const { text } = JSON.parse(req.body);
    const speech = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "verse",
      input: text
    });
    const buffer = Buffer.from(await speech.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
