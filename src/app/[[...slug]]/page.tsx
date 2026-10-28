import { cache } from 'react';
import { notFound } from 'next/navigation';
import { getSSRStyles, isCompositionNotFound } from '@contentstack/studio-react';
import { sdk, stack } from '@/lib/contentstack';
import { TemplateRenderer, NewTemplate } from './template-renderer';

type Props = {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string>>;
};

// True when Studio is loading this URL (its canvas or a template preview).
const inStudio = (q: URLSearchParams) =>
  ['cs-composable-studio', 'hash', 'live_preview'].some((p) => q.has(p));

const getTemplate = cache(async (url: string, searchQuery: string) => {
  // The SDK keeps Studio's last preview hash on the shared stack. Clear it on a
  // normal visit, so the site shows deployed layouts, not Studio's unsaved ones.
  if (!inStudio(new URLSearchParams(searchQuery))) stack.livePreviewQuery({ live_preview: '' });
  try {
    return await sdk.fetchCompositionData({ url, searchQuery });
  } catch (error) {
    // No template for this URL is a 404. Anything else (a bad token, an outage) stays a 500.
    if (isCompositionNotFound(error)) return null;
    throw error;
  }
});

export default async function Page({ params, searchParams }: Props) {
  const { slug = [] } = await params;
  const url = '/' + slug.join('/');
  const searchQuery = new URLSearchParams(await searchParams).toString();
  const specOptions = await getTemplate(url, searchQuery);

  if (!specOptions) {
    // Inside Studio, no saved template yet is normal: someone is building one.
    if (inStudio(new URLSearchParams(searchQuery))) {
      return <NewTemplate url={url} searchQuery={searchQuery} />;
    }
    notFound();
  }

  return (
    <>
      {/* Styles set in Studio's Design tab, and the design tokens. */}
      <style dangerouslySetInnerHTML={{ __html: getSSRStyles(specOptions.spec) }} />
      <TemplateRenderer specOptions={specOptions} />
    </>
  );
}
