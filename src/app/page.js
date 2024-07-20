import dynamic from 'next/dynamic';

const Mermaid = dynamic(() => import('@/components/mermaid'), { ssr: false });

import Editor from '@/components/mermaideditor';

export default function Home() {
  return (
    <main className=" items-center p-24">
      <div>NWK Map</div>
      <Editor></Editor>
    </main>
  );
}//<Mermaid chart={mermaidChart} />