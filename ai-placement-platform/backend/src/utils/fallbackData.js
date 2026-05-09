const FALLBACK_CONCEPTS = {
  DSA: `
# Data Structures and Algorithms (DSA)

**Definition**: A way of organizing and storing data so that operations can be performed efficiently.

**Key points**:
- **Time Complexity**: Measure of how the execution time increases with input size (O(n), O(log n)).
- **Space Complexity**: Measure of extra memory used by the algorithm.
- **Fundamental Structures**: Arrays, Linked Lists, Stacks, Queues, Trees, Graphs.

**Example**:
Searching for a value in a sorted array using Binary Search is O(log n), whereas Linear Search is O(n).

**Interview Tip**:
Always discuss the trade-offs between time and space complexity for your solution.
  `,
  React: `
# React.js

**Definition**: A JavaScript library for building user interfaces based on components.

**Key points**:
- **JSX**: Syntax extension for JS that looks like HTML.
- **State & Props**: State is internal data; Props are passed from parents.
- **Hooks**: Functions like useState and useEffect to manage logic in functional components.

**Example**:
Using ` + "`" + `useState` + "`" + ` to manage a counter variable.

**Interview Tip**:
Explain how the Virtual DOM works and how React optimizes rendering.
  `,
  Default: `
# Concept Overview

**Definition**: A core technical concept used in software development and system design.

**Key points**:
- Understanding fundamental principles.
- Applying best practices in implementation.
- Considering efficiency and scalability.

**Example**:
Implementation varies based on specific use cases and technical requirements.

**Interview Tip**:
Be prepared to explain both the 'how' and the 'why' behind your technical choices.
  `
};

const FALLBACK_MCQS = {
  DSA: [
    {
      question: "What is the time complexity of searching in a Hash Map (average case)?",
      options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
      answer: "O(1)",
      explanation: "Hash maps provide constant time complexity for search, insert, and delete operations on average."
    },
    {
      question: "Which data structure follows the LIFO (Last In First Out) principle?",
      options: ["Queue", "Stack", "Linked List", "Tree"],
      answer: "Stack",
      explanation: "A Stack follows the LIFO principle where the last element added is the first one to be removed."
    },
    {
      question: "Which of these is NOT a stable sorting algorithm?",
      options: ["Merge Sort", "Bubble Sort", "Quick Sort", "Insertion Sort"],
      answer: "Quick Sort",
      explanation: "Quick Sort is generally not stable, meaning it may not preserve the relative order of equal elements."
    },
    {
      question: "What is the best case time complexity of Bubble Sort?",
      options: ["O(n)", "O(n log n)", "O(n^2)", "O(1)"],
      answer: "O(n)",
      explanation: "Bubble Sort has a best case of O(n) when the array is already sorted and an optimized version is used."
    },
    {
      question: "Which data structure is used for Breadth-First Search (BFS) in a graph?",
      options: ["Stack", "Queue", "Priority Queue", "Tree"],
      answer: "Queue",
      explanation: "BFS uses a Queue to keep track of nodes to visit next in a level-order fashion."
    }
  ],
  Default: [
    {
      question: "Which of the following is a primary goal of Software Engineering?",
      options: ["Maintainability", "Performance", "Scalability", "All of the above"],
      answer: "All of the above",
      explanation: "Software engineering aims to build systems that are maintainable, performant, and scalable."
    },
    {
      question: "What does DRY stand for in programming?",
      options: ["Do Repeat Yourself", "Don't Repeat Yourself", "Data Retrieval Yield", "Dynamic Response Year"],
      answer: "Don't Repeat Yourself",
      explanation: "DRY is a principle aimed at reducing repetition of software patterns."
    },
    {
      question: "Which of these is a version control system?",
      options: ["Git", "Docker", "Node.js", "React"],
      answer: "Git",
      explanation: "Git is the most widely used version control system for tracking changes in source code."
    },
    {
      question: "What is the purpose of a constructor in OOP?",
      options: ["Initialize an object", "Destroy an object", "Copy an object", "None of the above"],
      answer: "Initialize an object",
      explanation: "A constructor is a special method used to initialize objects when they are created."
    },
    {
      question: "In web development, what does CSS stand for?",
      options: ["Cascading Style Sheets", "Creative Style Sheets", "Computer Style Sheets", "Colorful Style Sheets"],
      answer: "Cascading Style Sheets",
      explanation: "CSS is used for styling and laying out web pages."
    }
  ]
};

module.exports = { FALLBACK_CONCEPTS, FALLBACK_MCQS };
