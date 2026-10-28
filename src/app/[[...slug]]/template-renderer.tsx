'use client';

import { useEffect, useState } from 'react';
import { StudioComponent, type StudioComponentSpecOptions } from '@contentstack/studio-react';
import '@/studio/register-components';

export function TemplateRenderer({ specOptions }: { specOptions: StudioComponentSpecOptions }) {
  return <StudioComponent specOptions={specOptions} />;
}

// Studio opened a URL with no saved template yet: someone is building one.
// Studio sends the layout to the browser, so this renders only there.
export function NewTemplate({ url, searchQuery }: { url: string; searchQuery: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <StudioComponent
      specOptions={
        {
          spec: null,
          fetchOptions: { compositionQuery: { url }, options: { locale: 'en-us' }, searchQuery },
        } as never
      }
    />
  );
}
