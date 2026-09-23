// Regenerates the Kangla narration tracks with OpenAI TTS.
//
// This is the preferred generator. The English and Hindi tracks originally
// shipped from `generate-kangla-audio-indic-parler.py`, whose English read is
// halting and flat — Indic Parler is tuned for Indic languages, and its English
// inserted half-second pauses mid-phrase. Running THIS script re-records all
// three languages with one engine, which also removes the voice mismatch
// between languages.
//
//   OPENAI_API_KEY=sk-... npm run audio:kangla
//
// Output lands directly in public/audio/kangla/<lang>/<stop>.mp3.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const envPath = path.join(root, ".env.local");

async function loadEnvFile() {
  try {
    const contents = await readFile(envPath, "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // The script also works with OPENAI_API_KEY already present in the shell.
  }
}

const narrations = [
  {
    language: "en",
    file: "guardians.mp3",
    input:
      "The paired white guardians stand before the Uttra at Kangla. Their upright bodies, open jaws and long tails make them one of Manipur's most recognisable cultural symbols.",
    instructions:
      "Speak as a warm, unhurried Indian English tourism guide standing at the site with one visitor. Conversational, not a news read: let the pace breathe, lift slightly into the interesting detail, and settle at the full stop. No dramatic pauses mid-sentence.",
  },
  {
    language: "en",
    file: "western-gate.mp3",
    input:
      "The western gateway brings together a tall open arch, blue timber-like facades and pale columns. Notice the roof's crossed finials, a distinctive feature in the architectural vocabulary of Kangla.",
    instructions:
      "Speak as a warm, unhurried Indian English tourism guide standing at the site with one visitor. Conversational, not a news read: let the pace breathe, lift slightly into the interesting detail, and settle at the full stop. No dramatic pauses mid-sentence.",
  },
  {
    language: "en",
    file: "pakhangba.mp3",
    input:
      "Pakhangba Laishang is a place of worship within Kangla. The white shrine, layered roof and raised approach sit within an open green setting. Explore its exterior with respect for its living religious significance.",
    instructions:
      "Speak as a warm, unhurried Indian English tourism guide standing at the site with one visitor. Conversational, not a news read: let the pace breathe, lift slightly into the interesting detail, and settle at the full stop. No dramatic pauses mid-sentence.",
  },
  {
    language: "hi",
    file: "guardians.mp3",
    input:
      "कांगला में उत्रा के सामने सफेद कांगला शा की जोड़ी खड़ी है। इनके सीधे खड़े शरीर, खुले जबड़े और लंबी पूंछ इन्हें मणिपुर के सबसे पहचाने जाने वाले सांस्कृतिक प्रतीकों में शामिल करते हैं।",
    instructions:
      "Speak as a warm, unhurried Hindi tourism guide standing at the site with one visitor. Natural conversational rhythm, clear but not clipped, settling gently at each full stop.",
  },
  {
    language: "hi",
    file: "western-gate.mp3",
    input:
      "पश्चिमी द्वार में ऊंचा खुला मेहराब, नीले लकड़ी जैसे मुखभाग और हल्के रंग के स्तंभ साथ दिखाई देते हैं। छत के क्रॉस आकार के फिनियल पर ध्यान दें, जो कांगला की स्थापत्य शैली की खास पहचान है।",
    instructions:
      "Speak as a warm, unhurried Hindi tourism guide standing at the site with one visitor. Natural conversational rhythm, clear but not clipped, settling gently at each full stop.",
  },
  {
    language: "hi",
    file: "pakhangba.mp3",
    input:
      "पाखंगबा लैशांग कांगला के भीतर स्थित एक पूजा स्थल है। सफेद मंदिर, परतदार छत और ऊंचा प्रवेश मार्ग खुले हरे परिसर में स्थित हैं। इसके जीवंत धार्मिक महत्व का सम्मान करते हुए बाहरी हिस्से को देखें।",
    instructions:
      "Speak as a warm, unhurried Hindi tourism guide standing at the site with one visitor. Natural conversational rhythm, clear but not clipped, settling gently at each full stop.",
  },
  {
    language: "mni",
    file: "guardians.mp3",
    input:
      "KANG-la-da OOT-tra-gee ma-MUNG-da KANG-la SA a-NEE lay. ma-KHOY-gee CHING LEM-ba HUK-chang, LAOW-na HUNG-dok-la-ba YA a-ma-SOONG SANG-la-ba MA-may ma-nee-POOR-gee sa-KHUNG-la-ba KUL-chur-gee KHU-dam a-ma-NEE.",
    instructions:
      "Speak warmly and slowly, like a Manipuri Meiteilon tourism guide. Follow the romanized Manipuri pronunciation carefully. Treat the hyphenated text as pronunciation guidance, not English words.",
  },
  {
    language: "mni",
    file: "western-gate.mp3",
    input:
      "Nong-choop thong-da a-wang-ba a-chaow-ba thong-mai, hi-gok-ki ma-mang a-ma-di ku-chu tai-phak-pa ma-chu-gi yum-bi lei. Yum-thak-ta lan-na-ba chi-rong, Kang-la-gi top-top-pa Kang-la-gi yum-sa sa-ba-gi ma-tik a-ma-ni.",
    instructions:
      "Speak warmly and slowly, like a Manipuri Meiteilon tourism guide. Follow the romanized Manipuri pronunciation carefully. Treat the hyphenated text as pronunciation guidance, not English words.",
  },
  {
    language: "mni",
    file: "pakhangba.mp3",
    input:
      "PAA-khang-ba lai-shang a-see KANG-la-gee muh-NOONG-da LAY-ba lai-shang uh-MAH-nee. uh-NOW-ba lai-shang, THOW-gut-la-ba THAAK, uh-muh-SOONG uh-WUNG-ba lum-BEE uh-see uh-SUNG-ba LAY-paak-ta LAY. muh-SEE-gee muh-PAAN o-ee-ba muh-phum-see-doo LAY-ree-ba lai-shing-gee MAANG-da YAAM noong-SHEE-na YAYNG-noo.",
    instructions:
      "Speak warmly and slowly, like a Manipuri Meiteilon tourism guide. Follow the romanized Manipuri pronunciation carefully. Treat the hyphenated text as pronunciation guidance, not English words.",
  },
];

async function createSpeech({ input, instructions }) {
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: "cedar",
      response_format: "mp3",
      speed: 1,
      input,
      instructions,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI speech request failed (${response.status}): ${detail}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

await loadEnvFile();

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is missing. Add it to .env.local or set it in your shell.");
}

for (const item of narrations) {
  const outputDir = path.join(root, "public", "audio", "kangla", item.language);
  await mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, item.file);
  const audio = await createSpeech(item);
  await writeFile(outputPath, audio);
  console.log(`Wrote ${path.relative(root, outputPath)}`);
}
