'use client';

import React, { useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { AppLayout } from '@/components/AppLayout';
import { 
  Plus,
  Calendar
} from 'lucide-react';
import { format, parseISO, startOfMonth } from 'date-fns';
import { NovoLancamentoModal } from '@/components/NovoLancamentoModal';

export default function Dashboard() {
  const { allLancamentosCompletos } = useFinance();
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const monthlySummaries = useMemo(() => {
    const monthsMap = new Map<string, {
      vencimento: string;
      receita: number;
      despesa: number;
      credito: number;
      saldo: number;
      dateObj: Date;
    }>();

    const today = startOfMonth(new Date());
    const futureLimit = new Date(today);
    futureLimit.setMonth(futureLimit.getMonth() + 12); 

    let minDate = new Date(today);
    allLancamentosCompletos.forEach(l => {
      const date = parseISO(l.dataVencimento);
      const start = startOfMonth(date);
      if (start < minDate) minDate = start;
    });

    let currentIter = new Date(minDate);
    while (currentIter <= futureLimit) {
      const monthKey = format(currentIter, 'yyyy-MM');
      const displayDate = new Date(currentIter);
      displayDate.setDate(5);

      monthsMap.set(monthKey, {
        vencimento: format(displayDate, 'dd/MM/yyyy'),
        receita: 0,
        despesa: 0,
        credito: 0,
        saldo: 0,
        dateObj: new Date(currentIter)
      });
      currentIter.setMonth(currentIter.getMonth() + 1);
    }

    allLancamentosCompletos.forEach(l => {
      if (!l.dataVencimento) return;
      
      const date = parseISO(l.dataVencimento);
      if (isNaN(date.getTime())) return;

      const monthKey = format(date, 'yyyy-MM');
      let current = monthsMap.get(monthKey);
      
      if (!current) {
        const displayDate = new Date(date);
        displayDate.setDate(5);
        current = {
          vencimento: format(displayDate, 'dd/MM/yyyy'),
          receita: 0,
          despesa: 0,
          credito: 0,
          saldo: 0,
          dateObj: startOfMonth(date)
        };
        monthsMap.set(monthKey, current);
      }

      const tipoNome = l.tipoNome || '';
      // Verifica se é categoria de REPOSIÇÃO (ignora no total de receita do dashboard conforme solicitado)
      const isRepos = tipoNome.trim().toUpperCase().includes('REPOS');
      const valorParaDashboard = (Number(l.valorAdministrador) || 0) + (Number(l.valorDevedor) || 0);

      if (l.flagMatematica === '+') {
        if (!isRepos) {
          current.receita += valorParaDashboard;
        }
      } else {
        current.despesa += valorParaDashboard;
      }
      current.credito += (Number(l.valorDevedor) || 0);
      
      // O saldo deve refletir a posição líquida do administrador (incluindo reposições no saldo bancário)
      const share = l.flagMatematica === '+' ? (Number(l.valorAdministrador) || 0) : -(Number(l.valorAdministrador) || 0);
      current.saldo += share;
    });

    return Array.from(monthsMap.values())
      .filter(summary => summary.dateObj >= today)
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [allLancamentosCompletos]);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
              DASH<span className="text-emerald-500">BOARD</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium">Resumo mensal consolidado</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center gap-2 text-xs"
          >
            <Plus className="w-4 h-4" />
            NOVO LANÇAMENTO
          </button>
        </div>

        {/* Main Summary Table - RESTORED AND COMPACTED */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/40 overflow-hidden">
          <div className="px-6 py-3 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Calendar className="text-emerald-500" size={18} />
              Resumo por Vencimento
            </h3>
          </div>
          
          <div className="overflow-x-auto max-h-[240px] overflow-y-auto custom-scrollbar relative bg-white">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                <tr className="bg-slate-50/80 backdrop-blur-sm">
                  <th className="px-6 py-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">Data do Vcto</th>
                  <th className="px-6 py-2 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Receita</th>
                  <th className="px-6 py-2 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Valores a Pagar</th>
                  <th className="px-6 py-2 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Valores a Receber</th>
                  <th className="px-6 py-2 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Saldo Líquido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {monthlySummaries.map((summary, index) => (
                  <tr 
                    key={index} 
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-1.5">
                      <span className="text-sm font-black text-slate-900 capitalize group-hover:text-emerald-600 transition-colors">
                        {summary.vencimento}
                      </span>
                    </td>
                    <td className="px-6 py-1.5 text-right">
                      <span className="text-sm font-bold text-emerald-600">
                        {formatCurrency(summary.receita)}
                      </span>
                    </td>
                    <td className="px-6 py-1.5 text-right">
                      <span className="text-sm font-bold text-rose-500">
                        {formatCurrency(summary.despesa)}
                      </span>
                    </td>
                    <td className="px-6 py-1.5 text-right">
                      <span className="text-sm font-bold text-amber-500">
                        {formatCurrency(summary.credito)}
                      </span>
                    </td>
                    <td className="px-6 py-1.5 text-right">
                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${
                        summary.saldo >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {formatCurrency(summary.saldo)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <NovoLancamentoModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      </div>
    </AppLayout>
  );
}
