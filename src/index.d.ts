export interface RumConfig {
  collectorUrl: string;
  service?: string;
  env?: string;
}

export interface RumHandle {
  dispose(): void;
}

export declare function initRum(config: RumConfig): RumHandle;
