import { supabase } from './supabase';
import { addMonths, format } from 'date-fns';

export interface Devedor {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  dataCadastro?: string;
}

export interface Conta {
  id: string;
  nome: string;
  banco: string;
  tipo: string;
  saldoInicial: number;
  saldoAtual: number;
  cor: string;
}

export interface TipoLancamento {
  id: string;
  nome: string;
  cor: string;
  icone: string;
  tipo: 'receita' | 'despesa';
}

export interface Lancamento {
  id: string;
  descricao: string;
  valorTotal: number;
  valorAdministrador: number;
  valorDevedor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: 'pendente' | 'pago';
  idDevedor?: string;
  idConta?: string;
  idTipo?: string;
  parcelado: boolean;
  numParcelas: number;
  recorrente: boolean;
}

export interface Parcela {
  id: string;
  idLancamento: string;
  numero: number;
  valorTotal: number;
  valorAdministrador: number;
  valorDevedor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: 'pendente' | 'pago';
}

export interface AdminConfig {
  saldoInicial: number;
  metaMensal: number;
  avisoVencimento: number;
}

// Nota: O userId agora viria da sessão do Supabase ou de algum provedor de auth
// Como estamos em transição, vamos manter uma lógica flexível
const getUserId = () => "default_user"; // Placeholder até configurar auth do Supabase

export const SupabaseService = {
  // Devedores
  getDevedores: async (callback: (data: Devedor[]) => void) => {
    if (!supabase) return () => {};
    const { data, error } = await supabase.from('debtors').select('*');
    if (error) console.error('Erro Supabase Debtors:', error);
    callback(data?.map((d: any) => ({
      id: d.id,
      nome: d.nome,
      email: d.email,
      telefone: d.telefone,
      dataCadastro: d.data_cadastro
    })) || []);
    return () => {};
  },

  // Contas
  getContas: async (callback: (data: Conta[]) => void) => {
    if (!supabase) return () => {};
    const { data, error } = await supabase.from('accounts').select('*');
    if (error) console.error('Erro Supabase Accounts:', error);
    callback(data?.map((d: any) => ({
      id: d.id,
      nome: d.nome,
      banco: d.banco,
      tipo: d.tipo,
      saldoInicial: Number(d.saldo_inicial),
      saldoAtual: Number(d.saldo_atual),
      cor: d.cor
    })) || []);
    return () => {};
  },

  // Tipos
  getTipos: async (callback: (data: TipoLancamento[]) => void) => {
    if (!supabase) return () => {};
    const { data, error } = await supabase.from('transaction_types').select('*');
    if (error) console.error('Erro Supabase Types:', error);
    callback(data?.map((d: any) => ({
      id: d.id,
      nome: d.nome,
      cor: d.cor,
      icone: d.icone,
      tipo: d.tipo as 'receita' | 'despesa'
    })) || []);
    return () => {};
  },

  // Lancamentos
  getLancamentos: async (callback: (data: Lancamento[]) => void) => {
    if (!supabase) return () => {};
    const { data, error } = await supabase.from('transactions').select('*');
    if (error) console.error('Erro Supabase Transactions:', error);
    callback(data?.map((d: any) => ({
      id: d.id,
      descricao: d.descricao,
      valorTotal: Number(d.valor_total),
      valorAdministrador: Number(d.valor_administrador),
      valorDevedor: Number(d.valor_devedor),
      dataVencimento: d.data_vencimento,
      dataPagamento: d.data_pagamento,
      status: d.status,
      idDevedor: d.id_devedor,
      idConta: d.id_conta,
      idTipo: d.id_tipo,
      parcelado: d.parcelado,
      numParcelas: d.num_parcelas,
      recorrente: d.recorrente
    })) || []);
    return () => {};
  },

  // Parcelas
  getParcelas: async (callback: (data: Parcela[]) => void) => {
    if (!supabase) return () => {};
    const { data, error } = await supabase.from('installments').select('*');
    if (error) console.error('Erro Supabase Installments:', error);
    callback(data?.map((d: any) => ({
      id: d.id,
      idLancamento: d.id_lancamento,
      numero: d.numero,
      valorTotal: Number(d.valor_total),
      valorAdministrador: Number(d.valor_administrador),
      valorDevedor: Number(d.valor_devedor),
      dataVencimento: d.data_vencimento,
      dataPagamento: d.data_pagamento,
      status: d.status
    })) || []);
    return () => {};
  },

  // Admin Config
  getAdmin: async (): Promise<AdminConfig> => {
    const fallback: AdminConfig = { saldoInicial: 0, metaMensal: 0, avisoVencimento: 5 };
    if (!supabase) return fallback;
    const { data, error } = await supabase.from('admin_config').select('*').limit(1).single();
    if (error) return fallback;
    return {
      saldoInicial: Number(data.saldo_inicial),
      metaMensal: Number(data.meta_mensal),
      avisoVencimento: Number(data.aviso_vencimento)
    };
  },

  // Escrita - Devedores
  addDebtor: async (data: Omit<Devedor, 'id'>) => {
    if (!supabase) return;
    await supabase.from('debtors').insert([{
      nome: data.nome,
      email: data.email,
      telefone: data.telefone
    }]);
  },

  updateDebtor: async (id: string, data: Partial<Devedor>) => {
    if (!supabase) return;
    await supabase.from('debtors').update({
      nome: data.nome,
      email: data.email,
      telefone: data.telefone
    }).eq('id', id);
  },

  deleteDebtor: async (id: string) => {
    if (!supabase) return;
    await supabase.from('debtors').delete().eq('id', id);
  },

  // Escrita - Contas
  addAccount: async (data: Omit<Conta, 'id'>) => {
    if (!supabase) return;
    await supabase.from('accounts').insert([{
      nome: data.nome,
      banco: data.banco,
      tipo: data.tipo,
      saldo_inicial: data.saldoInicial,
      saldo_atual: data.saldoAtual,
      cor: data.cor
    }]);
  },

  updateAccount: async (id: string, data: Partial<Conta>) => {
    if (!supabase) return;
    const updateData: any = {};
    if (data.nome) updateData.nome = data.nome;
    if (data.banco) updateData.banco = data.banco;
    if (data.tipo) updateData.tipo = data.tipo;
    if (data.saldoInicial !== undefined) updateData.saldo_inicial = data.saldoInicial;
    if (data.saldoAtual !== undefined) updateData.saldo_atual = data.saldoAtual;
    if (data.cor) updateData.cor = data.cor;
    await supabase.from('accounts').update(updateData).eq('id', id);
  },

  deleteAccount: async (id: string) => {
    if (!supabase) return;
    await supabase.from('accounts').delete().eq('id', id);
  },

  // Escrita - Tipos
  addType: async (data: Omit<TipoLancamento, 'id'>) => {
    if (!supabase) return;
    await supabase.from('transaction_types').insert([{
      nome: data.nome,
      cor: data.cor,
      icone: data.icone,
      tipo: data.tipo
    }]);
  },

  updateType: async (id: string, data: Partial<TipoLancamento>) => {
    if (!supabase) return;
    const updateData: any = {};
    if (data.nome) updateData.nome = data.nome;
    if (data.cor) updateData.cor = data.cor;
    if (data.icone) updateData.icone = data.icone;
    if (data.tipo) updateData.tipo = data.tipo;
    await supabase.from('transaction_types').update(updateData).eq('id', id);
  },

  deleteType: async (id: string) => {
    if (!supabase) return;
    await supabase.from('transaction_types').delete().eq('id', id);
  },

  // Escrita - Lançamentos e Parcelas
  addLancamento: async (lancamento: any, firstVencimento: string) => {
    if (!supabase) return;
    try {
      const { data: transData, error: transError } = await supabase
        .from('transactions')
        .insert([{
          descricao: lancamento.referente,
          valor_total: lancamento.valorTotal,
          valor_administrador: 0,
          valor_devedor: 0,
          data_vencimento: firstVencimento,
          status: 'pendente',
          id_devedor: lancamento.devedorId || null,
          id_conta: lancamento.contaId || null,
          id_tipo: lancamento.tipoLancamentoId || null,
          parcelado: lancamento.numParcelas > 1,
          num_parcelas: lancamento.numParcelas,
          recorrente: false
        }])
        .select()
        .single();

      if (transError) throw transError;

      const valorParcelaTotal = lancamento.valorTotal / lancamento.numParcelas;
      const installments = [];
      for (let i = 0; i < lancamento.numParcelas; i++) {
        const vencimento = addMonths(new Date(firstVencimento + 'T12:00:00'), i);
        installments.push({
          id_lancamento: transData.id,
          numero: i + 1,
          valor_total: valorParcelaTotal,
          valor_administrador: valorParcelaTotal, // Simplificado para restauração
          valor_devedor: 0,
          data_vencimento: format(vencimento, 'yyyy-MM-dd'),
          status: 'pendente'
        });
      }
      await supabase.from('installments').insert(installments);
    } catch (err) {
      console.error('Erro ao adicionar lançamento no Supabase:', err);
    }
  },

  updateParcelaSituacao: async (id: string, situacao: string) => {
    if (!supabase) return;
    await supabase.from('installments').update({ status: situacao }).eq('id', id);
  },

  deleteLancamento: async (id: string) => {
    if (!supabase) return;
    await supabase.from('transactions').delete().eq('id', id);
  },

  // Admin
  setAdmin: async (data: AdminConfig) => {
    if (!supabase) return;
    await supabase.from('admin_config').upsert({
      id: 1, // Fixando um id para teste de config global
      saldo_inicial: data.saldoInicial,
      meta_mensal: data.metaMensal,
      aviso_vencimento: data.avisoVencimento
    });
  }
};
