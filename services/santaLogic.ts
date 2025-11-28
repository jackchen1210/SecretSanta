import { Participant } from '../types';

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

export const createPairings = (names: string[]): Participant[] => {
  if (names.length < 3) {
    throw new Error("Need at least 3 participants for a valid Secret Santa exchange.");
  }

  // Create initial participant objects
  let participants: Participant[] = names.map(name => ({
    id: generateId(),
    name: name.trim(),
    assigneeId: null,
    wishlist: [],
    viewed: false,
    secretToken: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2),
    isClaimed: false
  }));

  // Fisher-Yates shuffle
  const shuffled = [...participants];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Create a circular assignment to guarantee no self-assignment and one single loop
  // P[0] -> P[1], P[1] -> P[2], ... P[last] -> P[0]
  for (let i = 0; i < shuffled.length; i++) {
    const giver = shuffled[i];
    const receiver = shuffled[(i + 1) % shuffled.length];
    
    // Update the original array object
    const originalGiverIndex = participants.findIndex(p => p.id === giver.id);
    participants[originalGiverIndex].assigneeId = receiver.id;
  }

  return participants;
};