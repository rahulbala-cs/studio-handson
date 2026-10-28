'use client';

/**
 * The canvas: Studio opens Sections here (Base URL + /canvas). It renders
 * Studio's canvas and nothing else.
 */
import { StudioCanvas } from '@contentstack/studio-react';

export default function CanvasPage() {
  return <StudioCanvas />;
}
