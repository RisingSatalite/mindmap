'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';

const Mermaid = dynamic(() => import('@/components/mermaid'), { ssr: false });

export default function Editor() {
  const [mermaidChart, setMermaidChart] = useState(`mindmap
  root(NWK map name)
    Mammals
      Bats
      Rodents
        Mice
      Carnivora
        Feline
          Cat
          Tiger
        Kanine
          Wolves
          Dogs
    Retiles
      Birds
      Lizards
        Snake
    Insect
      Ants
        Fire Ants
        Bees
          Honey Bee
        Wasp
      Termites
      Butterflies`);

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

  function removeBegginingSpaces(str) {
    return str.replace(/^\s+/, '');
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

    changeData(data) {
      this.data = data
    }

    returnChildren(){
      return this.children
    }

    // Print the tree (for debugging)
    printTree(indent = '') {
      console.log(`${indent}${this.data}`);
      this.children.forEach(child => child.printTree(indent + '  '));
    }

    hasChildren(){
      if(this.children == 0){
        return false;
      }
      return true;
    }
  }

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

    bottom(){//Return first item
      return this.items[1];
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
          nodeStack.peek().addChild(newNode)//Add to the tree
          nodeStack.push(newNode)//Add to the stack
          spaceStack.push(spaces)
          break;
        }
      }
    }
    //storageTree.printTree();
    return storageTree;
  }

  const treeToNWK = (tree) => {
    var text = ""
    console.log(tree.readData())
    if(tree.hasChildren()){
      text = text + "("
      var first = true
      for(let childNode of tree.returnChildren()){
        if(!first){
          text = text + ","
        }
        text = treeToNWKrecursion(childNode, text)
        first = false;
      }
      text = text + ")"
    }
    text = text + tree.readData() + ";";

    return text
  }

  const treeToNWKrecursion = (tree, text) => {
    console.log(tree.readData())
    if(tree.hasChildren()){
      text = text + "("
      var first = true
      for(let childNode of tree.returnChildren()){
        if(!first){
          text = text + ","
        }
        text = treeToNWKrecursion(childNode, text)
        first = false;
      }
      text = text + ")"
    }
    text = text + tree.readData();

    return text
  }

  const NWKtoTree = (newick) => {
    let currentNode = new TreeNode("Initial");
    const originNode = currentNode
    let nodeStack = new Stack();
    nodeStack.push(currentNode);
    let token = '';
  
    let resetDataFlag = false; // To change the data later, if there is a child node
  
    for (let i = 0; i < newick.length; i++) {
      let char = newick[i];
  
      if (char === '(') {
        const newNode = new TreeNode("unnamed");
        currentNode.addChild(newNode); // Add to the tree
        nodeStack.push(newNode); // Add to the stack
        currentNode = newNode;
      } else if (char === ',') {
        if (resetDataFlag) {
          currentNode.changeData(token);
          token = '';
        } else {
          currentNode.addChild(new TreeNode(token));
          token = '';
        }
        resetDataFlag = false;
        currentNode = nodeStack.peek();
      } else if (char === ')') {
        if (resetDataFlag) {
          currentNode.changeData(token);
          token = '';
        } else {
          currentNode.addChild(new TreeNode(token));
          token = '';
        }
        nodeStack.pop();
        currentNode = nodeStack.peek();
        resetDataFlag = true;
      } else if (char === ';') {
        continue; // Done
      } else {
        token += char;
      }
    }
  
    if (token) { // If still some data, add to node
      currentNode.changeData(token);
    }
  
    return originNode;
  };
  

  const treeToMermaid = (dataTree) => {
    var data = `mindmap`
    const spaceCount = 2
    const space = " ".repeat(spaceCount)
    data = `${data}\n${space}${dataTree.readData()}`;

    for(let childNode of dataTree.returnChildren()){
      data = treeToMermaidRecursionLoop(childNode, data, spaceCount)
    }
    
    return data;
  }

  const treeToMermaidRecursionLoop = (dataTree, data, spaceCount) => {
    const space = " ".repeat(spaceCount+2)
    data = `${data}\n${space}${dataTree.readData()}`;

    for(let childNode of dataTree.returnChildren()){
      data = treeToMermaidRecursionLoop(childNode, data, spaceCount+2)
    }
    
    return data;
  }

  const handleExport = () => {
    const data = mermaidChart
    //console.log("Tree data")
    const tree = dataToTree(data)
    tree.printTree()
    const real = treeToNWK(tree)
    console.log(real)
    downloadFile('map.nwk', real);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target.result;
      try {
        const importedData = content;
        console.log(importedData)
        const treeData = NWKtoTree(importedData)
        treeData.printTree()
        // Update your mind map data with importedData
        setMermaidChart(treeToMermaid(treeData));
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
