export interface Administrador {
  id?: string;
  nome: string;
  cpf?: string;
  email: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
}

export interface Devedor {
  id: string;
  nome: string;
  cpf?: string;
  telefone: string;
  email?: string;
  observacoes?: string;
}

export interface Conta {
  id: string;
  nome: string;
  descricao: string;
}

export interface TipoLancamento {
  id: string;
  nome: string;
  flagMatematica: '+' | '-';
  dv?: boolean;
}

export type SituacaoParcela = 'Paga' | 'Pendente' | 'Atrasada';

export interface Lancamento {
  id: string;
  vencimentoInicial?: string;
  tipoLancamentoId: string;
  contaId: string;
  dividirConta: boolean;
  devedorId?: string;
  valorTotal: number;
  numParcelas: number;
  referente: string;
  dataCompra?: string;
  valorDebitoDevedor?: number;
}

export interface Parcela {
  id: string;
  lancamentoId: string;
  numeroParcela: number;
  totalParcelas: number;
  valorAdministrador: number;
  valorDevedor: number;
  dataVencimento: string;
  situacao: SituacaoParcela;
}

export interface LancamentoCompleto extends Parcela {
  referente: string;
  contaNome: string;
  contaId: string;
  tipoNome: string;
  flagMatematica: '+' | '-';
  devedorNome?: string;
  devedorId?: string;
  dataCompra?: string;
  valorTotal: number;
  valorTotalLancamento: number;
  valorDebitoDevedor?: number;
  isDV?: boolean;
}
