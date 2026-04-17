import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';

export type Parent = {
  id: string;
  school_id: string;
  first_name: string;
  last_name: string;
  relation?: 'Father' | 'Mother' | 'Guardian';
  gender?: string;
  cnic: string;
  contact: string;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Class = { id: string; name: string; monthly_fee: number; };

export const useParents = (schoolId: string, showFlash: (msg: string) => void) => {
  const [records, setRecords] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Class[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [monthlyTotals, setMonthlyTotals] = useState<Record<string, number>>({});
  const [discountTotals, setDiscountTotals] = useState<Record<string, number>>({});
  const [globalStats, setGlobalStats] = useState({ totalChildren: 0, totalNet: 0, totalScholarships: 0 });

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const [{ data: parents }, { data: students }] = await Promise.all([
        supabase.from('parents').select('id, school_id, first_name, last_name, cnic, contact, address, notes, created_at, updated_at').eq('school_id', schoolId).eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('students')
          .select('id, parent_id, monthly_fee, discount_type, discount_value, current_monthly_fee')
          .eq('school_id', schoolId)
          .eq('active', true)
      ]);
      
      if (!parents) {
        setRecords([]);
        setLoading(false);
        return;
      }
      
      setRecords(parents);
      
      const counts: Record<string, number> = {};
      const mTotals: Record<string, number> = {};
      const dTotals: Record<string, number> = {};
      
      let gChildren = 0;
      let gNet = 0;
      let gScholarships = 0;

      students?.forEach(s => {
        counts[s.parent_id] = (counts[s.parent_id] || 0) + 1;
        const netFee = Number(s.current_monthly_fee) || 0;
        const grossFee = Number(s.monthly_fee) || netFee;
        const discount = grossFee - netFee;
        
        mTotals[s.parent_id] = (mTotals[s.parent_id] || 0) + netFee;
        dTotals[s.parent_id] = (dTotals[s.parent_id] || 0) + discount;

        gChildren++;
        gNet += netFee;
        gScholarships += discount;
      });

      setStudentCounts(counts);
      setMonthlyTotals(mTotals);
      setDiscountTotals(dTotals);
      setGlobalStats({ totalChildren: gChildren, totalNet: gNet, totalScholarships: gScholarships });
    } catch (err: unknown) {
      showFlash('Error loading parents: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }, [schoolId, showFlash]);

  const loadClasses = useCallback(async () => {
    if (!schoolId) return;
    try {
      const { data } = await supabase.from('classes').select('id, name, monthly_fee').eq('school_id', schoolId).eq('active', true).order('name');
      setClasses(data || []);
    } catch (err: unknown) {
      showFlash('Error loading classes: ' + (err instanceof Error ? err.message : String(err)));
      setClasses([]);
    }
  }, [schoolId, showFlash]);

  useEffect(() => { load(); }, [load]);

  const parentStats = useMemo(() => {
    return { 
      totalFamilies: records.length, 
      totalChildren: globalStats.totalChildren, 
      totalPotential: globalStats.totalNet,
      totalScholarships: globalStats.totalScholarships,
      fathers: 0,
      mothers: 0,
      guardians: 0
    };
  }, [records, globalStats]);

  return {
    records,
    loading,
    classes,
    studentCounts,
    monthlyTotals,
    discountTotals,
    globalStats,
    parentStats,
    load,
    loadClasses
  };
};
