export interface RafHandle {
  id: number;
}

export type AnimationLoop = (timestamp: number) => void;

export interface RecordingStateBase {
  isRecording: boolean;
  startTime: number | null;
  stopTime: number | null;
}
