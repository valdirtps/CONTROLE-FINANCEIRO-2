import { 
  collection, 
  addDoc, 
  getDoc, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { 
  Administrador, 
  Devedor, 
  Conta, 
  TipoLancamento, 
  Lancamento, 
  Parcela,
  SituacaoParcela
} from '@/types/finance';
import { addMonths, format } from 'date-fns';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const FirestoreService = {
  // Admin
  getAdmin: async () => {
    try {
      const d = await getDoc(doc(db, 'settings', 'admin'));
      return d.exists() ? (d.data() as Administrador) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'settings/admin');
      return null;
    }
  },
  setAdmin: async (admin: Administrador) => {
    try {
      await setDoc(doc(db, 'settings', 'admin'), admin);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/admin');
    }
  },

  // Debtors
  getDevedores: (callback: (data: Devedor[]) => void) => {
    const path = 'debtors';
    return onSnapshot(collection(db, path), (s) => {
      callback(s.docs.map(d => ({ id: d.id, ...d.data() } as Devedor)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },
  addDebtor: async (data: Omit<Devedor, 'id'>) => {
    const path = 'debtors';
    try {
      await addDoc(collection(db, path), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },
  updateDebtor: async (id: string, data: Partial<Devedor>) => {
    const path = `debtors/${id}`;
    try {
      await updateDoc(doc(db, 'debtors', id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },
  deleteDebtor: async (id: string) => {
    const path = `debtors/${id}`;
    try {
      await deleteDoc(doc(db, 'debtors', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Accounts
  getContas: (callback: (data: Conta[]) => void) => {
    const path = 'accounts';
    return onSnapshot(collection(db, path), (s) => {
      callback(s.docs.map(d => ({ id: d.id, ...d.data() } as Conta)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },
  addAccount: async (data: Omit<Conta, 'id'>) => {
    const path = 'accounts';
    try {
      await addDoc(collection(db, path), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },
  updateAccount: async (id: string, data: Partial<Conta>) => {
    const path = `accounts/${id}`;
    try {
      await updateDoc(doc(db, 'accounts', id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },
  deleteAccount: async (id: string) => {
    const path = `accounts/${id}`;
    try {
      await deleteDoc(doc(db, 'accounts', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Types
  getTipos: (callback: (data: TipoLancamento[]) => void) => {
    const path = 'launchTypes';
    return onSnapshot(collection(db, path), (s) => {
      callback(s.docs.map(d => ({ id: d.id, ...d.data() } as TipoLancamento)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },
  addType: async (data: Omit<TipoLancamento, 'id'>) => {
    const path = 'launchTypes';
    try {
      await addDoc(collection(db, path), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },
  updateType: async (id: string, data: Partial<TipoLancamento>) => {
    const path = `launchTypes/${id}`;
    try {
      await updateDoc(doc(db, 'launchTypes', id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },
  deleteType: async (id: string) => {
    const path = `launchTypes/${id}`;
    try {
      await deleteDoc(doc(db, 'launchTypes', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Transactions & Installments
  getLancamentos: (callback: (data: Lancamento[]) => void) => {
    const path = 'transactions';
    return onSnapshot(collection(db, path), (s) => {
      callback(s.docs.map(d => ({ id: d.id, ...d.data() } as Lancamento)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },
  getParcelas: (callback: (data: Parcela[]) => void) => {
    const path = 'parcelas';
    return onSnapshot(collection(db, path), (s) => {
      callback(s.docs.map(d => ({ id: d.id, ...d.data() } as Parcela)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  addLancamento: async (lancamento: Omit<Lancamento, 'id'>, firstVencimento: string) => {
    const pathL = 'transactions';
    const pathP = 'parcelas';
    try {
      const lRef = await addDoc(collection(db, pathL), lancamento);
      const id = lRef.id;

      const tipoDoc = await getDoc(doc(db, 'launchTypes', lancamento.tipoLancamentoId));
      const tipoData = tipoDoc.data() as TipoLancamento;
      const normalize = (str: string) => str.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
      const tipoNomeNormalized = tipoData?.nome ? normalize(tipoData.nome) : '';
      
      const isReposicao = tipoNomeNormalized.includes('REPOSICAO') || tipoNomeNormalized.includes('REPOSICOES');
      const isEmprestimo = tipoNomeNormalized.includes('EMPRESTIMO') || tipoNomeNormalized.includes('EMPRESTIMOS');

      const valorParcelaTotal = lancamento.valorTotal / lancamento.numParcelas;
      
      let valorAdmin: number;
      let valorDevedor: number;

      if (isReposicao) {
        // Reposição: Debit for Admin (valor total) and Credit for Devedor (negative valor total)
        valorAdmin = valorParcelaTotal;
        valorDevedor = -valorParcelaTotal;
      } else if (isEmprestimo) {
        // Empréstimo: Devedor owes the full installment amount
        valorAdmin = 0;
        valorDevedor = valorParcelaTotal;
      } else if (lancamento.dividirConta && lancamento.devedorId) {
        if (lancamento.valorDebitoDevedor && lancamento.valorDebitoDevedor > 0) {
          valorDevedor = lancamento.valorDebitoDevedor / lancamento.numParcelas;
          valorAdmin = (lancamento.valorTotal - lancamento.valorDebitoDevedor) / lancamento.numParcelas;
        } else {
          valorDevedor = valorParcelaTotal / 2;
          valorAdmin = valorParcelaTotal / 2;
        }
      } else {
        valorAdmin = valorParcelaTotal;
        valorDevedor = 0;
      }

      for (let i = 0; i < lancamento.numParcelas; i++) {
        const vencimento = addMonths(new Date(firstVencimento + 'T12:00:00'), i);
        await addDoc(collection(db, pathP), {
          lancamentoId: id,
          numeroParcela: i + 1,
          totalParcelas: lancamento.numParcelas,
          valorAdministrador: valorAdmin,
          valorDevedor: valorDevedor,
          dataVencimento: format(vencimento, 'yyyy-MM-dd'),
          situacao: 'Pendente'
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${pathL}/${pathP}`);
    }
  },

  updateParcelaSituacao: async (parcelaId: string, situacao: SituacaoParcela) => {
    const path = `parcelas/${parcelaId}`;
    try {
      await updateDoc(doc(db, 'parcelas', parcelaId), { situacao });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  updateLancamento: async (id: string, lancamento: Omit<Lancamento, 'id'>, firstVencimento: string) => {
    const pathL = `transactions/${id}`;
    const pathP = 'parcelas';
    try {
      // 1. Update the main transaction
      await updateDoc(doc(db, 'transactions', id), lancamento);

      // 2. Delete existing installments
      const q = query(collection(db, pathP), where('lancamentoId', '==', id));
      const s = await getDocs(q);
      const deleteBatch = s.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deleteBatch);

      // 3. Create new installments (same logic as addLancamento)
      const tipoDoc = await getDoc(doc(db, 'launchTypes', lancamento.tipoLancamentoId));
      const tipoData = tipoDoc.data() as TipoLancamento;
      const normalize = (str: string) => str.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
      const tipoNomeNormalized = tipoData?.nome ? normalize(tipoData.nome) : '';
      
      const isReposicao = tipoNomeNormalized.includes('REPOSICAO') || tipoNomeNormalized.includes('REPOSICOES');
      const isEmprestimo = tipoNomeNormalized.includes('EMPRESTIMO') || tipoNomeNormalized.includes('EMPRESTIMOS');

      const valorParcelaTotal = lancamento.valorTotal / lancamento.numParcelas;
      
      let valorAdmin: number;
      let valorDevedor: number;

      if (isReposicao) {
        valorAdmin = valorParcelaTotal;
        valorDevedor = -valorParcelaTotal;
      } else if (isEmprestimo) {
        valorAdmin = 0;
        valorDevedor = valorParcelaTotal;
      } else if (lancamento.dividirConta && lancamento.devedorId) {
        if (lancamento.valorDebitoDevedor && lancamento.valorDebitoDevedor > 0) {
          valorDevedor = lancamento.valorDebitoDevedor / lancamento.numParcelas;
          valorAdmin = (lancamento.valorTotal - lancamento.valorDebitoDevedor) / lancamento.numParcelas;
        } else {
          valorDevedor = valorParcelaTotal / 2;
          valorAdmin = valorParcelaTotal / 2;
        }
      } else {
        valorAdmin = valorParcelaTotal;
        valorDevedor = 0;
      }

      for (let i = 0; i < lancamento.numParcelas; i++) {
        const vencimento = addMonths(new Date(firstVencimento + 'T12:00:00'), i);
        await addDoc(collection(db, pathP), {
          lancamentoId: id,
          numeroParcela: i + 1,
          totalParcelas: lancamento.numParcelas,
          valorAdministrador: valorAdmin,
          valorDevedor: valorDevedor,
          dataVencimento: format(vencimento, 'yyyy-MM-dd'),
          situacao: 'Pendente'
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${pathL}/${pathP}`);
    }
  },

  deleteLancamento: async (id: string) => {
    const pathL = `transactions/${id}`;
    const pathP = 'parcelas';
    try {
      // Delete all parcelas first
      const q = query(collection(db, pathP), where('lancamentoId', '==', id));
      const s = await getDocs(q);
      const batch = s.docs.map(d => deleteDoc(d.ref));
      await Promise.all(batch);
      await deleteDoc(doc(db, 'transactions', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${pathL}/${pathP}`);
    }
  }
};
