import { StoreDef } from 'lib/stores/store';
import { pathOf } from 'lib/utils/files/paths';
import { objectGuard } from 'lib/utils/typeGuard';

export type ContractInfo = {
  hostname: string;
  filepath: string;
  type: string;
  description: string;
  data: unknown;
  tries: number;
};

export type ContractReport = {
  contracts: Record<string, ContractInfo>;
};

const contractReportGuard = objectGuard<ContractReport>({
  contracts: Object,
});

export const CONTRACT_REPORT_STORE: StoreDef<ContractReport> = {
  location: pathOf('report/contract.report.json'),
  loadGuard: contractReportGuard,
};
