import dynamic from 'next/dynamic';

const Mermaid = dynamic(() => import('@/components/mermaid'), { ssr: false });

import Editor from '@/components/mermaideditor';

export default function Home() {
  const mermaidChart = `
    mindmap
      root((mindmap))
        Origins
          Long history
          ::icon(fa fa-book)
          Popularisation
            British popular psychology author Tony Buzan
        Research
          On effectivness<br/>and features
          On Automatic creation
            Uses
                Creative techniques
                Strategic planning
                Argument mapping
        Tools
          Pen and paper
          Mermaid
  `;
  const mindMapChart = `
    mindmap
      root((Mindmap))
        child 1
          grandchild 1
          grandchild 2
        child 2
          grandchild 3
          grandchild 4
  `;
  return (
    <main className=" items-center p-24">
      <div>Mindmap maker</div>
      <Editor></Editor>
    </main>
  );
}//<Mermaid chart={mermaidChart} />