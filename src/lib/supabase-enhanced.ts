import { supabase } from "@/integrations/supabase/client";

// Case Management Types
export interface Case {
  id: string;
  case_number: string;
  offense_type: string;
  status: 'open' | 'under_investigation' | 'closed' | 'archived';
  location: string;
  description?: string;
  notes?: string;
  lead_officer?: string;
  office_id?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

export interface Office {
  id: string;
  name: string;
  code: string;
  city: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface Tag {
  id: string;
  name: string;
  category?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'custody_change' | 'overdue_review' | 'suspicious_event' | 'case_update' | 'general';
  entity_type?: string;
  entity_id?: string;
  read: boolean;
  created_at: string;
}

// Case Management Functions
export const generateCaseNumber = async (): Promise<string> => {
  const { data, error } = await supabase.rpc('generate_case_number' as any);
  if (error) throw error;
  return data as string;
};

export const createCase = async (caseData: Omit<Case, 'id' | 'case_number' | 'created_at' | 'updated_at'>) => {
  const caseNumber = await generateCaseNumber();
  
  const { data, error } = await supabase
    .from('cases' as any)
    .insert({ ...caseData, case_number: caseNumber })
    .select()
    .single();

  if (error) throw error;
  
  // Log audit event
  await logAudit('CREATE', 'case', (data as any).id);
  
  return data as unknown as Case;
};

export const getAllCases = async () => {
  const { data, error } = await supabase
    .from('cases' as any)
    .select('*, offices(name, city), profiles!cases_lead_officer_fkey(full_name, badge_number)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getCaseById = async (id: string) => {
  const { data, error } = await supabase
    .from('cases' as any)
    .select('*, offices(name, city), profiles!cases_lead_officer_fkey(full_name, badge_number)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const updateCase = async (id: string, updates: Partial<Case>) => {
  const { data, error } = await supabase
    .from('cases' as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  
  await logAudit('UPDATE', 'case', id, updates);
  
  return data as unknown as Case;
};

export const getCaseEvidence = async (caseId: string): Promise<any[]> => {
  const query: any = supabase.from('evidence_bags');
  const { data, error } = await query
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Office Management
export const getAllOffices = async () => {
  const { data, error } = await supabase
    .from('offices' as any)
    .select('*')
    .order('name');

  if (error) throw error;
  return data as unknown as Office[];
};

// Tag Management
export const getAllTags = async () => {
  const { data, error } = await supabase
    .from('tags' as any)
    .select('*')
    .order('name');

  if (error) throw error;
  return data as unknown as Tag[];
};

export const createTag = async (name: string, category?: string) => {
  const { data, error } = await supabase
    .from('tags' as any)
    .insert({ name, category })
    .select()
    .single();

  if (error) throw error;
  return data as unknown as Tag;
};

export const addCaseTag = async (caseId: string, tagId: string) => {
  const { data, error } = await supabase
    .from('case_tags' as any)
    .insert({ case_id: caseId, tag_id: tagId })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const removeCaseTag = async (caseId: string, tagId: string) => {
  const { error } = await supabase
    .from('case_tags' as any)
    .delete()
    .eq('case_id', caseId)
    .eq('tag_id', tagId);

  if (error) throw error;
};

export const getCaseTags = async (caseId: string) => {
  const { data, error } = await supabase
    .from('case_tags' as any)
    .select('*, tags(*)')
    .eq('case_id', caseId);

  if (error) throw error;
  return data;
};

export const addEvidenceTag = async (bagId: string, tagId: string) => {
  const { data, error } = await supabase
    .from('evidence_tags' as any)
    .insert({ bag_id: bagId, tag_id: tagId })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getEvidenceTags = async (bagId: string) => {
  const { data, error } = await supabase
    .from('evidence_tags' as any)
    .select('*, tags(*)')
    .eq('bag_id', bagId);

  if (error) throw error;
  return data;
};

// Audit Logging
export const logAudit = async (
  action: string,
  entityType: string,
  entityId?: string,
  details?: any
) => {
  const { data, error } = await supabase.rpc('log_audit_event' as any, {
    p_action: action,
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_details: details
  });

  if (error) throw error;
  return data;
};

export const getAuditLogs = async (filters?: {
  entityType?: string;
  entityId?: string;
  userId?: string;
  limit?: number;
}) => {
  let query: any = supabase
    .from('audit_log' as any)
    .select('*, profiles!audit_log_user_id_fkey(full_name, badge_number)')
    .order('created_at', { ascending: false });

  if (filters?.entityType) {
    query = query.eq('entity_type', filters.entityType);
  }
  if (filters?.entityId) {
    query = query.eq('entity_id', filters.entityId);
  }
  if (filters?.userId) {
    query = query.eq('user_id', filters.userId);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Notifications
export const getUserNotifications = async () => {
  const { data, error } = await supabase
    .from('notifications' as any)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data as unknown as Notification[];
};

export const markNotificationAsRead = async (id: string) => {
  const { error } = await supabase
    .from('notifications' as any)
    .update({ read: true })
    .eq('id', id);

  if (error) throw error;
};

export const markAllNotificationsAsRead = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { error } = await supabase
    .from('notifications' as any)
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false);

  if (error) throw error;
};

// Digital Signatures
export const addDigitalSignature = async (
  custodyLogId: string,
  signatureData: string,
  signatureType: 'manual' | 'cryptographic'
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from('digital_signatures' as any)
    .insert({
      custody_log_id: custodyLogId,
      signer_id: user.id,
      signature_data: signatureData,
      signature_type: signatureType
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getCustodySignatures = async (custodyLogId: string) => {
  const { data, error } = await supabase
    .from('digital_signatures' as any)
    .select('*, profiles!digital_signatures_signer_id_fkey(full_name, badge_number)')
    .eq('custody_log_id', custodyLogId)
    .order('signed_at', { ascending: false });

  if (error) throw error;
  return data;
};

// File Hash Calculation
export const calculateFileHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

// Disposal Management
export const disposeEvidence = async (
  bagId: string,
  disposalMethod: 'released' | 'destroyed' | 'returned',
  witness: string,
  notes?: string,
  documentationUrl?: string
) => {
  const { data, error } = await supabase
    .from('evidence_bags')
    .update({
      disposal_method: disposalMethod,
      disposal_date: new Date().toISOString(),
      disposal_witness: witness,
      disposal_notes: notes,
      disposal_documentation_url: documentationUrl,
      current_status: 'archived'
    })
    .eq('id', bagId)
    .select()
    .single();

  if (error) throw error;
  
  await logAudit('DISPOSE', 'evidence_bag', bagId, { 
    method: disposalMethod, 
    witness 
  });
  
  return data;
};
