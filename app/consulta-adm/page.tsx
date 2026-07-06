'use client';

import React, { useState, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { AppLayout } from '@/components/AppLayout';
import { 
  Calendar as CalendarIcon,
  Wallet,
  ClipboardList
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ConsultaADMPage() {
  const { allLancamentosCompletos, contas, admin, loading } = useFinance();
  const [selectedVencimento, setSelectedVencimento] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [selectedConta, setSelectedConta] = useState<string>('todos');

  // Extract all unique months from all lancamentos
  const availableVencimentos = useMemo(() => {
    const months = new Set<string>();
    // Always include current month
    months.add(format(new Date(), 'yyyy-MM'));
    
    allLancamentosCompletos.forEach(p => {
      const date = parseISO(p.dataVencimento);
      months.add(format(date, 'yyyy-MM'));
    });
    return Array.from(months).sort().reverse();
  }, [allLancamentosCompletos]);

  const filteredData = useMemo(() => {
    if (!selectedVencimento) return [];
    
    const [year, month] = selectedVencimento.split('-').map(Number);
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));

    return allLancamentosCompletos.filter(p => {
      const date = parseISO(p.dataVencimento);
      const matchesVencimento = isWithinInterval(date, { start, end });
      const matchesConta = selectedConta === 'todos' || p.contaId === selectedConta;
      const isDebito = p.flagMatematica === '-';
      const hasValue = p.valorTotal !== 0;
      
      return matchesVencimento && matchesConta && isDebito && hasValue;
    }).sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));
  }, [allLancamentosCompletos, selectedVencimento, selectedConta]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">
              Débitos ({admin?.nome || 'ADMIN'})
            </h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">
              Controle de Débitos por Vencimento e Conta
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <CalendarIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={selectedVencimento}
                onChange={(e) => setSelectedVencimento(e.target.value)}
                className="pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-widest outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-emerald-500/20"
              >
                {availableVencimentos.map(v => {
                  const [y, m] = v.split('-');
                  const date = new Date(Number(y), Number(m) - 1);
                  return (
                    <option key={v} value={v}>
                      {format(date, 'MMMM yyyy', { locale: ptBR }).toUpperCase()}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="relative">
              <Wallet size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={selectedConta}
                onChange={(e) => setSelectedConta(e.target.value)}
                className="pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-widest outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="todos">TODAS AS CONTAS</option>
                {contas.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-4 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">Vcto</th>
                  <th className="px-4 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">Conta</th>
                  <th className="px-4 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">Parcela</th>
                  <th className="px-4 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Valor Parcela</th>
                  <th className="px-4 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">Referente</th>
                  <th className="px-4 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">Devedor</th>
                  <th className="w-24 px-4 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Valor Dev</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <ClipboardList size={32} className="opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Nenhum débito encontrado</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-4 py-0.5 whitespace-nowrap">
                        <span className="text-xs font-black text-slate-700">
                          {format(parseISO(item.dataVencimento), 'dd/MM/yyyy')}
                        </span>
                      </td>
                      <td className="px-4 py-0.5">
                        <span className="text-xs font-bold text-slate-900">{item.contaNome}</span>
                      </td>
                      <td className="px-4 py-0.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black tracking-widest">
                          {item.numeroParcela}/{item.totalParcelas}
                        </span>
                      </td>
                      <td className="px-4 py-0.5 text-right">
                        <span className="text-xs font-black text-slate-900">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valorTotal)}
                        </span>
                      </td>
                      <td className="px-4 py-0.5">
                        <span className="text-xs font-medium text-slate-600 line-clamp-1">{item.referente}</span>
                      </td>
                      <td className="px-4 py-0.5">
                        {item.devedorNome ? (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-rose-50 text-rose-600 rounded-md flex items-center justify-center font-black text-[9px]">
                              {item.devedorNome.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-[11px] font-medium text-slate-600">{item.devedorNome}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Nenhum</span>
                        )}
                      </td>
                      <td className="px-4 py-0.5 text-right">
                        <span className="text-xs font-black text-rose-500">
                          {item.valorDevedor > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valorDevedor) : '-'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredData.length > 0 && (
                <tfoot className="bg-slate-50/50">
                  <tr>
                    <td colSpan={3} className="px-4 py-1 text-[10px] font-black text-slate-900 uppercase tracking-widest text-right">
                      Total no Período:
                    </td>
                    <td className="px-4 py-1 text-right">
                      <span className="text-sm font-black text-slate-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                          filteredData.reduce((acc, curr) => acc + curr.valorTotal, 0)
                        )}
                      </span>
                    </td>
                    <td colSpan={2}></td>
                    <td className="px-4 py-1 text-right">
                      <span className="text-sm font-black text-rose-500">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                          filteredData.reduce((acc, curr) => acc + curr.valorDevedor, 0)
                        )}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
