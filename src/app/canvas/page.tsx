'use client';

/**
 * The canvas: Studio opens Sections here (Base URL + /canvas). It renders
 * Studio's canvas and nothing else.
 */
import { StudioCanvas, getSSRStyles } from '@contentstack/studio-react';

export default function CanvasPage() {
  // The design tokens' CSS variables, which styles set in the Design tab refer to.
  const tokens = getSSRStyles(null);
  return (
    <>
      {tokens ? <style suppressHydrationWarning>{tokens}</style> : null}
      <StudioCanvas />
    </>
  );
}
