import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'collector' | 'transport' | 'lab_tech' | 'admin';
export type EvidenceType = 'weapon' | 'clothing' | 'biological_sample' | 'documents' | 'electronics' | 'other';
export type EvidenceStatus = 'collected' | 'in_transport' | 'in_lab' | 'analyzed' | 'archived';
export type ActionType = 'collected' | 'packed' | 'transferred' | 'received' | 'analyzed' | 'archived';

export interface Profile {
  id: string;
  full_name: string;
  badge_number?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface EvidenceBag {
  id: string;
  bag_id: string;
  type: EvidenceType;
  description: string;
  initial_collector: string;
  date_collected: string;
  location: string;
  notes?: string;
  current_status: EvidenceStatus;
  qr_data?: string;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
  updated_at: string;
}

export interface ChainOfCustodyLog {
  id: string;
  bag_id: string;
  action: ActionType;
  performed_by: string;
  timestamp: string;
  location: string;
  notes?: string;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
}

/**
 * WARNING: This function is for UI DISPLAY ONLY. NEVER use for authorization!
 * 
 * This client-side function can be bypassed by modifying browser code.
 * All authorization MUST be enforced server-side via RLS policies.
 * 
 * Use this ONLY for:
 * - Showing/hiding UI elements for better UX
 * - Displaying user role badges
 * - Client-side navigation hints
 * 
 * NEVER use for:
 * - Gating access to features or data
 * - Authorization decisions
 * - Security enforcement
 */
export const getUserRoles = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (error) throw error;
  return data?.map(r => r.role) || [];
};

/**
 * WARNING: This function is for UI DISPLAY ONLY. NEVER use for authorization!
 * 
 * See getUserRoles() documentation above for security warnings.
 * Always rely on RLS policies for actual security enforcement.
 */
export const hasRole = async (userId: string, role: UserRole): Promise<boolean> => {
  const roles = await getUserRoles(userId);
  return roles.includes(role);
};

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const generateBagId = async (): Promise<string> => {
  const { data, error } = await supabase.rpc('generate_bag_id');
  if (error) throw error;
  return data;
};

export const createEvidenceBag = async (bag: Omit<EvidenceBag, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('evidence_bags')
    .insert(bag)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const addChainOfCustodyEntry = async (entry: Omit<ChainOfCustodyLog, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('chain_of_custody_log')
    .insert(entry)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getEvidenceBag = async (bagId: string) => {
  const { data, error } = await supabase
    .from('evidence_bags')
    .select('*')
    .eq('bag_id', bagId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getChainOfCustody = async (bagId: string) => {
  const { data: logs, error } = await supabase
    .from('chain_of_custody_log')
    .select('*')
    .eq('bag_id', bagId)
    .order('timestamp', { ascending: true });

  if (error) throw error;
  
  // Fetch performer profiles separately
  if (logs && logs.length > 0) {
    const userIds = [...new Set(logs.map(log => log.performed_by))];
    const { data: profiles } = await supabase
      .from('profiles_public')
      .select('*')
      .in('id', userIds);
    
    // Map profiles to logs
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    return logs.map(log => ({
      ...log,
      performed_by_profile: profileMap.get(log.performed_by)
    }));
  }
  
  return logs;
};

export const updateEvidenceBagStatus = async (id: string, status: EvidenceStatus) => {
  const { data, error } = await supabase
    .from('evidence_bags')
    .update({ current_status: status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getAllEvidenceBags = async () => {
  const { data: bags, error } = await supabase
    .from('evidence_bags')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Fetch collector profiles separately
  if (bags && bags.length > 0) {
    const collectorIds = [...new Set(bags.map(bag => bag.initial_collector))];
    const { data: collectors } = await supabase
      .from('profiles_public')
      .select('*')
      .in('id', collectorIds);
    
    // Map collectors to bags
    const collectorMap = new Map(collectors?.map(c => [c.id, c]) || []);
    return bags.map(bag => ({
      ...bag,
      collector: collectorMap.get(bag.initial_collector)
    }));
  }
  
  return bags;
};

export interface EvidencePhoto {
  id: string;
  bag_id: string;
  photo_url: string;
  uploaded_by: string;
  uploaded_at: string;
  notes?: string;
  created_at: string;
}

export const uploadEvidencePhoto = async (bagId: string, file: File, notes?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${bagId}/${fileName}`;

  // Upload file to storage
  const { error: uploadError } = await supabase.storage
    .from('evidence-photos')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('evidence-photos')
    .getPublicUrl(filePath);

  // Save metadata to database
  const { data, error } = await supabase
    .from('evidence_photos')
    .insert({
      bag_id: bagId,
      photo_url: publicUrl,
      uploaded_by: user.id,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getEvidencePhotos = async (bagId: string) => {
  const { data, error } = await supabase
    .from('evidence_photos')
    .select('*')
    .eq('bag_id', bagId)
    .order('uploaded_at', { ascending: false });

  if (error) throw error;
  return data;
};