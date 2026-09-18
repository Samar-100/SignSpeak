Vendored from `onnxruntime-web/dist` (same version as package.json). The
package's `exports` map blocks deep imports, and Vite's dev server refuses to
dynamic-import an `.mjs` out of `/public`, so the runtime lives here and is
referenced via `?url` from `classifier.ts`. Re-copy when bumping onnxruntime-web.
