# Engine attribution

The recognition pipeline in this folder (`preprocessing.ts`, `buffer.ts`,
`mirror.ts`, `motion.ts`, `tracking.ts`, `classifier.ts`) and the model in
`public/models/sign_cnn.onnx` are adapted from
https://github.com/ash-sid/sign-recognition — a 1D-CNN over MediaPipe
hand + pose landmarks trained on the Google Isolated Sign Language
Recognition dataset (Kaggle `asl-signs`, 250 signs, 21 signers).

Reported accuracy on held-out signers: 61.0% top-1, 82.6% top-5.
The preprocessing must match `reports/contract.md` in that repo exactly;
do not change it without re-checking parity against the reference.

`recognizer.ts` is SignSpeak's own orchestration layer.
