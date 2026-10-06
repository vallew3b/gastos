/**
 * Data Storage & Abstraction Layer for "Monse Cuentas"
 * 
 * NOTA DE ARQUITECTURA:
 * Actualmente utiliza LocalStorage para persistencia local.
 * Toda la interacción de datos pasa por estas funciones asíncronas para facilitar 
 * la transición futura a un Backend (Node.js, Firebase, Supabase, PHP, etc.)
 */

const STORAGE_KEYS = {
  EXPENSES: 'monse_cuentas_expenses',
  PAYMENTS: 'monse_cuentas_payment_history',
  PEOPLE: 'monse_cuentas_people'
};

// Seed initial demo data if empty
function initializeDemoData() {
  const existing = localStorage.getItem(STORAGE_KEYS.EXPENSES);
  if (!existing) {
    const today = new Date();
    
    // Helper to format date offset
    const getOffsetDateStr = (daysOffset) => {
      const d = new Date(today);
      d.setDate(d.getDate() + daysOffset);
      return d.toISOString().split('T')[0];
    };

    const initialExpenses = [
      {
        id: 'exp-1',
        monto: 850.50,
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
        concepto: 'Cena de fin de semana',
        quienDebe: 'Ana',
        fecha: getOffsetDateStr(-8),
        estado: 'pagado',
        categoria: 'Salidas',
        createdAt: new Date().toISOString()
      }
    ];

    const initialPeople = ['Monse', 'Carlos', 'Ana', 'Luis'];

    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(initialExpenses));
    localStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(initialPeople));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify([]));
  }
}

// Data Service API wrapper
export const dbService = {
  // Inicialización
  async init() {
    initializeDemoData();
  },

  // OBENER GASTOS
  async getExpenses() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error al leer gastos', e);
      return [];
    }
  },

  // CREAR GASTO INDIVIDUAL
  async addExpense(expenseData) {
    const expenses = await this.getExpenses();
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

    expenses.unshift(newExpense);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    
    // Registrar persona si es nueva
    await this.addPerson(newExpense.quienDebe);

    return newExpense;
  },

  // CREAR GASTO DIVIDIDO ENTRE VARIAS PERSONAS
  async addSplitExpenses(splitData) {
    const expenses = await this.getExpenses();
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
      
      expenses.unshift(newExpense);
      createdExpenses.push(newExpense);
      await this.addPerson(participant.quienDebe);
    }

    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    return createdExpenses;
  },

  // REGISTRAR UN ABONO / PAGO PARCIAL
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

      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));

      // Registrar transacción de abono en Historial
      const history = await this.getPaymentHistory();
      history.unshift({
        id: 'pay-abono-' + Date.now(),
        weekLabel: `Abono: ${item.concepto}`,
        totalMonto: amount,
        desglose: [{ persona: item.quienDebe, monto: amount }],
        gastosIds: [expenseId],
        esAbono: true,
        fechaLiquidacion: new Date().toISOString()
      });
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(history));

      return item;
    }
    return null;
  },

  // ACTUALIZAR GASTO
  async updateExpense(id, updatedFields) {
    const expenses = await this.getExpenses();
    const index = expenses.findIndex(e => e.id === id);
    if (index !== -1) {
      expenses[index] = { ...expenses[index], ...updatedFields };
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
      return expenses[index];
    }
    return null;
  },

  // ELIMINAR GASTO
  async deleteExpense(id) {
    let expenses = await this.getExpenses();
    expenses = expenses.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    return true;
  },

  // MARCAR GASTO INDIVIDUAL COMO PAGADO / PENDIENTE
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
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
      return item;
    }
    return null;
  },

  // MARCAR SEMANA COMPLETA COMO PAGADA Y GUARDAR EN HISTORIAL
  async payWeek(weekId, weekLabel, expenseIds, breakdown, totalAmount) {
    const expenses = await this.getExpenses();

    // Actualizar estado de los gastos de esa semana
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
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updatedExpenses));

    // Registrar en Historial de Pagos
    const history = await this.getPaymentHistory();
    const newPaymentRecord = {
      id: 'pay-' + Date.now(),
      weekId,
      weekLabel,
      totalMonto: totalAmount,
      desglose: breakdown, // arreglo de { persona, monto, itemsCount }
      gastosIds: expenseIds,
      fechaLiquidacion: new Date().toISOString()
    };

    history.unshift(newPaymentRecord);
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(history));

    return newPaymentRecord;
  },

  // OBTENER HISTORIAL DE PAGOS
  async getPaymentHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error leyendo historial', e);
      return [];
    }
  },

  // DESHACER PAGO EN HISTORIAL
  async undoPayment(historyId) {
    const history = await this.getPaymentHistory();
    const record = history.find(h => h.id === historyId);
    
    if (record) {
      // Revertir estado de los gastos a pendiente
      const expenses = await this.getExpenses();
      const updatedExpenses = expenses.map(exp => {
        if (record.gastosIds.includes(exp.id)) {
          return { ...exp, estado: 'pendiente', fechaPago: null };
        }
        return exp;
      });
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updatedExpenses));

      // Quitar del historial
      const newHistory = history.filter(h => h.id !== historyId);
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(newHistory));
      return true;
    }
    return false;
  },

  // PERSONAS
  async getPeople() {
    const data = localStorage.getItem(STORAGE_KEYS.PEOPLE);
    return data ? JSON.parse(data) : ['Monse', 'Carlos', 'Ana'];
  },

  async addPerson(name) {
    if (!name) return;
    const people = await this.getPeople();
    const formatted = name.trim();
    if (formatted && !people.includes(formatted)) {
      people.push(formatted);
      localStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(people));
    }
  },

  // REINICIAR / LIMPIAR DATOS DE PRUEBA
  async resetData() {
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
    localStorage.removeItem(STORAGE_KEYS.PEOPLE);
    initializeDemoData();
  }
};
