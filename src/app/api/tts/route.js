import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { text } = await req.json();

    if (!text) {
      return Response.json({ error: "Text required" }, { status: 400 });
    }

    // Generate speech with correct model
    const speech = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text,
      format: "mp3",
    });

    // Convert to buffer
    const buffer = Buffer.from(await speech.arrayBuffer());

    return new Response(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.length.toString(),
      },
    });

  } catch (err) {
    console.error("TTS Error:", err);
    return Response.json({ error: `TTS failed: ${err.message}` }, { status: 500 });
  }
}
