'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';

const Mermaid = dynamic(() => import('@/components/mermaid'), { ssr: false });

export default function Editor() {
  const [mermaidChart, setMermaidChart] = useState(`mindmap
  root(NWK map name)
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

  function countLeadingSpaces(str) {
    const match = str.match(/^ */);
    return match ? match[0].length : 0;
  }

  function removeBegginingSpaces(string) {
    return string.trimStart();
  }

  class TreeNode {
    constructor(data) {
      this.data = data;
      this.children = [];
    }

    // Add a child node
    addChild(childNode) {
      if (childNode instanceof TreeNode) {
        this.children.push(childNode);
      } else {
        throw new Error('Child must be an instance of TreeNode');
      }
    }

    // Read data from the node
    readData() {
      return this.data;
    }

    returnChildren(){
      return removeBegginingSpaces(this.children)
    }

    // Print the tree (for debugging)
    printTree(indent = '') {
      console.log(`${indent}${removeBegginingSpaces(this.data)}`);
      this.children.forEach(child => child.printTree(indent + '  '));
    }
  }

  // Stack class
  class Stack {

    // Array is used to implement stack
    constructor()
    {
        this.items = [];
    }

    push(element)
    {
      // push element into the items
      this.items.push(element);
    }
    
    pop()
    {
      if (this.items.length == 0)
          return 'Underflow'
      return this.items.pop();
    }
    
    peek()
    {
      return this.items[this.items.length - 1];
    }
    // isEmpty()
    printStack()
    {
      let str = "";
      for (let i = 0; i < this.items.length; i++)
        str += this.items[i] + " ";
      return str;
    }
  }

  const dataToTree = (data) => {
    const start = data.indexOf('(') + 1;
    const end = data.indexOf(')');
    const root = data.substring(start, end).trim();
    const allData = data.substring(end).trim();
    const lines = allData.split('\n')
    const storageTree = new TreeNode(root)//Disregard the first line as that is just mindmap
    var spaceStack = new Stack();
    var nodeStack = new Stack();
    var spaces = 0;
    spaceStack.push(0)
    nodeStack.push(storageTree)
    for (let i = 1; i < lines.length; i++) {
      spaces = countLeadingSpaces(lines[i])
      console.log(removeBegginingSpaces(lines[i]))
      while(true){
        if(spaces <= spaceStack.peek()){
          console.log("Sibling")
          console.log(nodeStack.pop().readData())//Is sibling node, remove and attach to the parent
          spaceStack.pop()
        }
        if(spaces > spaceStack.peek()){
          console.log("Parent")
          //nodeStack.peek().printTree()
          const newNode = new TreeNode(removeBegginingSpaces(lines[i]))
          nodeStack.peek().addChild(newNode)//Remove beggining zeros
          nodeStack.push(newNode)
          spaceStack.push(spaces)
          break;
        }
      }
    }
    //storageTree.printTree();
    return storageTree;
  }

  const handleExport = () => {
    const data = mermaidChart
    //console.log("Tree data")
    const tree = dataToTree(data)
    tree.printTree()
    //downloadFile('map.nwk', data);
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
