export type FindingSeverity = "needs-attention" | "review";

export type FindingExample = {
  before: string;
  after: string;
  note: string;
};

export type ScanFinding = {
  id: string;
  severity: FindingSeverity;
  title: string;
  whyItMatters: string;
  fix: string;
  wcag: string;
  count: number;
  example: FindingExample;
};

export type ScanResult = {
  url: string;
  host: string;
  pageTitle: string | null;
  scannedAt: string;
  findings: ScanFinding[];
  checksRun?: number;
  manualChecks: string[];
};
