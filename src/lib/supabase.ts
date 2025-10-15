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
  created_at: string;
}

export const getUserRoles = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (error) throw error;
  return data?.map(r => r.role) || [];
};

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
  const { data, error } = await supabase
    .from('chain_of_custody_log')
    .select(`
      *,
      performed_by_profile:profiles!chain_of_custody_log_performed_by_fkey(full_name, badge_number)
    `)
    .eq('bag_id', bagId)
    .order('timestamp', { ascending: true });

  if (error) throw error;
  return data;
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
  const { data, error } = await supabase
    .from('evidence_bags')
    .select(`
      *,
      collector:profiles!evidence_bags_initial_collector_fkey(full_name, badge_number)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};