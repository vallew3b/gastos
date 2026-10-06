// ==========================================================================
// SUPABASE CONFIGURATION
// ==========================================================================
const SUPABASE_URL = 'https://ithlbiqwihgbpwcixvsi.supabase.co';
// ⚠️ REEMPLAZA ESTA CADENA CON TU "anon public key" DE SUPABASE:
// La encuentras en tu Dashboard de Supabase -> Project Settings -> API -> Project API keys (anon public)
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0aGxiaXF3aWhnYnB3Y2l4dnNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMzE1MDksImV4cCI6MjEwNjgwNzUwOX0.slnluo03iFG266v7Y-BqbQc9aetFJUl0J4IuOTZC63s';

let supabaseClient = null;
if (window.supabase && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'COLOCA_AQUI_TU_SUPABASE_ANON_KEY') {
  try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('⚡ Conectado exitosamente a Supabase DB');
  } catch (err) {
    console.warn('⚠️ No se pudo inicializar Supabase Client, usando almacenamiento LocalStorage.', err);
  }
}

const STORAGE_KEYS = {
  EXPENSES: 'monse_cuentas_expenses',
  PAYMENTS: 'monse_cuentas_payment_history',
  PEOPLE: 'monse_cuentas_people'
};

function initializeDemoData() {
  const existing = localStorage.getItem(STORAGE_KEYS.EXPENSES);
  if (!existing || existing === '[]') {
    const today = new Date();
    
    const getOffsetDateStr = (daysOffset) => {
      const d = new Date(today);
      d.setDate(d.getDate() + daysOffset);
      return d.toISOString().split('T')[0];
    };

    const initialExpenses = [
      {
        id: 'exp-1',
        monto: 850.50,
        montoPagado: 0,
        concepto: 'Supermercado y despensa semanal',
        quienDebe: 'Carlos',
        fecha: getOffsetDateStr(-1),
        estado: 'pendiente',
        categoria: 'Alimentación',
        createdAt: new Date().toISOString()
      },
      {
        id: 'exp-2',
        monto: 320.00,
        montoPagado: 0,
        concepto: 'Pago de Internet y servicios',
        quienDebe: 'Monse',
        fecha: getOffsetDateStr(-3),
        estado: 'pendiente',
        categoria: 'Servicios',
        createdAt: new Date().toISOString()
      },
      {
        id: 'exp-3',
        monto: 1200.00,
        montoPagado: 0,
        concepto: 'Mantenimiento del departamento',
        quienDebe: 'Carlos',
        fecha: getOffsetDateStr(-4),
        estado: 'pendiente',
        categoria: 'Hogar',
        createdAt: new Date().toISOString()
      },
      {
        id: 'exp-4',
        monto: 450.00,
        montoPagado: 450.00,
        concepto: 'Cena de fin de semana',
        quienDebe: 'Ana',
        fecha: getOffsetDateStr(-8),
        estado: 'pagado',
        categoria: 'Salidas',
        createdAt: new Date().toISOString()
      }
    ];

    const initialPeople = ['Monse', 'Carlos', 'Ana', 'Kenia'];

    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(initialExpenses));
    localStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(initialPeople));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify([]));
  }
}

const dbService = {
  async init() {
    if (!supabaseClient) {
      initializeDemoData();
    } else {
      // Limpiar datos demo locales antiguos para no mostrar nombres de prueba
      try {
        localStorage.removeItem(STORAGE_KEYS.EXPENSES);
        localStorage.removeItem(STORAGE_KEYS.PEOPLE);
        localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
      } catch (e) {}
    }
  },

  async getExpenses() {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('expenses')
          .select('*')
          .order('fecha', { ascending: false });

        if (error) throw error;
        
        return (data || []).map(row => ({
          id: row.id,
          splitGroupId: row.split_group_id,
          monto: parseFloat(row.monto),
          montoPagado: parseFloat(row.monto_pagado || 0),
          concepto: row.concepto,
          conceptoBase: row.concepto_base,
          quienDebe: row.quien_debe,
          fecha: row.fecha,
          categoria: row.categoria,
          estado: row.estado,
          createdAt: row.created_at
        }));
      } catch (e) {
        console.error('Error leyendo gastos en Supabase:', e);
      }
    }

    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error al leer gastos local', e);
      return [];
    }
  },

  async getExpensesLocal() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  async addExpense(expenseData) {
    const newExpense = {
      id: 'exp-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      monto: parseFloat(expenseData.monto),
      montoPagado: 0,
      concepto: expenseData.concepto.trim(),
      quienDebe: expenseData.quienDebe.trim(),
      fecha: expenseData.fecha,
      categoria: expenseData.categoria || 'Otros',
      estado: 'pendiente',
      createdAt: new Date().toISOString()
    };

    if (supabaseClient) {
      try {
        await supabaseClient.from('expenses').insert([{
          id: newExpense.id,
          monto: newExpense.monto,
          monto_pagado: 0,
          concepto: newExpense.concepto,
          quien_debe: newExpense.quienDebe,
          fecha: newExpense.fecha,
          categoria: newExpense.categoria,
          estado: 'pendiente'
        }]);
      } catch (err) {
        console.error('Error Supabase insert:', err);
      }
    }

    const expenses = await this.getExpensesLocal();
    expenses.unshift(newExpense);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    await this.addPerson(newExpense.quienDebe);
    return newExpense;
  },

  async addSplitExpenses(splitData) {
    const expenses = await this.getExpensesLocal();
    const splitGroupId = 'grp-' + Date.now();
    const createdExpenses = [];

    for (const participant of splitData.participants) {
      const newExpense = {
        id: 'exp-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        splitGroupId,
        monto: parseFloat(participant.monto),
        montoPagado: 0,
        concepto: `${splitData.concepto.trim()} (${participant.quienDebe})`,
        conceptoBase: splitData.concepto.trim(),
        quienDebe: participant.quienDebe.trim(),
        fecha: splitData.fecha,
        categoria: splitData.categoria || 'Otros',
        estado: 'pendiente',
        createdAt: new Date().toISOString()
      };

      if (supabaseClient) {
        try {
          await supabaseClient.from('expenses').insert([{
            id: newExpense.id,
            split_group_id: splitGroupId,
            monto: newExpense.monto,
            monto_pagado: 0,
            concepto: newExpense.concepto,
            concepto_base: newExpense.conceptoBase,
            quien_debe: newExpense.quienDebe,
            fecha: newExpense.fecha,
            categoria: newExpense.categoria,
            estado: 'pendiente'
          }]);
        } catch (err) {
          console.error('Error Supabase insert split:', err);
        }
      }
      
      expenses.unshift(newExpense);
      createdExpenses.push(newExpense);
      await this.addPerson(participant.quienDebe);
    }

    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    return createdExpenses;
  },

  async addAbono(expenseId, abonoMonto) {
    const expenses = await this.getExpenses();
    const item = expenses.find(e => e.id === expenseId);
    
    if (item) {
      const amount = parseFloat(abonoMonto) || 0;
      const currentPaid = item.montoPagado || 0;
      const newPaid = Math.min(item.monto, currentPaid + amount);
      
      item.montoPagado = newPaid;
      
      if (newPaid >= item.monto) {
        item.estado = 'pagado';
        item.fechaPago = new Date().toISOString();
      } else if (newPaid > 0) {
        item.estado = 'parcial';
      } else {
        item.estado = 'pendiente';
      }

      if (supabaseClient) {
        try {
          await supabaseClient.from('expenses').update({
            monto_pagado: item.montoPagado,
            estado: item.estado
          }).eq('id', expenseId);
        } catch (err) {
          console.error('Error Supabase abono update:', err);
        }
      }

      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));

      const newHistoryItem = {
        id: 'pay-abono-' + Date.now(),
        weekLabel: `Abono: ${item.concepto}`,
        totalMonto: amount,
        desglose: [{ persona: item.quienDebe, monto: amount }],
        gastosIds: [expenseId],
        esAbono: true,
        fechaLiquidacion: new Date().toISOString()
      };

      if (supabaseClient) {
        try {
          await supabaseClient.from('payment_history').insert([{
            id: newHistoryItem.id,
            week_label: newHistoryItem.weekLabel,
            total_monto: amount,
            desglose: newHistoryItem.desglose,
            gastos_ids: newHistoryItem.gastosIds,
            es_abono: true
          }]);
        } catch (err) {
          console.error('Error Supabase insert history:', err);
        }
      }

      const history = await this.getPaymentHistory();
      history.unshift(newHistoryItem);
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(history));

      return item;
    }
    return null;
  },

  async updateExpense(id, updatedFields) {
    if (supabaseClient) {
      try {
        await supabaseClient.from('expenses').update({
          monto: parseFloat(updatedFields.monto),
          concepto: updatedFields.concepto,
          quien_debe: updatedFields.quienDebe,
          fecha: updatedFields.fecha,
          categoria: updatedFields.categoria
        }).eq('id', id);
      } catch (err) {
        console.error('Error Supabase update:', err);
      }
    }

    const expenses = await this.getExpensesLocal();
    const index = expenses.findIndex(e => e.id === id);
    if (index !== -1) {
      expenses[index] = { ...expenses[index], ...updatedFields };
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
      return expenses[index];
    }
    return null;
  },

  async deleteExpense(id) {
    if (supabaseClient) {
      try {
        await supabaseClient.from('expenses').delete().eq('id', id);
      } catch (err) {
        console.error('Error Supabase delete:', err);
      }
    }

    let expenses = await this.getExpensesLocal();
    expenses = expenses.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    return true;
  },

  async toggleExpenseStatus(id) {
    const expenses = await this.getExpenses();
    const item = expenses.find(e => e.id === id);
    if (item) {
      if (item.estado === 'pagado') {
        item.estado = 'pendiente';
        item.montoPagado = 0;
      } else {
        item.estado = 'pagado';
        item.montoPagado = item.monto;
        item.fechaPago = new Date().toISOString();
      }

      if (supabaseClient) {
        try {
          await supabaseClient.from('expenses').update({
            estado: item.estado,
            monto_pagado: item.montoPagado
          }).eq('id', id);
        } catch (err) {
          console.error('Error Supabase toggle:', err);
        }
      }

      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
      return item;
    }
    return null;
  },

  async payWeek(weekId, weekLabel, expenseIds, breakdown, totalAmount) {
    const expenses = await this.getExpenses();

    const updatedExpenses = expenses.map(exp => {
      if (expenseIds.includes(exp.id)) {
        return { 
          ...exp, 
          estado: 'pagado', 
          montoPagado: exp.monto,
          fechaPago: new Date().toISOString() 
        };
      }
      return exp;
    });

    if (supabaseClient) {
      try {
        for (const expId of expenseIds) {
          const expItem = expenses.find(e => e.id === expId);
          await supabaseClient.from('expenses').update({
            estado: 'pagado',
            monto_pagado: expItem ? expItem.monto : 0
          }).eq('id', expId);
        }
      } catch (err) {
        console.error('Error Supabase payWeek:', err);
      }
    }

    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updatedExpenses));

    const newPaymentRecord = {
      id: 'pay-' + Date.now(),
      weekId,
      weekLabel,
      totalMonto: totalAmount,
      desglose: breakdown,
      gastosIds: expenseIds,
      fechaLiquidacion: new Date().toISOString()
    };

    if (supabaseClient) {
      try {
        await supabaseClient.from('payment_history').insert([{
          id: newPaymentRecord.id,
          week_id: weekId,
          week_label: weekLabel,
          total_monto: totalAmount,
          desglose: breakdown,
          gastos_ids: expenseIds
        }]);
      } catch (err) {
        console.error('Error Supabase insert history:', err);
      }
    }

    const history = await this.getPaymentHistory();
    history.unshift(newPaymentRecord);
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(history));

    return newPaymentRecord;
  },

  async getPaymentHistory() {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('payment_history')
          .select('*')
          .order('fecha_liquidacion', { ascending: false });

        if (!error && data) {
          return data.map(row => ({
            id: row.id,
            weekId: row.week_id,
            weekLabel: row.week_label,
            totalMonto: parseFloat(row.total_monto),
            desglose: row.desglose,
            gastosIds: row.gastos_ids,
            esAbono: row.es_abono,
            fechaLiquidacion: row.fecha_liquidacion
          }));
        }
      } catch (e) {
        console.error('Error leyendo historial Supabase:', e);
      }
    }

    try {
      const data = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error leyendo historial local', e);
      return [];
    }
  },

  async undoPayment(historyId) {
    const history = await this.getPaymentHistory();
    const record = history.find(h => h.id === historyId);
    
    if (record) {
      const expenses = await this.getExpenses();
      const updatedExpenses = expenses.map(exp => {
        if (record.gastosIds.includes(exp.id)) {
          return { ...exp, estado: 'pendiente', montoPagado: 0, fechaPago: null };
        }
        return exp;
      });

      if (supabaseClient) {
        try {
          for (const expId of record.gastosIds) {
            await supabaseClient.from('expenses').update({
              estado: 'pendiente',
              monto_pagado: 0
            }).eq('id', expId);
          }
          await supabaseClient.from('payment_history').delete().eq('id', historyId);
        } catch (err) {
          console.error('Error Supabase undoPayment:', err);
        }
      }

      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updatedExpenses));

      const newHistory = history.filter(h => h.id !== historyId);
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(newHistory));
      return true;
    }
    return false;
  },

  async getPeople() {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('people')
          .select('nombre')
          .order('nombre', { ascending: true });

        if (!error && data) {
          return data.map(r => r.nombre);
        }
      } catch (e) {
        console.error('Error leyendo gente Supabase:', e);
      }
    }

    const data = localStorage.getItem(STORAGE_KEYS.PEOPLE);
    return data ? JSON.parse(data) : [];
  },

  async addPerson(name) {
    if (!name) return;
    const formatted = name.trim();
    if (!formatted) return;

    if (supabaseClient) {
      try {
        await supabaseClient.from('people').upsert([{ nombre: formatted }], { onConflict: 'nombre' });
      } catch (err) {
        console.error('Error añadiendo persona en Supabase:', err);
      }
      return;
    }

    const people = await this.getPeople();
    if (!people.includes(formatted)) {
      people.push(formatted);
      localStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(people));
    }
  }
};

// ==========================================================================
// 2. APPLICATION CONTROLLER
// ==========================================================================

let currentExpenses = [];
let currentHistory = [];
let currentPeople = [];
let activeWeekModalData = null;
let currentExpenseType = 'individual';

function formatMoney(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount || 0);
}

function formatDateShort(dateString) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function getWeekRange(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  const dayOfWeek = date.getDay();
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
  
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const formatStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const mondayStr = formatStr(monday);
  const sundayStr = formatStr(sunday);

  const labelOptions = { day: '2-digit', month: 'short' };
  const mondayLabel = monday.toLocaleDateString('es-ES', labelOptions);
  const sundayLabel = sunday.toLocaleDateString('es-ES', { ...labelOptions, year: 'numeric' });

  return {
    weekKey: `${mondayStr}_${sundayStr}`,
    mondayDate: mondayStr,
    sundayDate: sundayStr,
    label: `Semana: ${mondayLabel} - ${sundayLabel}`
  };
}

// Dynamic Elements Reference
const elements = {};

function initElements() {
  const getEl = id => document.getElementById(id);

  elements.statTotalSpent = getEl('statTotalSpent');
  elements.statTotalCount = getEl('statTotalCount');
  elements.statPendingSpent = getEl('statPendingSpent');
  elements.statPendingCount = getEl('statPendingCount');
  elements.statPaidSpent = getEl('statPaidSpent');
  elements.statPaidCount = getEl('statPaidCount');
  elements.statTopDebtorName = getEl('statTopDebtorName');
  elements.statTopDebtorAmount = getEl('statTopDebtorAmount');

  elements.searchExpense = getEl('searchExpense');
  elements.filterPerson = getEl('filterPerson');
  elements.filterStatus = getEl('filterStatus');
  elements.expensesTableBody = getEl('expensesTableBody');
  elements.expensesEmptyState = getEl('expensesEmptyState');

  elements.weeklyCardsGrid = getEl('weeklyCardsGrid');
  elements.weeklyEmptyState = getEl('weeklyEmptyState');

  elements.historyListContainer = getEl('historyListContainer');
  elements.historyEmptyState = getEl('historyEmptyState');

  elements.modalNewExpense = getEl('modalNewExpense');
  elements.modalNewPerson = getEl('modalNewPerson');
  elements.modalWeekDetail = getEl('modalWeekDetail');
  elements.modalAbono = getEl('modalAbono');

  elements.formExpense = getEl('formExpense');
  elements.editExpenseId = getEl('editExpenseId');
  elements.expMonto = getEl('expMonto');
  elements.expConcepto = getEl('expConcepto');
  elements.expQuienDebe = getEl('expQuienDebe');
  elements.expFecha = getEl('expFecha');
  elements.expCategoria = getEl('expCategoria');
  elements.formNewPerson = getEl('formNewPerson');
  elements.newPersonName = getEl('newPersonName');

  elements.formAbono = getEl('formAbono');
  elements.abonoExpenseId = getEl('abonoExpenseId');
  elements.abonoMonto = getEl('abonoMonto');
  elements.abonoModalSub = getEl('abonoModalSub');
  elements.abonoRemainingHint = getEl('abonoRemainingHint');

  elements.btnOpenNewExpense = getEl('btnOpenNewExpense');
  elements.btnAddNewPersonModal = getEl('btnAddNewPersonModal');
  elements.btnPayCurrentWeek = getEl('btnPayCurrentWeek');

  elements.weekModalTitle = getEl('weekModalTitle');
  elements.weekModalSub = getEl('weekModalSub');
  elements.weekModalDebtorAvatar = getEl('weekModalDebtorAvatar');
  elements.weekModalDebtorDetail = getEl('weekModalDebtorDetail');
  elements.weekModalBreakdownList = getEl('weekModalBreakdownList');
  elements.weekModalItemsList = getEl('weekModalItemsList');
  elements.weekModalTotalPending = getEl('weekModalTotalPending');

  elements.btnTypeIndividual = getEl('btnTypeIndividual');
  elements.btnTypeSplit = getEl('btnTypeSplit');
  elements.singlePersonGroup = getEl('singlePersonGroup');
  elements.splitExpenseGroup = getEl('splitExpenseGroup');
  elements.splitParticipantsContainer = getEl('splitParticipantsContainer');
  elements.splitAssignedSum = getEl('splitAssignedSum');
  elements.splitTotalTarget = getEl('splitTotalTarget');
  elements.splitStatusBadge = getEl('splitStatusBadge');
  elements.chkShowPaidWeeks = getEl('chkShowPaidWeeks');

  // History Detail Elements
  elements.searchHistory = getEl('searchHistory');
  elements.modalHistoryDetail = getEl('modalHistoryDetail');
  elements.historyModalTitle = getEl('historyModalTitle');
  elements.historyModalSub = getEl('historyModalSub');
  elements.historyModalHighestAvatar = getEl('historyModalHighestAvatar');
  elements.historyModalHighestDetail = getEl('historyModalHighestDetail');
  elements.historyModalBreakdownList = getEl('historyModalBreakdownList');
  elements.historyModalItemsList = getEl('historyModalItemsList');
  elements.historyModalTotalPaid = getEl('historyModalTotalPaid');
}

// Global modal helpers exposed on window
window.openModal = function(modalElement) {
  const el = typeof modalElement === 'string' ? document.getElementById(modalElement) : modalElement;
  if (el) el.classList.add('active');
};

window.closeModal = function(modalElement) {
  const el = typeof modalElement === 'string' ? document.getElementById(modalElement) : modalElement;
  if (el) el.classList.remove('active');
};

window.openExpenseModal = function(expenseToEdit = null) {
  setExpenseTypeMode('individual');

  if (expenseToEdit) {
    const title = document.getElementById('modalExpenseTitle');
    if (title) title.textContent = 'Editar Gasto';
    if (elements.editExpenseId) elements.editExpenseId.value = expenseToEdit.id;
    if (elements.expMonto) elements.expMonto.value = expenseToEdit.monto;
    if (elements.expConcepto) elements.expConcepto.value = expenseToEdit.concepto;
    if (elements.expQuienDebe) elements.expQuienDebe.value = expenseToEdit.quienDebe;
    if (elements.expFecha) elements.expFecha.value = expenseToEdit.fecha;
    if (elements.expCategoria) elements.expCategoria.value = expenseToEdit.categoria || 'Otros';
    if (elements.btnTypeSplit) elements.btnTypeSplit.style.display = 'none';
  } else {
    const title = document.getElementById('modalExpenseTitle');
    if (title) title.textContent = 'Registrar Nuevo Gasto';
    if (elements.formExpense) elements.formExpense.reset();
    if (elements.editExpenseId) elements.editExpenseId.value = '';
    if (elements.expFecha) elements.expFecha.value = new Date().toISOString().split('T')[0];
    if (elements.btnTypeSplit) elements.btnTypeSplit.style.display = 'inline-flex';
  }
  window.openModal('modalNewExpense');
};

// Start application
async function startApp() {
  initElements();
  setupEventListeners();

  try {
    await dbService.init();
    await loadAllData();
  } catch (err) {
    console.error('Error cargando datos:', err);
  }

  if (elements.expFecha) {
    elements.expFecha.value = new Date().toISOString().split('T')[0];
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

function setupEventListeners() {
  // Navigation Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetTab = e.currentTarget.getAttribute('data-tab');
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      e.currentTarget.classList.add('active');
      const targetEl = document.getElementById(targetTab);
      if (targetEl) targetEl.classList.add('active');
    });
  });

  // Open New Expense Modal
  const btnNew = elements.btnOpenNewExpense || document.getElementById('btnOpenNewExpense');
  if (btnNew) {
    btnNew.onclick = () => window.openExpenseModal();
  }

  // Open New Person Modal
  const btnAddPerson = elements.btnAddNewPersonModal || document.getElementById('btnAddNewPersonModal');
  if (btnAddPerson) {
    btnAddPerson.onclick = () => window.openModal('modalNewPerson');
  }

  // Close modals
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modalId = e.currentTarget.getAttribute('data-close-modal');
      window.closeModal(modalId);
    });
  });

  // Toggle show paid weeks
  if (elements.chkShowPaidWeeks) {
    elements.chkShowPaidWeeks.addEventListener('change', renderWeeklyGrid);
  }

  // Search History
  if (elements.searchHistory) {
    elements.searchHistory.addEventListener('input', renderHistoryList);
  }

  // Submit Abono Form
  if (elements.formAbono) {
    elements.formAbono.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = elements.abonoExpenseId.value;
      const amount = parseFloat(elements.abonoMonto.value) || 0;

      if (id && amount > 0) {
        await dbService.addAbono(id, amount);
        window.closeModal('modalAbono');
        await loadAllData();
        
        if (activeWeekModalData) {
          window.closeModal('modalWeekDetail');
        }
      }
    });
  }

  // Expense Type Toggle
  if (elements.btnTypeIndividual) elements.btnTypeIndividual.addEventListener('click', () => setExpenseTypeMode('individual'));
  if (elements.btnTypeSplit) elements.btnTypeSplit.addEventListener('click', () => setExpenseTypeMode('split'));

  // Split Mode Radio Buttons
  document.querySelectorAll('input[name="splitMode"]').forEach(radio => {
    radio.addEventListener('change', updateSplitCalculations);
  });

  if (elements.expMonto) elements.expMonto.addEventListener('input', updateSplitCalculations);

  // Filters
  if (elements.searchExpense) elements.searchExpense.addEventListener('input', renderExpenseTable);
  if (elements.filterPerson) elements.filterPerson.addEventListener('change', renderExpenseTable);
  if (elements.filterStatus) elements.filterStatus.addEventListener('change', renderExpenseTable);

  // Submit Expense Form
  if (elements.formExpense) {
    elements.formExpense.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = elements.editExpenseId.value;
      const totalAmount = parseFloat(elements.expMonto.value) || 0;
      const concepto = elements.expConcepto.value;
      const fecha = elements.expFecha.value;
      const categoria = elements.expCategoria.value;

      if (currentExpenseType === 'individual') {
        const expenseData = {
          monto: totalAmount,
          concepto,
          quienDebe: elements.expQuienDebe.value,
          fecha,
          categoria
        };

        if (id) {
          await dbService.updateExpense(id, expenseData);
        } else {
          await dbService.addExpense(expenseData);
        }
      } else {
        const participantsData = getSelectedSplitParticipants();

        if (participantsData.length === 0) {
          alert('Debes seleccionar al menos una persona para dividir el gasto.');
          return;
        }

        const assignedSum = participantsData.reduce((acc, p) => acc + p.monto, 0);
        
        if (Math.abs(assignedSum - totalAmount) > 0.05) {
          alert(`La suma de los montos asignados (${formatMoney(assignedSum)}) debe ser igual al monto total (${formatMoney(totalAmount)}).`);
          return;
        }

        await dbService.addSplitExpenses({
          montoTotal: totalAmount,
          concepto,
          fecha,
          categoria,
          participants: participantsData
        });
      }

      window.closeModal('modalNewExpense');
      await loadAllData();
    });
  }

  // Submit New Person Form
  if (elements.formNewPerson) {
    elements.formNewPerson.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = elements.newPersonName.value.trim();
      if (name) {
        await dbService.addPerson(name);
        elements.newPersonName.value = '';
        window.closeModal('modalNewPerson');
        await loadPeople();
        if (elements.expQuienDebe) elements.expQuienDebe.value = name;
      }
    });
  }

  // Pay Current Week from Modal
  if (elements.btnPayCurrentWeek) {
    elements.btnPayCurrentWeek.addEventListener('click', async () => {
      if (!activeWeekModalData) return;
      const { weekKey, label, expenseIds, breakdown, pendingTotal } = activeWeekModalData;
      
      if (expenseIds.length === 0 || pendingTotal <= 0) {
        alert('Esta semana ya no tiene saldos pendientes por pagar.');
        return;
      }

      if (confirm(`¿Confirmas marcar la ${label} como PAGADA por un total de ${formatMoney(pendingTotal)}?`)) {
        await dbService.payWeek(weekKey, label, expenseIds, breakdown, pendingTotal);
        window.closeModal('modalWeekDetail');
        await loadAllData();
      }
    });
  }
}

async function loadAllData() {
  currentExpenses = await dbService.getExpenses();
  currentHistory = await dbService.getPaymentHistory();
  await loadPeople();

  renderStats();
  renderExpenseTable();
  renderWeeklyGrid();
  renderHistoryList();

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

async function loadPeople() {
  currentPeople = await dbService.getPeople();
  const options = currentPeople.map(p => `<option value="${p}">${p}</option>`).join('');
  if (elements.expQuienDebe) elements.expQuienDebe.innerHTML = options;
  if (elements.filterPerson) elements.filterPerson.innerHTML = `<option value="">Todas las personas</option>` + options;
}

function renderStats() {
  const totalSpent = currentExpenses.reduce((acc, e) => acc + e.monto, 0);
  
  let pendingTotal = 0;
  let paidTotal = 0;
  let pendingCount = 0;
  let paidCount = 0;

  const debtorMap = {};

  currentExpenses.forEach(e => {
    const paid = e.montoPagado || 0;
    const pending = Math.max(0, e.monto - paid);
    
    paidTotal += paid;
    pendingTotal += pending;

    if (e.estado === 'pagado') {
      paidCount++;
    } else {
      pendingCount++;
    }

    if (pending > 0) {
      debtorMap[e.quienDebe] = (debtorMap[e.quienDebe] || 0) + pending;
    }
  });

  if (elements.statTotalSpent) elements.statTotalSpent.textContent = formatMoney(totalSpent);
  if (elements.statTotalCount) elements.statTotalCount.textContent = `${currentExpenses.length} gastos registrados`;

  if (elements.statPendingSpent) elements.statPendingSpent.textContent = formatMoney(pendingTotal);
  if (elements.statPendingCount) elements.statPendingCount.textContent = `${pendingCount} con saldo pendiente`;

  if (elements.statPaidSpent) elements.statPaidSpent.textContent = formatMoney(paidTotal);
  if (elements.statPaidCount) elements.statPaidCount.textContent = `${paidCount} liquidados`;

  let topDebtor = '-';
  let maxDebt = 0;
  for (const [person, amount] of Object.entries(debtorMap)) {
    if (amount > maxDebt) {
      maxDebt = amount;
      topDebtor = person;
    }
  }

  if (elements.statTopDebtorName) elements.statTopDebtorName.textContent = topDebtor;
  if (elements.statTopDebtorAmount) elements.statTopDebtorAmount.textContent = maxDebt > 0 ? `Debe ${formatMoney(maxDebt)} pendiente` : 'Sin deudas pendientes';
}

function renderExpenseTable() {
  if (!elements.expensesTableBody) return;

  const search = (elements.searchExpense?.value || '').toLowerCase();
  const person = elements.filterPerson?.value || '';
  const status = (elements.filterStatus?.value || 'activos');

  const filtered = currentExpenses.filter(e => {
    const matchesSearch = e.concepto.toLowerCase().includes(search) || e.quienDebe.toLowerCase().includes(search);
    const matchesPerson = !person || e.quienDebe === person;
    
    let matchesStatus = true;
    if (status === 'activos') {
      matchesStatus = e.estado !== 'pagado';
    } else if (status === 'pendiente') {
      matchesStatus = e.estado === 'pendiente';
    } else if (status === 'parcial') {
      matchesStatus = e.estado === 'parcial';
    } else if (status === 'pagado') {
      matchesStatus = e.estado === 'pagado';
    } // 'todos' matches everything

    return matchesSearch && matchesPerson && matchesStatus;
  });

  if (filtered.length === 0) {
    elements.expensesTableBody.innerHTML = '';
    if (elements.expensesEmptyState) elements.expensesEmptyState.style.display = 'block';
    return;
  }

  if (elements.expensesEmptyState) elements.expensesEmptyState.style.display = 'none';

  elements.expensesTableBody.innerHTML = filtered.map(item => {
    const paid = item.montoPagado || 0;
    const pending = Math.max(0, item.monto - paid);

    let statusBadgeHTML = '';
    if (item.estado === 'pagado') {
      statusBadgeHTML = `
        <span class="badge badge-paid">
          <i data-lucide="check" style="width: 12px;"></i> Pagado
        </span>
      `;
    } else if (item.estado === 'parcial') {
      statusBadgeHTML = `
        <span class="badge badge-parcial" title="Abonado: ${formatMoney(paid)} / Total: ${formatMoney(item.monto)}">
          <i data-lucide="pie-chart" style="width: 12px;"></i> Restan ${formatMoney(pending)}
        </span>
      `;
    } else {
      statusBadgeHTML = `
        <span class="badge badge-pending">
          <i data-lucide="clock" style="width: 12px;"></i> Pendiente (${formatMoney(pending)})
        </span>
      `;
    }

    return `
      <tr>
        <td>${formatDateShort(item.fecha)}</td>
        <td>
          <strong style="color: var(--text-main); display: block;">${item.concepto}</strong>
          ${paid > 0 && item.estado !== 'pagado' ? `<small style="color: var(--accent-cyan); font-size: 0.775rem;">Abonado: ${formatMoney(paid)}</small>` : ''}
        </td>
        <td>
          <span class="badge badge-person">
            <i data-lucide="user" style="width: 12px;"></i> ${item.quienDebe}
          </span>
        </td>
        <td>
          <span style="font-size: 0.8rem; color: var(--text-muted);">${item.categoria || 'Otros'}</span>
        </td>
        <td>
          <strong style="font-size: 1rem; color: var(--text-main);">${formatMoney(item.monto)}</strong>
        </td>
        <td>${statusBadgeHTML}</td>
        <td style="text-align: right;">
          ${item.estado !== 'pagado' ? `
            <button class="action-btn abono-btn" data-abono-id="${item.id}" title="Registrar Abono">
              <i data-lucide="coins"></i>
            </button>
          ` : ''}
          <button class="action-btn pay-btn" data-toggle-id="${item.id}" title="${item.estado === 'pagado' ? 'Marcar como pendiente' : 'Marcar como 100% pagado'}">
            <i data-lucide="${item.estado === 'pagado' ? 'rotate-ccw' : 'check-circle'}"></i>
          </button>
          <button class="action-btn edit-btn" data-edit-id="${item.id}" title="Editar gasto">
            <i data-lucide="pencil"></i>
          </button>
          <button class="action-btn delete-btn" data-delete-id="${item.id}" title="Eliminar gasto">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  elements.expensesTableBody.querySelectorAll('[data-abono-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-abono-id');
      const item = currentExpenses.find(x => x.id === id);
      if (item) openAbonoModal(item);
    });
  });

  elements.expensesTableBody.querySelectorAll('[data-toggle-id]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-toggle-id');
      await dbService.toggleExpenseStatus(id);
      await loadAllData();
    });
  });

  elements.expensesTableBody.querySelectorAll('[data-edit-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-edit-id');
      const expense = currentExpenses.find(x => x.id === id);
      if (expense) openExpenseModal(expense);
    });
  });

  elements.expensesTableBody.querySelectorAll('[data-delete-id]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-delete-id');
      if (confirm('¿Estás seguro de eliminar este gasto?')) {
        await dbService.deleteExpense(id);
        await loadAllData();
      }
    });
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function renderWeeklyGrid() {
  if (!elements.weeklyCardsGrid) return;

  if (currentExpenses.length === 0) {
    elements.weeklyCardsGrid.innerHTML = '';
    if (elements.weeklyEmptyState) elements.weeklyEmptyState.style.display = 'block';
    return;
  }

  const weekGroups = {};

  currentExpenses.forEach(exp => {
    const weekInfo = getWeekRange(exp.fecha);
    const key = weekInfo.weekKey;

    if (!weekGroups[key]) {
      weekGroups[key] = {
        weekKey: key,
        label: weekInfo.label,
        mondayDate: weekInfo.mondayDate,
        sundayDate: weekInfo.sundayDate,
        expenses: [],
        totalSpent: 0,
        pendingTotal: 0,
        paidTotal: 0,
        personMap: {}
      };
    }

    const group = weekGroups[key];
    group.expenses.push(exp);
    group.totalSpent += exp.monto;

    const paid = exp.montoPagado || 0;
    const pending = Math.max(0, exp.monto - paid);

    group.pendingTotal += pending;
    group.paidTotal += paid;

    if (!group.personMap[exp.quienDebe]) {
      group.personMap[exp.quienDebe] = { pending: 0, paid: 0, total: 0, itemsCount: 0 };
    }
    group.personMap[exp.quienDebe].total += exp.monto;
    group.personMap[exp.quienDebe].paid += paid;
    group.personMap[exp.quienDebe].pending += pending;
    group.personMap[exp.quienDebe].itemsCount += 1;
  });

  let sortedWeeks = Object.values(weekGroups).sort((a, b) => b.mondayDate.localeCompare(a.mondayDate));

  const showPaidWeeks = elements.chkShowPaidWeeks ? elements.chkShowPaidWeeks.checked : false;

  // Filter out 100% paid weeks by default unless explicitly checked
  if (!showPaidWeeks) {
    sortedWeeks = sortedWeeks.filter(w => w.pendingTotal > 0);
  }

  if (sortedWeeks.length === 0) {
    elements.weeklyCardsGrid.innerHTML = '';
    if (elements.weeklyEmptyState) {
      elements.weeklyEmptyState.innerHTML = `
        <div class="empty-icon"><i data-lucide="check-circle-2" style="color: var(--accent-emerald);"></i></div>
        <p>No hay semanas con saldos pendientes por cobrar. ¡Todas las cuentas semanales están al día!</p>
      `;
      elements.weeklyEmptyState.style.display = 'block';
    }
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  if (elements.weeklyEmptyState) elements.weeklyEmptyState.style.display = 'none';

  elements.weeklyCardsGrid.innerHTML = sortedWeeks.map(group => {
    let topDebtor = '-';
    let maxPending = 0;

    for (const [person, data] of Object.entries(group.personMap)) {
      if (data.pending > maxPending) {
        maxPending = data.pending;
        topDebtor = person;
      }
    }

    const isFullyPaid = group.pendingTotal === 0 && group.totalSpent > 0;
    const isPartialPaid = group.paidTotal > 0 && group.pendingTotal > 0;

    const personBreakdownHTML = Object.entries(group.personMap).map(([person, data]) => {
      let text = '✓ Pagado';
      if (data.pending > 0 && data.paid > 0) {
        text = `Paga: ${formatMoney(data.pending)} <small style="color: var(--accent-cyan);">(Abonó ${formatMoney(data.paid)})</small>`;
      } else if (data.pending > 0) {
        text = `Paga: ${formatMoney(data.pending)}`;
      }

      return `
        <div class="person-breakdown-item">
          <span class="person-name">
            <i data-lucide="user" style="width: 13px; color: var(--accent-primary);"></i> ${person}
          </span>
          <span class="person-amount ${data.pending === 0 ? 'is-zero' : ''}">
            ${text}
          </span>
        </div>
      `;
    }).join('');

    let weekBadgeHTML = `<span class="badge badge-pending">Pendiente</span>`;
    if (isFullyPaid) {
      weekBadgeHTML = `<span class="badge badge-paid">Pagada</span>`;
    } else if (isPartialPaid) {
      weekBadgeHTML = `<span class="badge badge-parcial">Pago Parcial</span>`;
    }

    return `
      <div class="weekly-card ${isFullyPaid ? 'paid-full' : ''}">
        <div>
          <div class="weekly-header">
            <div>
              <div class="weekly-date-range">${group.label}</div>
              <div class="weekly-sub">${group.expenses.length} gastos en esta semana</div>
            </div>
            ${weekBadgeHTML}
          </div>

          ${maxPending > 0 ? `
            <div class="top-debtor-banner">
              <div class="top-debtor-avatar">${topDebtor.charAt(0).toUpperCase()}</div>
              <div class="top-debtor-info">
                <h4>Quien debe más esta semana</h4>
                <p>${topDebtor} (Restan ${formatMoney(maxPending)})</p>
              </div>
            </div>
          ` : `
            <div class="top-debtor-banner" style="background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.25);">
              <div class="top-debtor-avatar" style="background: var(--accent-emerald);">✓</div>
              <div class="top-debtor-info">
                <h4 style="color: var(--accent-emerald);">Semana al día</h4>
                <p style="font-size: 0.85rem; color: var(--text-muted);">Sin saldos pendientes</p>
              </div>
            </div>
          `}

          <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.4rem; font-weight: 600;">
            ¿Cuánto va a pagar cada persona?
          </div>
          <div class="person-breakdown-list">
            ${personBreakdownHTML}
          </div>
        </div>

        <div class="weekly-footer">
          <div>
            <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">Total Pendiente</span>
            <span class="weekly-total" style="color: ${isFullyPaid ? 'var(--accent-emerald)' : 'var(--accent-amber)'};">${formatMoney(group.pendingTotal)}</span>
          </div>

          <button class="btn btn-secondary btn-sm btn-open-week" data-week-key="${group.weekKey}">
            <i data-lucide="eye"></i> Ver Detalle
          </button>
        </div>
      </div>
    `;
  }).join('');

  elements.weeklyCardsGrid.querySelectorAll('[data-week-key]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const key = e.currentTarget.getAttribute('data-week-key');
      const targetGroup = weekGroups[key];
      if (targetGroup) openWeekDetailModal(targetGroup);
    });
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function openWeekDetailModal(group) {
  activeWeekModalData = {
    weekKey: group.weekKey,
    label: group.label,
    expenseIds: group.expenses.map(e => e.id),
    pendingTotal: group.pendingTotal,
    breakdown: Object.entries(group.personMap).map(([person, data]) => ({
      persona: person,
      monto: data.pending,
      montoAbonado: data.paid,
      totalSemana: data.total,
      itemsCount: data.itemsCount
    }))
  };

  if (elements.weekModalTitle) elements.weekModalTitle.textContent = group.label;
  if (elements.weekModalSub) elements.weekModalSub.textContent = `${group.expenses.length} gastos - Total gastado: ${formatMoney(group.totalSpent)}`;

  let topDebtor = '-';
  let maxPending = 0;
  for (const [person, data] of Object.entries(group.personMap)) {
    if (data.pending > maxPending) {
      maxPending = data.pending;
      topDebtor = person;
    }
  }

  if (elements.weekModalDebtorAvatar && elements.weekModalDebtorDetail) {
    if (maxPending > 0) {
      elements.weekModalDebtorAvatar.textContent = topDebtor.charAt(0).toUpperCase();
      elements.weekModalDebtorDetail.textContent = `${topDebtor} debe ${formatMoney(maxPending)} en esta semana`;
    } else {
      elements.weekModalDebtorAvatar.textContent = '✓';
      elements.weekModalDebtorDetail.textContent = 'Todos los gastos de esta semana están pagados';
    }
  }

  if (elements.weekModalBreakdownList) {
    elements.weekModalBreakdownList.innerHTML = Object.entries(group.personMap).map(([person, data]) => {
      let statusText = '✓ Liquidado';
      if (data.pending > 0 && data.paid > 0) {
        statusText = `Resta: ${formatMoney(data.pending)} <small style="color: var(--accent-cyan);">(Abonó ${formatMoney(data.paid)})</small>`;
      } else if (data.pending > 0) {
        statusText = `Por pagar: ${formatMoney(data.pending)}`;
      }

      return `
        <div class="person-breakdown-item">
          <span class="person-name">
            <i data-lucide="user" style="width: 14px;"></i> ${person} (${data.itemsCount} concepto${data.itemsCount > 1 ? 's' : ''})
          </span>
          <span class="person-amount ${data.pending === 0 ? 'is-zero' : ''}">
            ${statusText}
          </span>
        </div>
      `;
    }).join('');
  }

  if (elements.weekModalItemsList) {
    elements.weekModalItemsList.innerHTML = group.expenses.map(exp => {
      const paid = exp.montoPagado || 0;
      const pending = Math.max(0, exp.monto - paid);

      let badgeClass = 'badge-pending';
      let badgeLabel = 'Pendiente';
      if (exp.estado === 'pagado') {
        badgeClass = 'badge-paid';
        badgeLabel = 'Pagado';
      } else if (exp.estado === 'parcial') {
        badgeClass = 'badge-parcial';
        badgeLabel = `Restan ${formatMoney(pending)}`;
      }

      return `
        <div class="detail-item-row" style="border-left-color: ${exp.estado === 'pagado' ? 'var(--accent-emerald)' : (exp.estado === 'parcial' ? 'var(--accent-cyan)' : 'var(--accent-amber)')};">
          <div>
            <strong style="color: var(--text-main); display: block;">${exp.concepto}</strong>
            <span style="font-size: 0.775rem; color: var(--text-muted);">
              ${formatDateShort(exp.fecha)} • Debe: <strong>${exp.quienDebe}</strong>
              ${paid > 0 && exp.estado !== 'pagado' ? ` • <span style="color: var(--accent-cyan);">Abonado: ${formatMoney(paid)}</span>` : ''}
            </span>
          </div>
          <div style="text-align: right; display: flex; align-items: center; gap: 0.5rem;">
            <div>
              <span style="font-weight: 700; font-size: 0.95rem;">${formatMoney(exp.monto)}</span>
              <span class="badge ${badgeClass}" style="display: block; margin-top: 0.2rem; font-size: 0.7rem;">
                ${badgeLabel}
              </span>
            </div>

            ${exp.estado !== 'pagado' ? `
              <button class="btn btn-secondary btn-sm btn-abono-modal" data-abono-item-id="${exp.id}" title="Registrar Abono">
                <i data-lucide="coins"></i> Abonar
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    elements.weekModalItemsList.querySelectorAll('[data-abono-item-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-abono-item-id');
        const item = group.expenses.find(x => x.id === id);
        if (item) openAbonoModal(item);
      });
    });
  }

  if (elements.weekModalTotalPending) {
    elements.weekModalTotalPending.textContent = formatMoney(group.pendingTotal);
  }

  if (elements.btnPayCurrentWeek) {
    if (group.pendingTotal === 0) {
      elements.btnPayCurrentWeek.style.display = 'none';
    } else {
      elements.btnPayCurrentWeek.style.display = 'inline-flex';
    }
  }

  window.openModal('modalWeekDetail');

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function openAbonoModal(expense) {
  const paid = expense.montoPagado || 0;
  const remaining = Math.max(0, expense.monto - paid);

  if (elements.abonoExpenseId) elements.abonoExpenseId.value = expense.id;
  if (elements.abonoModalSub) elements.abonoModalSub.textContent = `Concepto: ${expense.concepto} • Debe: ${expense.quienDebe}`;
  if (elements.abonoMonto) {
    elements.abonoMonto.value = remaining.toFixed(2);
    elements.abonoMonto.max = remaining;
  }
  if (elements.abonoRemainingHint) {
    elements.abonoRemainingHint.textContent = `Total gasto: ${formatMoney(expense.monto)} | Abonado previo: ${formatMoney(paid)} | Resta por pagar: ${formatMoney(remaining)}`;
  }

  window.openModal('modalAbono');
}

function renderHistoryList() {
  if (!elements.historyListContainer) return;

  const search = (elements.searchHistory?.value || '').toLowerCase().trim();

  const filteredHistory = currentHistory.filter(item => {
    if (!search) return true;

    // Check week label or breakdown person names
    const matchesLabel = item.weekLabel.toLowerCase().includes(search);
    const matchesPerson = item.desglose && item.desglose.some(d => d.persona.toLowerCase().includes(search));

    // Check linked expense items concepts or categories
    const linkedItems = currentExpenses.filter(e => item.gastosIds && item.gastosIds.includes(e.id));
    const matchesItem = linkedItems.some(e => 
      e.concepto.toLowerCase().includes(search) || 
      (e.conceptoBase && e.conceptoBase.toLowerCase().includes(search)) ||
      (e.categoria && e.categoria.toLowerCase().includes(search))
    );

    return matchesLabel || matchesPerson || matchesItem;
  });

  if (filteredHistory.length === 0) {
    elements.historyListContainer.innerHTML = '';
    if (elements.historyEmptyState) elements.historyEmptyState.style.display = 'block';
    return;
  }

  if (elements.historyEmptyState) elements.historyEmptyState.style.display = 'none';

  elements.historyListContainer.innerHTML = filteredHistory.map(item => {
    const dateFormatted = new Date(item.fechaLiquidacion).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const breakdownBadges = item.desglose ? item.desglose.map(d => `
      <span class="badge badge-person" style="background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.25); color: #6ee7b7;">
        ${d.persona}: ${formatMoney(d.monto)}
      </span>
    `).join('') : '';

    return `
      <div class="history-card">
        <div class="history-info">
          <h3><i data-lucide="check-circle-2" style="width: 18px; color: var(--accent-emerald); display: inline;"></i> ${item.weekLabel}</h3>
          <p>Liquidado el: ${dateFormatted} • ${item.gastosIds ? item.gastosIds.length : 0} gastos incluidos</p>
          <div class="history-breakdown-tags">
            ${breakdownBadges}
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
          <div style="text-align: right; margin-right: 0.5rem;">
            <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">Monto Total Liquidado</span>
            <span style="font-size: 1.25rem; font-weight: 700; color: var(--accent-emerald);">${formatMoney(item.totalMonto)}</span>
          </div>

          <button class="btn btn-secondary btn-sm btn-open-history-detail" data-detail-history-id="${item.id}">
            <i data-lucide="eye"></i> Ver Detalle
          </button>

          <button class="btn btn-secondary btn-sm btn-undo-payment" data-history-id="${item.id}" title="Deshacer pago">
            <i data-lucide="undo"></i> Deshacer
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Attach Detail handlers
  elements.historyListContainer.querySelectorAll('[data-detail-history-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-detail-history-id');
      const item = currentHistory.find(x => x.id === id);
      if (item) openHistoryDetailModal(item);
    });
  });

  // Attach Undo Handlers
  elements.historyListContainer.querySelectorAll('[data-history-id]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-history-id');
      if (confirm('¿Deseas deshacer esta liquidación? Los gastos asociados volverán al estado pendiente.')) {
        await dbService.undoPayment(id);
        await loadAllData();
      }
    });
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function openHistoryDetailModal(record) {
  if (elements.historyModalTitle) elements.historyModalTitle.textContent = record.weekLabel;
  
  const dateFormatted = new Date(record.fechaLiquidacion).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  if (elements.historyModalSub) elements.historyModalSub.textContent = `Liquidado el: ${dateFormatted} • Monto Total: ${formatMoney(record.totalMonto)}`;

  const linkedExpenses = currentExpenses.filter(e => record.gastosIds && record.gastosIds.includes(e.id));

  let highestExpense = null;
  let maxMonto = 0;
  linkedExpenses.forEach(exp => {
    if (exp.monto > maxMonto) {
      maxMonto = exp.monto;
      highestExpense = exp;
    }
  });

  if (elements.historyModalHighestAvatar && elements.historyModalHighestDetail) {
    if (highestExpense) {
      elements.historyModalHighestAvatar.textContent = highestExpense.concepto.charAt(0).toUpperCase();
      elements.historyModalHighestDetail.textContent = `${highestExpense.concepto} (${formatMoney(highestExpense.monto)}) • Debía: ${highestExpense.quienDebe}`;
    } else {
      elements.historyModalHighestAvatar.textContent = '✓';
      elements.historyModalHighestDetail.textContent = `Liquidación acumulada por ${formatMoney(record.totalMonto)}`;
    }
  }

  if (elements.historyModalBreakdownList) {
    if (record.desglose && record.desglose.length > 0) {
      elements.historyModalBreakdownList.innerHTML = record.desglose.map(d => `
        <div class="person-breakdown-item">
          <span class="person-name">
            <i data-lucide="user" style="width: 14px; color: var(--accent-emerald);"></i> ${d.persona}
          </span>
          <span class="person-amount is-zero">
            Pagó: ${formatMoney(d.monto)}
          </span>
        </div>
      `).join('');
    } else {
      elements.historyModalBreakdownList.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-muted);">Sin desglose individual</p>`;
    }
  }

  if (elements.historyModalItemsList) {
    if (linkedExpenses.length > 0) {
      elements.historyModalItemsList.innerHTML = linkedExpenses.map(exp => `
        <div class="detail-item-row" style="border-left-color: var(--accent-emerald);">
          <div>
            <strong style="color: var(--text-main); display: block;">${exp.concepto}</strong>
            <span style="font-size: 0.775rem; color: var(--text-muted);">
              ${formatDateShort(exp.fecha)} • Debe/Pagó: <strong>${exp.quienDebe}</strong> • Categoría: ${exp.categoria || 'Otros'}
            </span>
          </div>
          <div style="text-align: right;">
            <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-main);">${formatMoney(exp.monto)}</span>
            <span class="badge badge-paid" style="display: block; margin-top: 0.2rem; font-size: 0.7rem;">
              Liquidado
            </span>
          </div>
        </div>
      `).join('');
    } else {
      elements.historyModalItemsList.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-muted); padding: 0.5rem;">Gastos liquidados por un total de ${formatMoney(record.totalMonto)}</p>`;
    }
  }

  if (elements.historyModalTotalPaid) {
    elements.historyModalTotalPaid.textContent = formatMoney(record.totalMonto);
  }

  window.openModal('modalHistoryDetail');

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function setExpenseTypeMode(mode) {
  currentExpenseType = mode;
  if (mode === 'individual') {
    if (elements.btnTypeIndividual) elements.btnTypeIndividual.classList.add('active');
    if (elements.btnTypeSplit) elements.btnTypeSplit.classList.remove('active');
    if (elements.singlePersonGroup) elements.singlePersonGroup.style.display = 'block';
    if (elements.splitExpenseGroup) elements.splitExpenseGroup.style.display = 'none';
  } else {
    if (elements.btnTypeSplit) elements.btnTypeSplit.classList.add('active');
    if (elements.btnTypeIndividual) elements.btnTypeIndividual.classList.remove('active');
    if (elements.singlePersonGroup) elements.singlePersonGroup.style.display = 'none';
    if (elements.splitExpenseGroup) elements.splitExpenseGroup.style.display = 'block';
    renderSplitParticipants();
  }
}

function renderSplitParticipants() {
  if (!elements.splitParticipantsContainer) return;

  const isCustom = document.querySelector('input[name="splitMode"]:checked')?.value === 'custom';

  elements.splitParticipantsContainer.innerHTML = currentPeople.map((person) => `
    <div class="participant-row">
      <label class="participant-checkbox-label">
        <input type="checkbox" class="chk-participant" value="${person}">
        <span>${person}</span>
      </label>
      <input type="number" step="0.01" min="0" 
        class="text-input participant-custom-input" 
        data-person="${person}" 
        placeholder="0.00" 
        readonly style="opacity: 0.6; background: rgba(0,0,0,0.3);">
    </div>
  `).join('');

  elements.splitParticipantsContainer.querySelectorAll('.chk-participant').forEach(chk => {
    chk.addEventListener('change', updateSplitCalculations);
  });

  elements.splitParticipantsContainer.querySelectorAll('.participant-custom-input').forEach(input => {
    input.addEventListener('input', updateSplitCalculations);
  });

  updateSplitCalculations();
}

function updateSplitCalculations() {
  if (currentExpenseType !== 'split' || !elements.splitParticipantsContainer) return;

  const totalTarget = parseFloat(elements.expMonto?.value) || 0;
  const isCustom = document.querySelector('input[name="splitMode"]:checked')?.value === 'custom';
  const allRows = Array.from(elements.splitParticipantsContainer.querySelectorAll('.participant-row'));
  const checkedRows = allRows.filter(row => row.querySelector('.chk-participant').checked);

  allRows.forEach(row => {
    const isChecked = row.querySelector('.chk-participant').checked;
    const input = row.querySelector('.participant-custom-input');

    if (!isChecked) {
      input.value = '';
      input.setAttribute('readonly', 'true');
      input.style.opacity = '0.5';
      input.style.background = 'rgba(0,0,0,0.3)';
    } else {
      if (isCustom) {
        input.removeAttribute('readonly');
        input.style.opacity = '1';
        input.style.background = 'var(--bg-card)';
      } else {
        input.setAttribute('readonly', 'true');
        input.style.opacity = '0.85';
        input.style.background = 'rgba(0,0,0,0.25)';
      }
    }
  });

  let sum = 0;

  if (!isCustom) {
    const count = checkedRows.length;
    const share = count > 0 ? (totalTarget / count) : 0;
    
    checkedRows.forEach(row => {
      const input = row.querySelector('.participant-custom-input');
      input.value = share > 0 ? share.toFixed(2) : '';
    });
    
    sum = share * count;
  } else {
    checkedRows.forEach(row => {
      const input = row.querySelector('.participant-custom-input');
      sum += parseFloat(input.value) || 0;
    });
  }

  if (elements.splitTotalTarget) elements.splitTotalTarget.textContent = formatMoney(totalTarget);
  if (elements.splitAssignedSum) elements.splitAssignedSum.textContent = formatMoney(sum);

  const diff = Math.abs(sum - totalTarget);
  if (elements.splitStatusBadge) {
    if (checkedRows.length === 0) {
      elements.splitStatusBadge.textContent = 'Selecciona quiénes participan';
      elements.splitStatusBadge.className = 'badge badge-pending';
    } else if (totalTarget > 0 && diff <= 0.05) {
      elements.splitStatusBadge.textContent = '✓ Correcto';
      elements.splitStatusBadge.className = 'badge badge-paid';
    } else {
      elements.splitStatusBadge.textContent = 'Incompleto';
      elements.splitStatusBadge.className = 'badge badge-pending';
    }
  }
}

function getSelectedSplitParticipants() {
  if (!elements.splitParticipantsContainer) return [];

  const rows = Array.from(elements.splitParticipantsContainer.querySelectorAll('.participant-row')).filter(
    row => row.querySelector('.chk-participant').checked
  );

  return rows.map(row => {
    const person = row.querySelector('.chk-participant').value;
    const input = row.querySelector('.participant-custom-input');
    return {
      quienDebe: person,
      monto: parseFloat(input.value) || 0
    };
  });
}
