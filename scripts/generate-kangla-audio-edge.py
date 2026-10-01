"""
Generate the Kangla narration with Microsoft Edge neural voices: free, and
with no API key.

This is what currently ships for English. The original English and Hindi came
from `generate-kangla-audio-indic-parler.py`, whose English read was halting:
it inserted half-second pauses mid-phrase and drifted between 107 and 139 wpm
across three clips. Edge's `en-IN-NeerjaExpressiveNeural` is a genuine neural
voice and holds an even pace.

    pip install edge-tts
    python scripts/generate-kangla-audio-edge.py            # English only
    python scripts/generate-kangla-audio-edge.py --lang hi  # Hindi too

Meiteilon is deliberately not covered: no TTS engine ships a Meitei voice, so
those tracks stay as they are.

ffmpeg is required for the post pass, which trims dead air at the edges, caps
any pause at 0.55s (long enough to breathe between sentences, short enough not
to sound like a dropout) and levels every clip to -18 LUFS so switching
language does not jump the volume.
"""

from __future__ import annotations

import argparse
import asyncio
import shutil
import subprocess
import sys
from pathlib import Path

try:
    import edge_tts
except ImportError:  # pragma: no cover - a setup hint, not a code path
    sys.exit("edge-tts is not installed. Run: pip install edge-tts")

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_ROOT = ROOT / "public" / "audio" / "kangla"

# Slightly under natural pace: this is heritage narration, not an advert.
RATE = "-6%"

VOICES = {
    "en": "en-IN-NeerjaExpressiveNeural",
    "hi": "hi-IN-SwaraNeural",
}

# The text must stay in step with `src/lib/immersive/narration.ts`, which is
# what the site puts on screen.
NARRATIONS: dict[str, dict[str, str]] = {
    "en": {
        "guardians": "The paired white guardians stand before the Uttra at Kangla. Their upright bodies, open jaws and long tails make them one of Manipur's most recognisable cultural symbols.",
        "western-gate": "The western gateway brings together a tall open arch, blue timber-like facades and pale columns. Notice the roof's crossed finials, a distinctive feature in the architectural vocabulary of Kangla.",
        "pakhangba": "Pakhangba Laishang is a place of worship within Kangla. The white shrine, layered roof and raised approach sit within an open green setting. Explore its exterior with respect for its living religious significance.",
    },
    "hi": {
        "guardians": "कांगला में उत्रा के सामने सफेद कांगला शा की जोड़ी खड़ी है। इनके सीधे खड़े शरीर, खुले जबड़े और लंबी पूंछ इन्हें मणिपुर के सबसे पहचाने जाने वाले सांस्कृतिक प्रतीकों में शामिल करते हैं।",
        "western-gate": "पश्चिमी द्वार में ऊंचा खुला मेहराब, नीले लकड़ी जैसे मुखभाग और हल्के रंग के स्तंभ साथ दिखाई देते हैं। छत के क्रॉस आकार के फिनियल पर ध्यान दें, जो कांगला की स्थापत्य शैली की खास पहचान है।",
        "pakhangba": "पाखंगबा लैशांग कांगला के भीतर स्थित एक पूजा स्थल है। सफेद मंदिर, परतदार छत और ऊंचा प्रवेश मार्ग खुले हरे परिसर में स्थित हैं। इसके जीवंत धार्मिक महत्व का सम्मान करते हुए बाहरी हिस्से को देखें।",
    },
}

SILENCE = "silenceremove=start_periods=1:start_duration=0:start_threshold=-45dB:detection=peak"
POST = (
    f"{SILENCE},areverse,{SILENCE},areverse,"
    "silenceremove=stop_periods=-1:stop_duration=0.55:stop_threshold=-45dB:detection=peak,"
    "loudnorm=I=-18:TP=-1.5:LRA=11"
)


async def synthesise(text: str, voice: str, destination: Path) -> None:
    await edge_tts.Communicate(text, voice, rate=RATE).save(str(destination))


def post_process(source: Path, destination: Path) -> None:
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(source), "-af", POST,
         "-codec:a", "libmp3lame", "-b:a", "96k", "-ac", "1", str(destination)],
        check=True,
    )


async def main(languages: list[str]) -> None:
    if not shutil.which("ffmpeg"):
        sys.exit("ffmpeg is not on PATH; it is needed to level and trim the output.")

    for language in languages:
        voice = VOICES[language]
        output_dir = OUTPUT_ROOT / language
        output_dir.mkdir(parents=True, exist_ok=True)

        for stop, text in NARRATIONS[language].items():
            raw = output_dir / f"{stop}.raw.mp3"
            final = output_dir / f"{stop}.mp3"
            await synthesise(text, voice, raw)
            post_process(raw, final)
            raw.unlink()
            print(f"Wrote {final.relative_to(ROOT)}  ({voice})")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--lang",
        action="append",
        choices=sorted(VOICES),
        help="Language to generate; repeatable. Defaults to English only.",
    )
    args = parser.parse_args()
    asyncio.run(main(args.lang or ["en"]))
