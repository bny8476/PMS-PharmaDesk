import { describe, it, expect, beforeEach } from 'vitest';
import { usePOSStore } from '../usePOSStore';

describe('usePOSStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    usePOSStore.getState().resetForm();
  });

  it('should initialize with an empty row', () => {
    const { rows } = usePOSStore.getState();
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBeDefined();
    expect(rows[0].stockId).toBeNull();
    expect(rows[0].qty).toBe('');
  });

  it('should add a new empty row', () => {
    const store = usePOSStore.getState();
    store.addRow();
    const newRows = usePOSStore.getState().rows;
    expect(newRows).toHaveLength(2);
  });

  it('should remove a row and update totals', () => {
    const store = usePOSStore.getState();
    store.addRow(); // Now we have 2 rows
    
    // Simulate updating the first row with mock stock
    const mockStock = {
      id: 10,
      sellingRate: 100,
      batchNo: 'B1',
      quantityAvailable: 50,
      medicine: {
        code: 'PAR500',
        name: 'Paracetamol',
        uom: 'TAB',
        taxPercent: 10
      }
    };
    
    usePOSStore.getState().selectStock(0, mockStock);
    usePOSStore.getState().updateQty(0, '1');
    
    let state = usePOSStore.getState();
    expect(state.rows[0].amount).toBeGreaterThan(0);
    
    // Remove the row
    usePOSStore.getState().removeRow(0);
    
    state = usePOSStore.getState();
    expect(state.rows).toHaveLength(1);
  });

  it('should reset form to initial state', () => {
    usePOSStore.getState().addRow();
    usePOSStore.getState().setField('patientName', 'John Doe');
    usePOSStore.getState().setField('doctor', 'Dr. Smith');
    usePOSStore.getState().setField('paymentType', 'Card');
    
    let state = usePOSStore.getState();
    expect(state.rows).toHaveLength(2);
    expect(state.patientName).toBe('John Doe');
    
    usePOSStore.getState().resetForm();
    
    state = usePOSStore.getState();
    expect(state.rows).toHaveLength(1);
    expect(state.patientName).toBe('Walk-in');
    expect(state.doctor).toBe('');
    expect(state.paymentType).toBe('Cash');
  });
});
