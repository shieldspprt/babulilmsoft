import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'user';

export const useUserRole = (userId: string | undefined) => {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isSchoolOwner, setIsSchoolOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRoles([]);
      setIsSchoolOwner(false);
      setLoading(false);
      return;
    }

    const fetchRoles = async () => {
      // Check traditional user_roles table
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
      }

      // Check if user owns a school
      const { data: ownedSchools, error: schoolsError } = await supabase
        .from('schools')
        .select('id')
        .eq('owner_id', userId)
        .limit(1);

      if (schoolsError) {
        console.error('Error fetching owned schools:', schoolsError);
      }

      // Check if user has membership in user_schools (from trigger)
      const { data: schoolMemberships, error: membershipError } = await supabase
        .from('user_schools')
        .select('role')
        .eq('user_id', userId)
        .limit(1);

      if (membershipError) {
        console.error('Error fetching school memberships:', membershipError);
      }

      const hasOwnedSchool = (ownedSchools?.length || 0) > 0;
      const hasSchoolMembership = (schoolMemberships?.length || 0) > 0;
      setIsSchoolOwner(hasOwnedSchool);

      // Combine traditional roles with school ownership/membership
      const fetchedRoles = userRoles?.map(r => r.role as AppRole) || [];
      
      // If user owns a school or has membership, treat them as user
      if (hasOwnedSchool || hasSchoolMembership) {
        if (!fetchedRoles.includes('admin')) {
          fetchedRoles.push('admin');
        }
        if (!fetchedRoles.includes('user')) {
          fetchedRoles.push('user');
        }
      }

      setRoles(fetchedRoles);
      setLoading(false);
    };

    fetchRoles();
  }, [userId]);

  const hasRole = (role: AppRole) => roles.includes(role);
  const isAdmin = hasRole('admin') || isSchoolOwner;
  const isUser = hasRole('user') || isSchoolOwner || roles.length > 0;
  const isAdminOrUser = isAdmin || isUser;

  return {
    roles,
    loading,
    hasRole,
    isAdmin,
    isUser,
    isAdminOrUser,
    isSchoolOwner,
  };
};
