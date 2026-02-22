import { Shell } from '~/components/layout/shell';

export function meta() {
  return [
    { title: 'InlinePDF | Local-First PDF Tools' },
    {
      name: 'description',
      content:
        'InlinePDF is a local-first iLovePDF alternative. PDF processing runs in your browser with PDF.js and PDF-Lib.',
    },
  ];
}

export default function HomeRoute() {
  return (
    <Shell>
      <section />
    </Shell>
  );
}
