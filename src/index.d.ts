export interface RumConfig {
  collectorUrl: string;
}

export interface RumHandle {
  dispose(): void;
}

export declare function initRum(config: RumConfig): RumHandle;
