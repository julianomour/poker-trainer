export type SessionId = string;

export interface TrainingSession {
  id: SessionId;
  createdAt: Date;
  handsPlayed: number;
}

export function createSession(id: SessionId, handsPlayed: number): TrainingSession {
  return {
    id,
    createdAt: new Date(),
    handsPlayed,
  };
}
