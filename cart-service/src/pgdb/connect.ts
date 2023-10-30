interface ExecCommandRes {
  rows: unknown[];
}

abstract class Connect {
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;

  abstract exec(script: string, values?: unknown[]): Promise<ExecCommandRes>
  abstract transaction(callback: () => Promise<unknown>): Promise<void>
}

export default Connect;
