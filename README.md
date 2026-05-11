# MotionForge

MotionForge is an MVP visual section builder for developers. It lets you select elements in a responsive hero section, edit real layout/style properties, preview GSAP animations, and export a clean React/Tailwind/GSAP component.

## Features

- Next.js App Router + TypeScript + Tailwind CSS
- Tree-based hero section model
- Desktop, tablet, and mobile viewport editing layers
- Element tree selection and live canvas highlighting
- Inspector controls for layout, typography, color, opacity, z-index, and overflow
- GSAP animation controls for page-load, scroll-enter, and hover triggers
- Suggest Mobile Layout action for quick responsive defaults
- Export modal with generated React component and GSAP logic
- Reset back to the default hero section

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the builder.

Useful checks:

```bash
npm run typecheck
npm run build
```

## Project structure

```text
app/
  page.tsx
components/
  MotionForgeApp.tsx
  TopToolbar.tsx
  ElementTree.tsx
  CanvasPreview.tsx
  InspectorPanel.tsx
  AnimationPanel.tsx
  CodeExportModal.tsx
lib/
  types.ts
  defaultTree.ts
  treeUtils.ts
  styleUtils.ts
  codegen.ts
```
