'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';

const Mermaid = dynamic(() => import('@/components/mermaid'), { ssr: false });

export default function Editor() {
  const [mermaidChart, setMermaidChart] = useState(`mindmap
  root((NWK map))
    Carnivora
      Feline
        Cat
        Tiger
      Kanine
        Wolves
        Dogs
  `);

  const change = (e) => {
    setMermaidChart(e.target.value);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent the default newline behavior

      const { selectionStart, selectionEnd, value } = event.target;
      const currentLineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
      const currentLine = value.substring(currentLineStart, selectionStart);
      const leadingSpaces = currentLine.match(/^\s*/)[0];

      const newValue = 
        value.substring(0, selectionStart) + '\n' + leadingSpaces + value.substring(selectionEnd);

      setMermaidChart(newValue);

      // Move the cursor to the new position
      setTimeout(() => {
        event.target.selectionStart = event.target.selectionEnd = selectionStart + leadingSpaces.length + 1;
      }, 0);
    }
  };

  const downloadFile = (filename, content) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };

  function parseHierarchy(data) {
    const lines = data.split('\n').map(line => line.replace(/\s+$/, '')); // Split lines and remove trailing spaces
    const root = { name: 'root', children: [] };
    const stack = [root];
  
    lines.forEach(line => {
      const level = line.match(/^\s*/)[0].length;
      const name = line.trim();
      const node = { name, children: [] };
  
      while (stack.length > level + 1) {
        stack.pop();
      }
      
      stack[stack.length - 1].children.push(node);
      stack.push(node);
    });
  
    return root;
  }
  
  function treeToNewick(node) {
    if (!node.children.length) {
      return node.name;
    }
  
    const childrenNewick = node.children.map(child => treeToNewick(child)).join(',');
    return `(${childrenNewick})${node.name}`;
  }
  
  const handleExport = () => {
    const data = treeToNewick(parseHierarchy(mermaidChart))
    downloadFile('map.nwk', data);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target.result;
      try {
        const importedData = content;
        // Update your mind map data with importedData
        setMermaidChart(importedData);
      } catch (error) {
        console.error('Error parsing imported data:', error);
        alert('An error occur while reading the data');
      }
    };
  
    reader.readAsText(file);
  };  
  
  return (
    <main>
        <div>
          <button onClick={handleExport}>Export Data</button>
          <input
            type="file"
            accept=".txt"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="fileInput"
          />
          <button onClick={() => document.getElementById('fileInput').click()}>Import Data</button>
        </div>
        <div class="full flex justify-center">
            <span class="half flex-1">
                <textarea
                value={mermaidChart}
                onChange={change}
                onKeyDown={handleKeyDown}
                rows={10}
                className="w-full p-2 border border-gray-300 rounded"
                ></textarea>
            </span>
            <span class="half flex-1">
                <Mermaid chart={mermaidChart} key={mermaidChart} />
            </span>
        </div>
    </main>
  );
}
