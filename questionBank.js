// A small, free, offline library of ready-made coding problems that admins
// can import with one click while building an exam. Each entry ships with a
// problem statement, one sample input/output pair (shown to students), and a
// separate set of test cases (used for grading, not shown to students).
//
// Note on "free APIs": there is no public API that reliably serves coding
// problems bundled with runnable, license-clear test cases, so this bank is
// bundled locally (zero cost, always available, no rate limits). Actual code
// *execution* — the compiler behind the Run button — does use a real free
// public API: Judge0 CE (see codeRunner.js).

export const CODING_QUESTION_BANK = [
  {
    id: 'sum-two-numbers',
    title: 'Sum of Two Numbers',
    difficulty: 'Easy',
    tags: ['math', 'basics'],
    statement: 'Read two space-separated integers A and B from standard input and print their sum.',
    sampleInput: '3 5',
    sampleOutput: '8',
    testCases: [
      { input: '3 5', output: '8' },
      { input: '10 -2', output: '8' },
      { input: '0 0', output: '0' },
      { input: '100 200', output: '300' }
    ]
  },
  {
    id: 'reverse-string',
    title: 'Reverse a String',
    difficulty: 'Easy',
    tags: ['strings'],
    statement: 'Read a single line of text and print it reversed.',
    sampleInput: 'hello',
    sampleOutput: 'olleh',
    testCases: [
      { input: 'hello', output: 'olleh' },
      { input: 'racecar', output: 'racecar' },
      { input: 'OpenAI', output: 'IAnepO' },
      { input: 'a', output: 'a' }
    ]
  },
  {
    id: 'palindrome-check',
    title: 'Check Palindrome',
    difficulty: 'Easy',
    tags: ['strings'],
    statement: 'Read a single word and print "YES" if it is a palindrome, otherwise print "NO".',
    sampleInput: 'madam',
    sampleOutput: 'YES',
    testCases: [
      { input: 'madam', output: 'YES' },
      { input: 'hello', output: 'NO' },
      { input: 'level', output: 'YES' },
      { input: 'world', output: 'NO' }
    ]
  },
  {
    id: 'factorial',
    title: 'Factorial of a Number',
    difficulty: 'Easy',
    tags: ['math', 'recursion'],
    statement: 'Read an integer N and print N! (the factorial of N).',
    sampleInput: '5',
    sampleOutput: '120',
    testCases: [
      { input: '5', output: '120' },
      { input: '0', output: '1' },
      { input: '1', output: '1' },
      { input: '7', output: '5040' }
    ]
  },
  {
    id: 'fibonacci-nth',
    title: 'Nth Fibonacci Number',
    difficulty: 'Medium',
    tags: ['math', 'dp'],
    statement: 'Read an integer N and print the Nth Fibonacci number, where Fibonacci(0) = 0 and Fibonacci(1) = 1.',
    sampleInput: '6',
    sampleOutput: '8',
    testCases: [
      { input: '6', output: '8' },
      { input: '0', output: '0' },
      { input: '1', output: '1' },
      { input: '10', output: '55' }
    ]
  },
  {
    id: 'max-in-array',
    title: 'Find the Maximum in an Array',
    difficulty: 'Easy',
    tags: ['arrays'],
    statement: 'Read an integer N, then N space-separated integers on the next line. Print the maximum value.',
    sampleInput: '5\n3 9 1 7 4',
    sampleOutput: '9',
    testCases: [
      { input: '5\n3 9 1 7 4', output: '9' },
      { input: '3\n-1 -5 -2', output: '-1' },
      { input: '1\n42', output: '42' },
      { input: '4\n10 10 10 10', output: '10' }
    ]
  },
  {
    id: 'count-vowels',
    title: 'Count Vowels in a String',
    difficulty: 'Easy',
    tags: ['strings'],
    statement: 'Read a line of text and print the number of vowels (a, e, i, o, u — case-insensitive) it contains.',
    sampleInput: 'Hello World',
    sampleOutput: '3',
    testCases: [
      { input: 'Hello World', output: '3' },
      { input: 'xyz', output: '0' },
      { input: 'AEIOUaeiou', output: '10' },
      { input: 'Programming', output: '3' }
    ]
  },
  {
    id: 'fizzbuzz',
    title: 'FizzBuzz',
    difficulty: 'Easy',
    tags: ['loops', 'basics'],
    statement: 'Read an integer N. For each integer i from 1 to N, print "Fizz" if i is divisible by 3, "Buzz" if divisible by 5, "FizzBuzz" if divisible by both, otherwise print i. Print one value per line.',
    sampleInput: '5',
    sampleOutput: '1\n2\nFizz\n4\nBuzz',
    testCases: [
      { input: '5', output: '1\n2\nFizz\n4\nBuzz' },
      { input: '3', output: '1\n2\nFizz' },
      { input: '15', output: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz' }
    ]
  },
  {
    id: 'prime-check',
    title: 'Check Prime Number',
    difficulty: 'Medium',
    tags: ['math'],
    statement: 'Read an integer N and print "YES" if it is a prime number, otherwise print "NO".',
    sampleInput: '7',
    sampleOutput: 'YES',
    testCases: [
      { input: '7', output: 'YES' },
      { input: '10', output: 'NO' },
      { input: '2', output: 'YES' },
      { input: '1', output: 'NO' }
    ]
  },
  {
    id: 'sort-array',
    title: 'Sort an Array (Ascending)',
    difficulty: 'Easy',
    tags: ['arrays', 'sorting'],
    statement: 'Read an integer N, then N space-separated integers. Print them sorted in ascending order, space-separated.',
    sampleInput: '4\n9 3 7 1',
    sampleOutput: '1 3 7 9',
    testCases: [
      { input: '4\n9 3 7 1', output: '1 3 7 9' },
      { input: '3\n-1 5 0', output: '-1 0 5' },
      { input: '1\n8', output: '8' },
      { input: '5\n5 4 3 2 1', output: '1 2 3 4 5' }
    ]
  },
  {
    id: 'anagram-check',
    title: 'Check Anagram',
    difficulty: 'Medium',
    tags: ['strings'],
    statement: 'Read two words on two separate lines. Print "YES" if they are anagrams of each other, otherwise print "NO".',
    sampleInput: 'listen\nsilent',
    sampleOutput: 'YES',
    testCases: [
      { input: 'listen\nsilent', output: 'YES' },
      { input: 'hello\nworld', output: 'NO' },
      { input: 'triangle\nintegral', output: 'YES' },
      { input: 'abc\nabd', output: 'NO' }
    ]
  },
  {
    id: 'armstrong-number',
    title: 'Armstrong Number Check',
    difficulty: 'Medium',
    tags: ['math'],
    statement: 'Read an integer N and print "YES" if it is an Armstrong number (sum of its own digits each raised to the power of the number of digits equals the number itself), otherwise print "NO".',
    sampleInput: '153',
    sampleOutput: 'YES',
    testCases: [
      { input: '153', output: 'YES' },
      { input: '123', output: 'NO' },
      { input: '9474', output: 'YES' },
      { input: '10', output: 'NO' }
    ]
  }
];

export const getQuestionBankEntry = (id) => CODING_QUESTION_BANK.find((q) => q.id === id);
