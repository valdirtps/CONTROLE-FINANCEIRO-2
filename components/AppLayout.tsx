'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ListFilter,
  Wallet, 
  Users, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Menu, 
  X, 
  Calendar,
  LogOut,
  LogIn,
  Lock,
  Sliders,
  ClipboardList
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/components/FirebaseProvider';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { format, parseISO, startOfMonth } from 'date-fns';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const { currentMonth, setCurrentMonth, allLancamentosCompletos } = useFinance();
  const { user, loading: authLoading, login } = useAuth();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const monthlySummaries = React.useMemo(() => {
    const monthsMap = new Map<string, {
      vencimento: string;
      receita: number;
      despesa: number;
      credito: number;
      saldo: number;
      dateObj: Date;
    }>();

    const today = startOfMonth(new Date());
    const baselineDate = new Date();
    baselineDate.setMonth(baselineDate.getMonth() - 3);
    let minDate = startOfMonth(baselineDate);
    
    allLancamentosCompletos.forEach(l => {
      const date = parseISO(l.dataVencimento);
      const start = startOfMonth(date);
      if (start < minDate) minDate = start;
    });

    let currentIter = new Date(minDate);
    while (currentIter <= today) {
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
      const date = parseISO(l.dataVencimento);
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

      if (l.flagMatematica === '+') {
        current.receita += l.valorAdministrador;
      } else {
        current.despesa += l.valorAdministrador;
      }
      current.credito += l.valorDevedor;
      current.saldo = current.receita - current.despesa;
    });

    return Array.from(monthsMap.values()).sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  }, [allLancamentosCompletos]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { name: 'Lançamentos', icon: ListFilter, href: '/lancamentos' },
    { name: 'Créditos', icon: ListFilter, href: '/consulta-devedores' },
    { name: 'Débitos', icon: ClipboardList, href: '/consulta-adm' },
    { name: 'Contas', icon: Wallet, href: '/contas' },
    { name: 'Devedores', icon: Users, href: '/devedores' },
    { name: 'Categorias', icon: Settings, href: '/tipos' },
    { name: 'Relatórios', icon: Calendar, href: '/relatorios' },
    { name: 'Configurações', icon: Sliders, href: '/admin' },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Carregando FinancePro...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl shadow-slate-200 p-8 md:p-12 text-center border border-slate-100">
          <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <Lock className="text-emerald-500" size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">
            FINANCE<span className="text-emerald-500">PRO</span>
          </h1>
          <p className="text-slate-600 mb-10 font-medium">
            Bem-vindo! Por favor, faça login com sua conta Google para acessar o sistema.
          </p>
          <button 
            onClick={login}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <LogIn size={20} />
            Entrar com Google
          </button>
          <p className="mt-8 text-xs text-slate-400 font-medium">
            Sistema Seguro & Criptografado
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        bg-slate-900 text-white
        transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'w-64' : 'w-20'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        {/* Sidebar Header */}
        <div className="h-20 flex items-center px-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
              <Wallet size={18} className="text-white" />
            </div>
            {isSidebarOpen && (
              <span className="font-black tracking-tighter text-lg">FINANCEPRO</span>
            )}
          </div>
        </div>

        {/* Sidebar Content */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <item.icon size={20} className="shrink-0" />
                {isSidebarOpen && <span className="text-sm font-semibold tracking-tight">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 shrink-0">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3.5 px-3.5 py-3 w-full hover:bg-rose-500/10 hover:text-rose-400 rounded-xl text-slate-400 transition-colors text-sm font-semibold"
          >
            <LogOut size={19} className="shrink-0" />
            <span className={`${!isSidebarOpen && 'hidden'}`}>Encerrar Sessão</span>
          </button>
        </div>

        {/* Toggle Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-24 bg-slate-900 border border-slate-800 p-1.5 rounded-full text-slate-400 hover:text-white hidden lg:block"
        >
          {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 lg:hidden bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
          <button onClick={() => setIsMobileOpen(true)} className="p-2 text-slate-600">
            <Menu size={24} />
          </button>
          <span className="font-black tracking-tighter text-slate-900">FINANCEPRO</span>
          <div className="w-10" />
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50 relative">
          {children}
        </div>
      </main>
    </div>
  );
}
