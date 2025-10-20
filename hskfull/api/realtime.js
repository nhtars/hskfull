import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  try {
    const { audioBase64 } = JSON.parse(req.body);
    const audioBuffer = Buffer.from(audioBase64, "base64");

    const whisper = await openai.audio.transcriptions.create({
      file: audioBuffer,
      model: "gpt-4o-mini-transcribe"
    });

    const analysis = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content:
            "Bạn là giáo viên tiếng Trung, chấm phát âm theo chuẩn thanh điệu, rõ âm cuối, tốc độ, tự nhiên. Cho điểm 0–100 và góp ý ngắn gọn."
        },
        { role: "user", content: whisper.text }
      ]
    });

    res.status(200).json({ transcript: whisper.text, feedback: analysis.output_text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

