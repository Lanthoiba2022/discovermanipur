# Offline generator for the Kangla narration, using ai4bharat/indic-parler-tts.
#
# NOTE: this writes 16-bit PCM .wav, while the site ships .mp3 (a full set of
# WAVs is ~9 MB against ~2 MB of MP3, on a page that already loads a 3D scene).
# After generating, convert and drop the .wav files:
#
#   for f in public/audio/kangla/*/*.wav; do
#     ffmpeg -y -i "$f" -codec:a libmp3lame -b:a 96k -ac 1 "${f%.wav}.mp3" && rm "$f"
#   done

from pathlib import Path

import numpy as np
import torch
from scipy.io.wavfile import write as write_wav
from transformers import AutoTokenizer
from parler_tts import ParlerTTSForConditionalGeneration


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_ROOT = ROOT / "public" / "audio" / "kangla"
MODEL_ID = "ai4bharat/indic-parler-tts"


NARRATIONS = [
    {
        "language": "en",
        "file": "guardians.wav",
        "text": "The paired white guardians stand before the Uttra at Kangla. Their upright bodies, open jaws and long tails make them one of Manipur's most recognisable cultural symbols.",
        "description": "A warm Indian English female tourism guide speaks clearly at a moderate pace in a respectful heritage documentary style.",
    },
    {
        "language": "en",
        "file": "western-gate.wav",
        "text": "The western gateway brings together a tall open arch, blue timber-like facades and pale columns. Notice the roof's crossed finials, a distinctive feature in the architectural vocabulary of Kangla.",
        "description": "A warm Indian English female tourism guide speaks clearly at a moderate pace in a respectful heritage documentary style.",
    },
    {
        "language": "en",
        "file": "pakhangba.wav",
        "text": "Pakhangba Laishang is a place of worship within Kangla. The white shrine, layered roof and raised approach sit within an open green setting. Explore its exterior with respect for its living religious significance.",
        "description": "A warm Indian English female tourism guide speaks clearly at a moderate pace in a respectful heritage documentary style.",
    },
    {
        "language": "hi",
        "file": "guardians.wav",
        "text": "कांगला में उत्रा के सामने सफेद कांगला शा की जोड़ी खड़ी है। इनके सीधे खड़े शरीर, खुले जबड़े और लंबी पूंछ इन्हें मणिपुर के सबसे पहचाने जाने वाले सांस्कृतिक प्रतीकों में शामिल करते हैं।",
        "description": "A warm Hindi female tourism guide speaks clearly at a moderate pace in a respectful heritage documentary style.",
    },
    {
        "language": "hi",
        "file": "western-gate.wav",
        "text": "पश्चिमी द्वार में ऊंचा खुला मेहराब, नीले लकड़ी जैसे मुखभाग और हल्के रंग के स्तंभ साथ दिखाई देते हैं। छत के क्रॉस आकार के फिनियल पर ध्यान दें, जो कांगला की स्थापत्य शैली की खास पहचान है।",
        "description": "A warm Hindi female tourism guide speaks clearly at a moderate pace in a respectful heritage documentary style.",
    },
    {
        "language": "hi",
        "file": "pakhangba.wav",
        "text": "पाखंगबा लैशांग कांगला के भीतर स्थित एक पूजा स्थल है। सफेद मंदिर, परतदार छत और ऊंचा प्रवेश मार्ग खुले हरे परिसर में स्थित हैं। इसके जीवंत धार्मिक महत्व का सम्मान करते हुए बाहरी हिस्से को देखें।",
        "description": "A warm Hindi female tourism guide speaks clearly at a moderate pace in a respectful heritage documentary style.",
    },
    {
        "language": "mni",
        "file": "guardians.wav",
        "text": "KANG-la-da OOT-tra-gee ma-MUNG-da KANG-la SA a-NEE lay. ma-KHOY-gee CHING LEM-ba HUK-chang, LAOW-na HUNG-dok-la-ba YA a-ma-SOONG SANG-la-ba MA-may ma-nee-POOR-gee sa-KHUNG-la-ba KUL-chur-gee KHU-dam a-ma-NEE.",
        "description": "A warm Manipuri Meiteilon female tourism guide speaks slowly and clearly, following the romanized Manipuri pronunciation carefully.",
    },
    {
        "language": "mni",
        "file": "western-gate.wav",
        "text": "Nong-choop thong-da a-wang-ba a-chaow-ba thong-mai, hi-gok-ki ma-mang a-ma-di ku-chu tai-phak-pa ma-chu-gi yum-bi lei. Yum-thak-ta lan-na-ba chi-rong, Kang-la-gi top-top-pa Kang-la-gi yum-sa sa-ba-gi ma-tik a-ma-ni.",
        "description": "A warm Manipuri Meiteilon female tourism guide speaks slowly and clearly, following the romanized Manipuri pronunciation carefully.",
    },
    {
        "language": "mni",
        "file": "pakhangba.wav",
        "text": "PAA-khang-ba lai-shang a-see KANG-la-gee muh-NOONG-da LAY-ba lai-shang uh-MAH-nee. uh-NOW-ba lai-shang, THOW-gut-la-ba THAAK, uh-muh-SOONG uh-WUNG-ba lum-BEE uh-see uh-SUNG-ba LAY-paak-ta LAY. muh-SEE-gee muh-PAAN o-ee-ba muh-phum-see-doo LAY-ree-ba lai-shing-gee MAANG-da YAAM noong-SHEE-na YAYNG-noo.",
        "description": "A warm Manipuri Meiteilon female tourism guide speaks slowly and clearly, following the romanized Manipuri pronunciation carefully.",
    },
]


def main() -> None:
    device = "cuda:0" if torch.cuda.is_available() else "cpu"
    dtype = torch.float16 if device.startswith("cuda") else torch.float32

    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
    model = ParlerTTSForConditionalGeneration.from_pretrained(MODEL_ID, torch_dtype=dtype).to(device)

    for item in NARRATIONS:
        output_dir = OUTPUT_ROOT / item["language"]
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = output_dir / item["file"]

        prompt = tokenizer(item["text"], return_tensors="pt").to(device)
        description = tokenizer(item["description"], return_tensors="pt").to(device)

        with torch.no_grad():
            audio = model.generate(
                input_ids=description.input_ids,
                attention_mask=description.attention_mask,
                prompt_input_ids=prompt.input_ids,
                prompt_attention_mask=prompt.attention_mask,
            )

        audio_array = audio.cpu().numpy().squeeze().astype(np.float32)
        audio_array = np.clip(audio_array, -1.0, 1.0)
        pcm_audio = (audio_array * 32767).astype(np.int16)
        write_wav(output_path, model.config.sampling_rate, pcm_audio)
        print(f"Wrote {output_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
