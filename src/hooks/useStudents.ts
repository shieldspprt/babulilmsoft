import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';

export type Student = {
  id: string;
  school_id: string;
  first_name: string;
  last_name: string;
  gender?: 'Boy' | 'Girl';
  cnic: string;
  date_of_birth: string | null;
  date_of_admission: string | null;
  admission_class_id: string;
  current_class_id: string;
  monthly_fee: number;
  current_monthly_fee: number;
  discount_type: string | null;
  discount_value: number | null;
  active: boolean;
  parent_id: string;
};

export type Class = { id: string; name: string; monthly_fee: number; active: boolean; };
export type Parent = { id: string; first_name: string; last_name: string; };

export const useStudents = (schoolId: string, showFlash: (msg: string) => void) => {
  const [students, setStudents]       = useState<Student[]>([]);
  const [classes, setClasses]         = useState<Class[]>([]);
  const [parents, setParents]         = useState<Parent[]>([]);
  const [loading, setLoading]         = useState(true);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const [
        { data: sData, error: sErr },
        { data: cData, error: cErr },
        { data: pData, error: pErr },
      ] = await Promise.all([
        supabase.from('students').select('*').eq('school_id', schoolId).order('first_name'),
        supabase.from('classes').select('id, name, monthly_fee, active').eq('school_id', schoolId).eq('active', true).order('name'),
        supabase.from('parents').select('id, first_name, last_name').eq('school_id', schoolId).eq('is_active', true).order('first_name'),
      ]);

      if (sErr) throw sErr;
      if (cErr) throw cErr;
      if (pErr) throw pErr;

      setStudents(sData || []);
      setClasses(cData || []);
      setParents(pData || []);
    } catch (err: unknown) {
      showFlash('Error loading student data: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }, [schoolId, showFlash]);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const active = students.filter(s => s.active);
    
    const sysRevenue = active.reduce((sum, s) => sum + (Number(s.current_monthly_fee) || 0), 0);

    const manRevenue = active.reduce((sum, s) => {
        const final = s.discount_type && s.discount_value !== null
          ? (s.discount_type === 'percentage' 
              ? Math.round(s.monthly_fee * (100 - (s.discount_value ?? 0)) / 100) 
              : s.monthly_fee - (s.discount_value ?? 0))
          : s.monthly_fee;
        return sum + Math.max(0, final);
    }, 0);

    const scholarshipCount = active.filter(s => (Number(s.current_monthly_fee) || 0) === 0).length;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const newEnrollments = active.filter(s => s.date_of_admission && s.date_of_admission.startsWith(currentMonth)).length;

    const boys = active.filter(s => s.gender === 'Boy').length;
    const girls = active.filter(s => s.gender === 'Girl').length;

    return {
      activeCount: active.length,
      sysRevenue,
      manRevenue,
      revenueMismatch: sysRevenue !== manRevenue,
      scholarshipCount,
      newEnrollments,
      boys,
      girls
    };
  }, [students]);

  return {
    students,
    classes,
    parents,
    loading,
    stats,
    load,
    setStudents
  };
};
