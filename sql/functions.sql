-- /sql/functions.sql

-- helper to generate next GD code (simple, not perfect for sharding)
create or replace function public.next_gd_code()
returns text language plpgsql as $$
declare
  seq_id bigint;
  code text;
begin
  -- use a sequence for monotonic numbers
  perform 1;
  create sequence if not exists public.gd_seq;
  seq_id := nextval('public.gd_seq');
  code := 'GD-' || lpad(seq_id::text, 5, '0');
  return code;
end;
$$;

-- register_device RPC
create or replace function public.register_device(
  p_imei text,
  p_brand text,
  p_model text,
  p_owner_contact text,
  p_image_path text,
  p_registered_paid boolean default false
) returns table(id uuid, gomadeal_code text, imei text, created_at timestamptz) language plpgsql as $$
declare
  new_gd text;
  new_id uuid;
begin
  -- basic check
  if p_imei is null then
    raise exception 'imei required';
  end if;

  new_gd := public.next_gd_code();

  insert into public.devices (gomadeal_code, imei, brand, model, owner_contact, image_path, registered_paid)
  values (new_gd, p_imei, p_brand, p_model, p_owner_contact, p_image_path, p_registered_paid)
  returning id, gomadeal_code, imei, created_at into new_id, new_gd, created_at;

  -- audit
  insert into public.device_audit (device_id, action, by_user, meta)
  values (new_id, 'register_device', p_owner_contact, jsonb_build_object('imei', p_imei));

  return query select new_id as id, new_gd as gomadeal_code, p_imei as imei, now() as created_at;
end;
$$;

-- report_lost RPC
create or replace function public.report_lost(
  p_imei text,
  p_description text,
  p_reporter_contact text
) returns table(report_id uuid, matched_device_id uuid, created_at timestamptz) language plpgsql as $$
declare
  new_id uuid;
  matched uuid;
begin
  insert into public.lost_reports (imei, description, reporter_contact)
  values (p_imei, p_description, p_reporter_contact)
  returning id into new_id;

  select id into matched from public.devices where imei = p_imei limit 1;

  if matched is not null then
    update public.lost_reports set matched_device_id = matched where id = new_id;
    -- optionally mark device as lost
    update public.devices set status = 'lost' where id = matched;
    insert into public.device_audit (device_id, action, by_user, meta)
      values (matched, 'marked_lost_by_report', p_reporter_contact, jsonb_build_object('report_id', new_id));
  end if;

  return query select new_id as report_id, matched as matched_device_id, now() as created_at;
end;
$$;
