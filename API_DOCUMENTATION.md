# SFEP Evidence Tracking System - API Documentation

## Overview

The SFEP system uses Supabase (PostgreSQL) as the backend with Row-Level Security (RLS) for access control. All API operations are performed through the Supabase client library.

**Base URL**: Your Supabase project URL (configured via environment variables)

**Authentication**: JWT tokens (automatically managed by Supabase Auth)

---

## Authentication

### Sign Up

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword',
  options: {
    data: {
      full_name: 'John Doe',
      badge_number: 'BADGE-001'
    }
  }
});
```

### Sign In

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securepassword'
});
```

### Sign Out

```typescript
const { error } = await supabase.auth.signOut();
```

### Get Current Session

```typescript
const { data: { session } } = await supabase.auth.getSession();
```

---

## Evidence Bags

### Create Evidence Bag

```typescript
const { data, error } = await supabase
  .from('evidence_bags')
  .insert({
    bag_id: 'BAG-2025-0001', // Auto-generated
    type: 'physical',
    description: 'Found at crime scene',
    location: '123 Main St',
    date_collected: new Date().toISOString(),
    latitude: 37.7749,
    longitude: -122.4194,
    notes: 'Additional notes'
  })
  .select()
  .single();
```

**Required Role**: `collector` or `admin`

### Get Evidence Bags

```typescript
const { data, error } = await supabase
  .from('evidence_bags')
  .select(`
    *,
    profiles:initial_collector (full_name, badge_number)
  `)
  .order('created_at', { ascending: false });
```

### Get Evidence Bag by ID

```typescript
const { data, error } = await supabase
  .from('evidence_bags')
  .select(`
    *,
    profiles:initial_collector (full_name, badge_number),
    evidence_photos (*)
  `)
  .eq('id', bagId)
  .single();
```

### Update Evidence Status

```typescript
const { data, error } = await supabase
  .from('evidence_bags')
  .update({ current_status: 'in_lab' })
  .eq('id', bagId)
  .select()
  .single();
```

---

## Chain of Custody

### Add Custody Entry

```typescript
const { data, error } = await supabase
  .from('chain_of_custody_log')
  .insert({
    bag_id: bagId,
    action: 'transfer',
    location: 'Evidence Lab',
    notes: 'Transferred for analysis',
    latitude: 37.7749,
    longitude: -122.4194,
    digital_signature: signatureData // Optional
  })
  .select()
  .single();
```

### Get Custody Timeline

```typescript
const { data, error } = await supabase
  .from('chain_of_custody_log')
  .select(`
    *,
    profiles:performed_by (full_name, badge_number)
  `)
  .eq('bag_id', bagId)
  .order('timestamp', { ascending: true });
```

---

## Cases

### Create Case

```typescript
const { data, error } = await supabase
  .from('cases')
  .insert({
    case_number: 'CASE-2025-0001', // Auto-generated
    offense_type: 'Burglary',
    location: '123 Main St',
    description: 'Case description',
    lead_officer: userId,
    status: 'open'
  })
  .select()
  .single();
```

### Link Evidence to Case

```typescript
const { data, error } = await supabase
  .from('case_evidence')
  .insert({
    case_id: caseId,
    bag_id: bagId,
    notes: 'Evidence relevant to investigation',
    linked_by: userId
  })
  .select()
  .single();
```

### Get Case Details

```typescript
const { data, error } = await supabase
  .from('cases')
  .select(`
    *,
    profiles:lead_officer (full_name, badge_number),
    case_evidence (
      *,
      evidence_bags (*)
    )
  `)
  .eq('id', caseId)
  .single();
```

### Close Case

```typescript
const { data, error } = await supabase
  .from('cases')
  .update({
    is_closed: true,
    closed_at: new Date().toISOString(),
    closed_by: userId,
    closure_notes: 'Case resolved'
  })
  .eq('id', caseId)
  .select()
  .single();
```

---

## Photos & Files

### Upload Photo

```typescript
// 1. Upload file to storage
const { data: uploadData, error: uploadError } = await supabase
  .storage
  .from('evidence-photos')
  .upload(`${bagId}/${file.name}`, file);

// 2. Create photo record
const { data, error } = await supabase
  .from('evidence_photos')
  .insert({
    bag_id: bagId,
    photo_url: uploadData.path,
    file_hash: fileHash,
    file_size: file.size,
    uploaded_by: userId
  })
  .select()
  .single();
```

### Get Photo URL

```typescript
const { data } = supabase
  .storage
  .from('evidence-photos')
  .getPublicUrl(photoPath);
```

### Download Photo

```typescript
const { data, error } = await supabase
  .storage
  .from('evidence-photos')
  .download(photoPath);
```

---

## User Roles

### Check User Role

```typescript
const { data, error } = await supabase
  .rpc('has_role', {
    _user_id: userId,
    _role: 'admin'
  });
```

### Get User Roles

```typescript
const { data, error } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', userId);
```

### Assign Role (Admin only)

```typescript
const { data, error } = await supabase
  .from('user_roles')
  .insert({
    user_id: targetUserId,
    role: 'collector'
  })
  .select()
  .single();
```

---

## Disposal Requests

### Create Disposal Request

```typescript
const { data, error } = await supabase
  .from('disposal_requests')
  .insert({
    bag_id: bagId,
    disposal_type: 'destruction',
    reason: 'Evidence no longer needed',
    requested_by: userId
  })
  .select()
  .single();
```

### Approve Disposal (Admin only)

```typescript
const { data, error } = await supabase
  .from('disposal_requests')
  .update({
    status: 'approved',
    approved_by: adminId,
    approved_at: new Date().toISOString()
  })
  .eq('id', requestId)
  .select()
  .single();
```

---

## Audit Log

### Get Audit Log

```typescript
const { data, error } = await supabase
  .from('audit_log')
  .select(`
    *,
    profiles:user_id (full_name, badge_number)
  `)
  .order('created_at', { ascending: false })
  .limit(100);
```

### Create Audit Entry

```typescript
await supabase.rpc('log_audit_event', {
  p_action: 'evidence_created',
  p_entity_type: 'evidence_bag',
  p_entity_id: bagId,
  p_details: { description: 'Additional details' }
});
```

---

## Random Audits

### Create Random Audit

```typescript
const { data, error } = await supabase
  .from('audit_checks')
  .insert({
    audit_name: 'Monthly Audit - Jan 2025',
    created_by: userId,
    total_items: selectedBags.length,
    status: 'in_progress'
  })
  .select()
  .single();

// Create audit items
const items = selectedBags.map(bag => ({
  audit_id: auditId,
  bag_id: bag.id,
  expected_status: bag.current_status,
  expected_location: bag.location
}));

await supabase
  .from('audit_check_items')
  .insert(items);
```

### Mark Audit Item Checked

```typescript
const { data, error } = await supabase
  .from('audit_check_items')
  .update({
    checked_at: new Date().toISOString(),
    checked_by: userId,
    actual_status: actualStatus,
    actual_location: actualLocation,
    discrepancy: actualStatus !== expectedStatus,
    notes: 'Audit notes'
  })
  .eq('id', itemId)
  .select()
  .single();
```

---

## Database Functions

### Generate Bag ID

```typescript
const { data, error } = await supabase
  .rpc('generate_bag_id');
// Returns: "BAG-2025-0001"
```

### Generate Case Number

```typescript
const { data, error } = await supabase
  .rpc('generate_case_number');
// Returns: "CASE-2025-0001"
```

### Calculate File Hash

```typescript
import { calculateFileHash } from '@/lib/file-hash';

const hash = await calculateFileHash(file);
// Returns: SHA-256 hash string
```

---

## Error Handling

All Supabase operations return `{ data, error }`. Always check for errors:

```typescript
const { data, error } = await supabase
  .from('evidence_bags')
  .select();

if (error) {
  console.error('Error:', error);
  // Handle error appropriately
  return;
}

// Use data
console.log(data);
```

### Common Error Codes

- `PGRST116`: Row Level Security policy violation
- `23505`: Unique constraint violation
- `23503`: Foreign key violation
- `42P01`: Table does not exist

---

## Rate Limits

- **Authentication**: 30 requests per hour per IP
- **API Calls**: 100 requests per second per project
- **Storage**: 50 MB per file, 1 GB total in free tier

---

## Security

### Row Level Security (RLS)

All tables have RLS enabled. Policies enforce:

1. Users can only view evidence they collected or transferred
2. Admins can view/modify all data
3. Audit logs are immutable (no updates/deletes)
4. Chain of custody records are immutable

### Authentication

- JWT tokens expire after 1 hour
- Refresh tokens valid for 7 days
- Session timeout: 30 minutes of inactivity

---

## Webhooks

Configure webhooks in Supabase dashboard for real-time notifications:

- `evidence_bags` inserts
- `chain_of_custody_log` inserts
- `disposal_requests` status changes

---

## Postman Collection

Import the Postman collection from `/postman/SFEP-API.postman_collection.json` for testing.

---

## Support

For API support:
- Email: api-support@sfep.example.com
- Documentation: https://docs.sfep.example.com
