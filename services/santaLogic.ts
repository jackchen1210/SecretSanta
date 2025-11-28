import { Participant } from '../types';

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

export const createPairings = (names: string[]): Participant[] => {
  if (names.length < 3) {
    throw new Error("Need at least 3 participants for a valid Secret Santa exchange.");
  }

  // Create initial participant objects
  const participants: Participant[] = names.map(name => ({
    id: generateId(),
    name: name.trim(),
    assigneeId: null,
    wishlist: [],
    viewed: false,
    secretToken: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2),
    isClaimed: false
  }));

  // Fisher-Yates Shuffle Helper
  const shuffle = <T>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  // Derangement Algorithm (Shuffle until valid):
  // We simply shuffle the list of participants to act as "receivers".
  // We check if any index maps to itself (giver === receiver).
  // If so, we shuffle again. This is statistically very fast for N >= 3.
  // This method allows for sub-cycles (e.g., A->B and B->A), which feels more "random" 
  // than a forced Hamiltonian cycle (A->B->C->...->A).

  let isValid = false;
  let attempts = 0;
  let receivers: Participant[] = [];

  while (!isValid && attempts < 1000) {
    attempts++;
    receivers = shuffle(participants);
    
    // Check conditions:
    // 1. No one assigned to themselves
    isValid = participants.every((giver, index) => giver.id !== receivers[index].id);
  }

  // Fallback: If probabilistic shuffle fails (extremely unlikely), use a simple offset
  // This guarantees validity but is deterministic based on the current list order
  if (!isValid) {
     const pool = [...participants];
     // Shift everyone by 1
     const first = pool.shift();
     if (first) pool.push(first);
     receivers = pool;
  }

  // Map the results back to the objects
  return participants.map((giver, index) => ({
    ...giver,
    assigneeId: receivers[index].id
  }));
};