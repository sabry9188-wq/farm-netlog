// Hand-written types mirroring supabase/migrations/*.sql.
// If the schema changes, update this file to match (or regenerate with
// `npx supabase gen types typescript` once the Supabase CLI is linked).

export type UserRole = "admin" | "storekeeper" | "supervisor" | "viewer";
export type UserStatus = "active" | "inactive";
export type NetCategory = "MAIN_NET" | "GUARD_NET" | "TOP_NET";
export type AlertColor = "green" | "yellow" | "orange" | "red";
export type CageStatusColor = AlertColor | "grey";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  can_approve_disposal: boolean;
  avatar_url: string | null;
  created_at: string;
}

export interface Site {
  id: string;
  site_name: string;
  site_code: string;
  cage_diameter_m: number;
  cage_depth_m: number;
  created_at: string;
}

export interface Cage {
  id: string;
  cage_code: string;
  site_id: string;
  diameter_m: number;
  depth_m: number;
  species: string | null;
  avg_fish_weight_g: number | null;
  stocking_date: string | null;
  production_stage: string | null;
  status: string;
  current_main_net_id: string | null;
  current_guard_net_id: string | null;
  current_top_net_id: string | null;
  created_at: string;
}

export interface LookupRow {
  id: string;
  label: string;
  sort_order: number;
  is_active: boolean;
}

export interface MeshSizeRow extends LookupRow {
  site_id: string | null;
}

export interface NetStatusRow extends LookupRow {
  color: string;
}

export interface SystemSetting {
  key: string;
  value: string;
  description: string | null;
}

export interface StockThreshold {
  id: string;
  site_id: string;
  category: NetCategory;
  mesh_size: string;
  minimum_qty: number;
}

export interface Net {
  id: string;
  net_code: string;
  category: NetCategory;
  site_id: string;
  mesh_size: string | null;
  diameter_m: number | null;
  depth_m: number | null;
  length_m: number | null;
  width_m: number | null;
  material: string | null;
  manufacturer: string | null;
  supplier: string | null;
  purchase_date: string | null;
  purchase_cost: number | null;
  is_new: boolean;
  condition: string;
  status: string;
  current_location: string;
  current_cage_id: string | null;
  remarks: string | null;
  is_demo: boolean;
  created_by: string | null;
  created_at: string;
}

export interface NetInstallation {
  id: string;
  net_id: string;
  cage_id: string;
  installation_date: string;
  expected_change_date: string;
  removal_date: string | null;
  removal_reason: string | null;
  condition_at_installation: string | null;
  condition_at_removal: string | null;
  destination: string | null;
  installed_by: string | null;
  removed_by: string | null;
  remarks: string | null;
  created_at: string;
}

export interface NetMovement {
  id: string;
  net_id: string;
  movement_date: string;
  from_location: string | null;
  to_location: string;
  from_status: string | null;
  to_status: string;
  cage_id: string | null;
  reason: string | null;
  performed_by: string | null;
  remarks: string | null;
  created_at: string;
}

export interface CleaningRecord {
  id: string;
  net_id: string;
  start_date: string;
  completion_date: string | null;
  method: string | null;
  condition_before: string | null;
  condition_after: string | null;
  performed_by: string | null;
  remarks: string | null;
  created_at: string;
}

export interface RepairRecord {
  id: string;
  net_id: string;
  damage_description: string | null;
  repair_start: string;
  repair_completion: string | null;
  repair_type: string | null;
  cost: number | null;
  performed_by: string | null;
  condition_before: string | null;
  condition_after: string | null;
  outcome: string | null;
  remarks: string | null;
  created_at: string;
}

export interface DisposalRecord {
  id: string;
  net_id: string;
  disposal_date: string;
  reason: string | null;
  condition: string | null;
  method: string | null;
  approved_by: string | null;
  performed_by: string | null;
  remarks: string | null;
  created_at: string;
}

export interface LostRecord {
  id: string;
  net_id: string;
  date_lost: string;
  last_known_location: string | null;
  reason: string | null;
  reported_by: string | null;
  approved_by: string | null;
  remarks: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: unknown;
  new_value: unknown;
  created_at: string;
}

export interface VNetAlertStatus {
  installation_id: string;
  net_id: string;
  net_code: string;
  category: NetCategory;
  mesh_size: string | null;
  site_id: string;
  site_code: string;
  site_name: string;
  cage_id: string;
  cage_code: string;
  installation_date: string;
  expected_change_date: string;
  days_in_water: number;
  days_remaining: number;
  alert_color: AlertColor;
}

export interface VCageCurrentState {
  cage_id: string;
  cage_code: string;
  site_id: string;
  site_code: string;
  site_name: string;
  species: string | null;
  avg_fish_weight_g: number | null;
  stocking_date: string | null;
  production_stage: string | null;
  main_net_id: string | null;
  main_net_code: string | null;
  main_net_mesh: string | null;
  main_net_condition: string | null;
  main_net_installation_date: string | null;
  main_net_expected_change_date: string | null;
  main_net_days_remaining: number | null;
  main_net_alert_color: AlertColor | null;
  guard_net_id: string | null;
  guard_net_code: string | null;
  guard_net_condition: string | null;
  top_net_id: string | null;
  top_net_code: string | null;
  top_net_condition: string | null;
  cage_status_color: CageStatusColor;
}

export interface VStockSummary {
  site_id: string;
  site_code: string;
  category: NetCategory;
  mesh_size: string | null;
  status: string;
  qty: number;
}

export interface VLowStock {
  site_id: string;
  site_code: string;
  category: NetCategory;
  mesh_size: string;
  minimum_qty: number;
  current_qty: number;
}

export interface VCagesMissingNet {
  cage_id: string;
  cage_code: string;
  site_id: string;
  site_code: string;
  missing_main_net: boolean;
  missing_guard_net: boolean;
  missing_top_net: boolean;
}

export interface VNetLifecycleStats {
  net_id: string;
  net_code: string;
  total_cage_uses: number;
  total_cage_days: number;
  cleaning_cycles: number;
  repair_cycles: number;
  total_movements: number;
  total_repair_cost: number;
  first_use_date: string | null;
  last_use_date: string | null;
  net_age_days: number | null;
}

// Minimal Database shape — enough structural typing for the Supabase JS
// client without pulling in full generated codegen.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
