-- ============================================================================
-- McB Rentals — Phase 1: Foundation, Security (RLS) & Operational Schema
-- Non-destructive migration: preserves all existing inv_products, invoices,
-- users, studio_requests, and client-ids records.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. Staff Profiles & Role-Based Access (Front Desk, Operations, Admin)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.staff_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('front_desk', 'operations', 'admin')),
  employee_code_hash text UNIQUE, -- hashed 4-digit PIN for Operations & protected actions
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Helper function: check current authenticated user's staff role
CREATE OR REPLACE FUNCTION public.get_staff_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role
  FROM public.staff_profiles
  WHERE id = auth.uid() AND is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_profiles
    WHERE id = auth.uid() AND is_active = true
  );
$$;

-- ----------------------------------------------------------------------------
-- 2. Equipment Stock State (Fixes manual math errors in 22-page Stock PDF)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.equipment_stock_state (
  product_id text PRIMARY KEY, -- matches inv_products.id (e.g. inv-mr5isr5b-79l7u)
  total_owned integer NOT NULL DEFAULT 0 CHECK (total_owned >= 0),
  faulty_count integer NOT NULL DEFAULT 0 CHECK (faulty_count >= 0),
  retired_count integer NOT NULL DEFAULT 0 CHECK (retired_count >= 0),
  in_house_count integer NOT NULL DEFAULT 0 CHECK (in_house_count >= 0),
  packed_count integer NOT NULL DEFAULT 0 CHECK (packed_count >= 0),
  fault_notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.staff_profiles(id)
);

-- ----------------------------------------------------------------------------
-- 3. Client Flags & Balances (Replaces ❌❌❌❌, Dont Rent, manual owe notes)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_account_flags (
  user_id text PRIMARY KEY,
  flag_status text NOT NULL DEFAULT 'ok' CHECK (flag_status IN ('ok', 'needs_registration', 'do_not_rent', 'vip_loyal')),
  credit_balance_ghs numeric(10,2) NOT NULL DEFAULT 0,
  internal_note text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.staff_profiles(id)
);

-- ----------------------------------------------------------------------------
-- 4. Unified Rental Orders (Replaces 237-page Booking List & multi-day copy-paste)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rental_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code text UNIQUE NOT NULL, -- e.g. MCB-2026-0001
  client_user_id text,
  client_name text NOT NULL,
  client_phone text NOT NULL,
  client_email text,
  pickup_date date NOT NULL,
  return_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending_payment' CHECK (
    status IN (
      'pending_payment', 'paid', 'confirmed', 'packed',
      'out', 'returned', 'overdue', 'cancelled', 'deleted'
    )
  ),
  payment_mode text CHECK (payment_mode IN ('momo', 'cash', 'hubtel', 'studio_comp')),
  payment_status text NOT NULL DEFAULT 'unpaid' CHECK (
    payment_status IN ('unpaid', 'partial', 'paid', 'confirmed')
  ),
  payment_reference text,
  subtotal_ghs numeric(10,2) NOT NULL DEFAULT 0,
  amount_paid_ghs numeric(10,2) NOT NULL DEFAULT 0,
  balance_due_ghs numeric(10,2) NOT NULL DEFAULT 0,
  studio_code text NOT NULL DEFAULT 'none' CHECK (
    studio_code IN ('none', 'studio_01', 'studio_02', 'studio_03', 'studio_04')
  ),
  return_routing_note text, -- e.g. "Send 24-70GM to CEO office upon return"
  is_prepacked boolean NOT NULL DEFAULT false,
  missing_from_bag jsonb NOT NULL DEFAULT '[]'::jsonb,
  read_only_token uuid NOT NULL DEFAULT gen_random_uuid(),
  -- 4-column staff attribution
  booked_by uuid REFERENCES public.staff_profiles(id),
  booked_by_name text,
  pickup_by uuid REFERENCES public.staff_profiles(id),
  pickup_by_name text,
  return_by uuid REFERENCES public.staff_profiles(id),
  return_by_name text,
  confirmed_by uuid REFERENCES public.staff_profiles(id),
  confirmed_by_name text,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (return_date >= pickup_date)
);

CREATE TABLE IF NOT EXISTS public.rental_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.rental_orders(id) ON DELETE CASCADE,
  product_id text NOT NULL, -- matches inv_products.id
  product_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  daily_rate_ghs numeric(10,2) NOT NULL DEFAULT 0,
  line_total_ghs numeric(10,2) NOT NULL DEFAULT 0,
  is_packed boolean NOT NULL DEFAULT false,
  is_missing_from_bag boolean NOT NULL DEFAULT false
);

-- Live auto-calculated stock view
CREATE OR REPLACE VIEW public.v_live_equipment_stock AS
SELECT
  s.product_id,
  s.total_owned,
  COALESCE(active.out_qty, 0)::integer AS out_count,
  s.packed_count,
  s.in_house_count,
  s.faulty_count,
  s.retired_count,
  GREATEST(
    0,
    s.total_owned
    - COALESCE(active.out_qty, 0)::integer
    - s.packed_count
    - s.in_house_count
    - s.faulty_count
    - s.retired_count
  ) AS available_count,
  s.fault_notes,
  s.updated_at
FROM public.equipment_stock_state s
LEFT JOIN (
  SELECT
    i.product_id,
    SUM(i.quantity) AS out_qty
  FROM public.rental_order_items i
  JOIN public.rental_orders o ON o.id = i.order_id
  WHERE o.status IN ('out', 'overdue')
  GROUP BY i.product_id
) active ON active.product_id = s.product_id;

-- ----------------------------------------------------------------------------
-- 5. Pickup & Return Inspection Checklists + Read-Only Evidence
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inspection_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.rental_orders(id) ON DELETE CASCADE,
  inspection_type text NOT NULL CHECK (inspection_type IN ('pickup', 'return')),
  accessory_counts jsonb NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"batteries": 3, "chargers": 1}
  photo_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  condition_notes text,
  fault_reported boolean NOT NULL DEFAULT false,
  client_signature_data text,
  staff_id uuid REFERENCES public.staff_profiles(id),
  staff_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 6. Audit Log & WhatsApp/Notification Queue (Fixes 3-device WhatsApp limit)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.rental_orders(id) ON DELETE SET NULL,
  order_code text,
  actor_staff_id uuid REFERENCES public.staff_profiles(id),
  actor_name text NOT NULL,
  action text NOT NULL, -- 'confirm_payment', 'protected_delete', 'status_change', 'fault_logged'
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.whatsapp_dispatch_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.rental_orders(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  client_phone text NOT NULL,
  message_type text NOT NULL CHECK (message_type IN ('pickup_receipt', 'return_receipt', 'invoice')),
  receipt_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'sms_fallback', 'emailed')),
  created_by_name text,
  sent_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

-- ----------------------------------------------------------------------------
-- 7. Promos & Flyers + Customer Star Ratings
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.promos_flyers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text NOT NULL,
  cta_link text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.rental_orders(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 8. Secure RPCs: Employee PIN Verification, Payment Confirm & Protected Delete
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_employee_pin(pin_input text)
RETURNS TABLE (staff_id uuid, full_name text, role text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Unauthorized: staff session required';
  END IF;

  RETURN QUERY
  SELECT sp.id, sp.full_name, sp.role
  FROM public.staff_profiles sp
  WHERE sp.is_active = true
    AND sp.employee_code_hash = crypt(pin_input, sp.employee_code_hash)
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.protected_delete_order(
  p_order_id uuid,
  p_pin_input text,
  p_reason text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_staff record;
  v_order_code text;
BEGIN
  SELECT sp.id, sp.full_name
  INTO v_staff
  FROM public.staff_profiles sp
  WHERE sp.is_active = true
    AND sp.employee_code_hash = crypt(p_pin_input, sp.employee_code_hash)
  LIMIT 1;

  IF v_staff.id IS NULL THEN
    RAISE EXCEPTION 'Invalid Employee Code';
  END IF;

  IF COALESCE(trim(p_reason), '') = '' THEN
    RAISE EXCEPTION 'Deletion reason is required';
  END IF;

  SELECT order_code INTO v_order_code FROM public.rental_orders WHERE id = p_order_id;
  IF v_order_code IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  UPDATE public.rental_orders
  SET status = 'deleted', updated_at = now()
  WHERE id = p_order_id;

  INSERT INTO public.order_audit_log (order_id, order_code, actor_staff_id, actor_name, action, reason)
  VALUES (p_order_id, v_order_code, v_staff.id, v_staff.full_name, 'protected_delete', p_reason);

  RETURN true;
END;
$$;

-- ----------------------------------------------------------------------------
-- 9. Strict Row-Level Security (RLS) — Fixes Anonymous Data Exposure
-- ----------------------------------------------------------------------------

-- Lock down existing studio_requests table (previously readable by anon!)
ALTER TABLE IF EXISTS public.studio_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anon can insert studio_requests" ON public.studio_requests;
CREATE POLICY "Anon can insert studio_requests"
  ON public.studio_requests FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can read and manage studio_requests" ON public.studio_requests;
CREATE POLICY "Staff can read and manage studio_requests"
  ON public.studio_requests FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- Lock down existing invoices & users tables
ALTER TABLE IF EXISTS public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff manage invoices" ON public.invoices;
CREATE POLICY "Staff manage invoices"
  ON public.invoices FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff manage users" ON public.users;
CREATE POLICY "Staff manage users"
  ON public.users FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- New tables RLS
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read staff_profiles" ON public.staff_profiles FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "Admin manage staff_profiles" ON public.staff_profiles FOR ALL TO authenticated
  USING (public.get_staff_role() = 'admin')
  WITH CHECK (public.get_staff_role() = 'admin');

ALTER TABLE public.equipment_stock_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read stock counts" ON public.equipment_stock_state FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff update stock counts" ON public.equipment_stock_state FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

ALTER TABLE public.client_account_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage client flags" ON public.client_account_flags FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

ALTER TABLE public.rental_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage rental_orders" ON public.rental_orders FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

ALTER TABLE public.rental_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage rental_order_items" ON public.rental_order_items FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

ALTER TABLE public.inspection_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage inspection_checklists" ON public.inspection_checklists FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

ALTER TABLE public.order_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read order_audit_log" ON public.order_audit_log FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "Staff insert order_audit_log" ON public.order_audit_log FOR INSERT TO authenticated WITH CHECK (public.is_staff());

ALTER TABLE public.whatsapp_dispatch_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage whatsapp_dispatch_queue" ON public.whatsapp_dispatch_queue FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

ALTER TABLE public.promos_flyers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active promos" ON public.promos_flyers FOR SELECT TO anon, authenticated USING (is_active = true OR public.is_staff());
CREATE POLICY "Admin manage promos" ON public.promos_flyers FOR ALL TO authenticated
  USING (public.get_staff_role() IN ('admin', 'front_desk'))
  WITH CHECK (public.get_staff_role() IN ('admin', 'front_desk'));

ALTER TABLE public.customer_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published reviews" ON public.customer_reviews FOR SELECT TO anon, authenticated USING (is_published = true OR public.is_staff());
CREATE POLICY "Anyone can submit review" ON public.customer_reviews FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Staff manage reviews" ON public.customer_reviews FOR UPDATE TO authenticated USING (public.is_staff());

-- Read-only client receipt RPC (safe public lookup ONLY by unguessable UUID token)
CREATE OR REPLACE FUNCTION public.get_readonly_receipt(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order jsonb;
  v_items jsonb;
  v_inspections jsonb;
BEGIN
  SELECT jsonb_build_object(
    'order_code', o.order_code,
    'client_name', o.client_name,
    'pickup_date', o.pickup_date,
    'return_date', o.return_date,
    'status', o.status,
    'payment_mode', o.payment_mode,
    'payment_status', o.payment_status,
    'subtotal_ghs', o.subtotal_ghs,
    'amount_paid_ghs', o.amount_paid_ghs,
    'balance_due_ghs', o.balance_due_ghs,
    'booked_by_name', o.booked_by_name,
    'pickup_by_name', o.pickup_by_name,
    'return_by_name', o.return_by_name,
    'confirmed_by_name', o.confirmed_by_name
  ) INTO v_order
  FROM public.rental_orders o
  WHERE o.read_only_token = p_token AND o.status <> 'deleted'
  LIMIT 1;

  IF v_order IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'product_name', i.product_name,
    'quantity', i.quantity,
    'daily_rate_ghs', i.daily_rate_ghs,
    'line_total_ghs', i.line_total_ghs
  )), '[]'::jsonb) INTO v_items
  FROM public.rental_order_items i
  JOIN public.rental_orders o ON o.id = i.order_id
  WHERE o.read_only_token = p_token;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'inspection_type', c.inspection_type,
    'accessory_counts', c.accessory_counts,
    'photo_urls', c.photo_urls,
    'condition_notes', c.condition_notes,
    'staff_name', c.staff_name,
    'created_at', c.created_at
  ) ORDER BY c.created_at ASC), '[]'::jsonb) INTO v_inspections
  FROM public.inspection_checklists c
  JOIN public.rental_orders o ON o.id = c.order_id
  WHERE o.read_only_token = p_token;

  RETURN jsonb_build_object(
    'order', v_order,
    'items', v_items,
    'inspections', v_inspections
  );
END;
$$;
