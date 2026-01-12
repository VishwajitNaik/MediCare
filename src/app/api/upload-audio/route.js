import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio");

    if (!audioFile) {
      return Response.json(
        { error: "Audio file missing" },
        { status: 400 }
      );
    }

    console.log("📁 Received file:", {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size,
    });

    // ✅ SEND FILE DIRECTLY (IMPORTANT)
    const transcription = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file: audioFile,
    });

    console.log("📝 Transcription:", transcription.text);

    return Response.json({
      success: true,
      text: transcription.text,
    });

  } catch (error) {
    console.error("❌ Whisper error:", error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
