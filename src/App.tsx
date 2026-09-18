import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import Backdrop from "./components/Backdrop";
import Home from "./pages/Home";

// The translate page pulls in MediaPipe and ONNX Runtime; keep them off the
// landing page's critical path.
const Translate = lazy(() => import("./pages/Translate"));

export default function App() {
  return (
    <>
      <div className="grain" aria-hidden />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/translate"
          element={
            <Suspense fallback={<Backdrop dim />}>
              <Translate />
            </Suspense>
          }
        />
      </Routes>
    </>
  );
}
