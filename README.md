# SignSpeak

Point your webcam, sign a word, read it on screen. American Sign Language
word recognition that runs entirely in the browser — no backend, no upload.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173, click **Start translating**, allow the camera.

## How it works

1. **MediaPipe** (hand + pose landmarkers, WebAssembly/WebGL) tracks 21
   landmarks per hand and the shoulders every frame.
2. Landmarks are normalised relative to shoulder width, kept in a sliding
   window, and **segmented by motion**: scoring runs only while the hands
   move, and the burst's scores are averaged when they settle.
3. A small **1D-CNN (ONNX, 1.6 MB)** trained on the Google Isolated Sign
   Language Recognition dataset ranks 250 signs. The top guess is committed
   if it clears the confidence threshold.

Reported accuracy on unseen signers: 61% top-1, 83% top-5. Most misses come
from hand tracking, not the model — good light and both hands in frame help.

## Layout

- `src/engine/` — recognition pipeline (see `ATTRIBUTION.md` there)
- `src/hooks/useRecognizer.ts` — React binding
- `src/pages/Home.tsx` — landing page
- `src/pages/Translate.tsx` — live translator
- `public/models/` — ONNX graph + label list

## Credits

Pipeline and model adapted from
[ash-sid/sign-recognition](https://github.com/ash-sid/sign-recognition).
Dataset: [Google – Isolated Sign Language Recognition](https://www.kaggle.com/competitions/asl-signs).
