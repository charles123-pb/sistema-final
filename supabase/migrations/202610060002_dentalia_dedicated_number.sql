-- Dedicated bot instance, additive; previous personal-to-clinic mode remains available.
create table public.dentalia_bot_estado (
 id smallint primary key check(id=1), estado text not null default 'DESCONECTADO',
 numero text, nombre_instancia text, detalle text, actualizado_en timestamptz not null default now()
);
alter table public.dentalia_bot_estado enable row level security;
revoke all on public.dentalia_bot_estado from anon,authenticated;
grant all on public.dentalia_bot_estado to service_role;
insert into public.dentalia_bot_estado(id) values(1);
-- Additive private assistant. Existing patient messaging and roles stay intact.
create table public.dentalia_bot_whatsapp_vinculos (
  usuario_id bigint primary key references public.usuarios(id) on delete restrict,
  numero text not null unique check (numero ~ '^[1-9][0-9]{9,14}$'),
  activo boolean not null default true,
  desafio_hash text,
  desafio_expira_en timestamptz,
  verificado_en timestamptz,
  actualizado_en timestamptz not null default now()
);
create table public.dentalia_bot_whatsapp_consultas (
  id uuid primary key default gen_random_uuid(),
  usuario_id bigint not null references public.usuarios(id) on delete restrict,
  instancia text not null,
  proveedor_id text not null,
  tema text not null,
  estado text not null default 'RESERVADO' check (estado in ('RESERVADO','ENVIADO','FALLIDO')),
  respuesta_proveedor_id text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint dentalia_bot_consulta_proveedor_unique unique(instancia, proveedor_id)
);
create index dentalia_bot_whatsapp_consultas_usuario_fecha on public.dentalia_bot_whatsapp_consultas(usuario_id, creado_en desc);
alter table public.dentalia_bot_whatsapp_vinculos enable row level security;
alter table public.dentalia_bot_whatsapp_consultas enable row level security;
revoke all on public.dentalia_bot_whatsapp_vinculos, public.dentalia_bot_whatsapp_consultas from anon, authenticated;
grant all on public.dentalia_bot_whatsapp_vinculos, public.dentalia_bot_whatsapp_consultas to service_role;

create function public.estado_dentalia_whatsapp_bot()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare actor bigint := public.current_app_user_id(); item public.dentalia_bot_whatsapp_vinculos;
begin
  if actor is null or not public.dentalia_actor_permission(actor,'IA_LEER') then
    raise exception using errcode='42501', message='DentalIA privado requiere administrador con acceso a IA';
  end if;
  select * into item from public.dentalia_bot_whatsapp_vinculos where usuario_id=actor;
  return jsonb_build_object('phone',item.numero,'active',coalesce(item.activo,false),
    'verified',coalesce(item.activo and item.verificado_en is not null,false),
    'expiresAt',item.desafio_expira_en,'clinicPhone',(select numero from public.whatsapp_instancia_estado where id=1),'botPhone',(select numero from public.dentalia_bot_estado where id=1));
end $$;

create function public.configurar_dentalia_whatsapp_bot(numero text default null, desactivar boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare actor bigint := public.current_app_user_id(); digits text; challenge text;
begin
  if actor is null or not public.dentalia_actor_permission(actor,'IA_LEER') then
    raise exception using errcode='42501', message='DentalIA privado requiere administrador con acceso a IA';
  end if;
  if desactivar then
    update public.dentalia_bot_whatsapp_vinculos set activo=false,desafio_hash=null,desafio_expira_en=null,verificado_en=null,actualizado_en=now() where usuario_id=actor;
    perform public.registrar_auditoria('DESACTIVAR_DENTALIA_WHATSAPP','DENTALIA_WHATSAPP',actor::text,'Acceso privado desactivado');
    return public.estado_dentalia_whatsapp_bot();
  end if;
  digits := regexp_replace(coalesce(numero,''),'[^0-9]','','g');
  if digits ~ '^9[0-9]{8}$' then digits := '51'||digits; end if;
  if digits !~ '^[1-9][0-9]{9,14}$' then raise exception using errcode='22023',message='Ingresa el número desde el que consultarás a DentalIA'; end if;
  if digits=(select regexp_replace(coalesce(w.numero,''),'[^0-9]','','g') from public.dentalia_bot_estado w where w.id=1) then
    raise exception using errcode='22023',message='El número autorizado debe ser distinto del número propio de DentalIA';
  end if;
  challenge := replace(gen_random_uuid()::text,'-','');
  insert into public.dentalia_bot_whatsapp_vinculos(usuario_id,numero,desafio_hash,desafio_expira_en)
    values(actor,digits,encode(sha256(convert_to(challenge,'UTF8')),'hex'),now()+interval '10 minutes')
    on conflict(usuario_id) do update set numero=excluded.numero,activo=true,desafio_hash=excluded.desafio_hash,
      desafio_expira_en=excluded.desafio_expira_en,verificado_en=null,actualizado_en=now();
  perform public.registrar_auditoria('PREPARAR_DENTALIA_WHATSAPP','DENTALIA_WHATSAPP',actor::text,'Verificación del número pendiente');
  return public.estado_dentalia_whatsapp_bot()||jsonb_build_object('command','VINCULAR DENTALIA '||challenge);
end $$;

create function public.es_numero_dentalia_whatsapp_bot(numero text)
returns boolean language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.role() is distinct from 'service_role' then raise exception using errcode='42501',message='Solo servidor'; end if;
  -- Keep revoked private contacts out of the patient assistant too.
  return exists(select 1 from public.dentalia_bot_whatsapp_vinculos v where v.numero=es_numero_dentalia_whatsapp_bot.numero);
end $$;

create function public.preparar_dentalia_whatsapp_respuesta_bot(numero text, mensaje_id text, instancia text, tema text, dia integer default 0, desafio text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare binding public.dentalia_bot_whatsapp_vinculos; claim uuid; data jsonb := '{}'::jsonb;
  target_date date := (now() at time zone 'America/Lima')::date + dia;
  start_at timestamptz; end_at timestamptz; permission_code text;
begin
  if auth.role() is distinct from 'service_role' then raise exception using errcode='42501',message='Solo servidor'; end if;
  select * into binding from public.dentalia_bot_whatsapp_vinculos v where v.numero=preparar_dentalia_whatsapp_respuesta_bot.numero for update;
  if not found then return jsonb_build_object('handled',false); end if;
  if not binding.activo or not public.dentalia_actor_permission(binding.usuario_id,'IA_LEER') then
    return jsonb_build_object('handled',true);
  end if;
  if tema not in ('link','help','appointments','payments','receivables','followups','patients','overview')
    or dia is null or dia not between -1 and 1 or nullif(mensaje_id,'') is null or length(mensaje_id)>200
    or nullif(instancia,'') is null or length(instancia)>100 then return jsonb_build_object('handled',true); end if;
  if tema='link' then
    if binding.desafio_expira_en is null or binding.desafio_expira_en<now() or desafio is null
      or binding.desafio_hash is distinct from encode(sha256(convert_to(desafio,'UTF8')),'hex') then
      return jsonb_build_object('handled',true);
    end if;
  elsif binding.verificado_en is null then return jsonb_build_object('handled',true);
  end if;
  if exists(select 1 from public.dentalia_bot_whatsapp_consultas c where c.instancia=preparar_dentalia_whatsapp_respuesta_bot.instancia and c.proveedor_id=mensaje_id) then
    return jsonb_build_object('handled',true);
  end if;
  if (select count(*) from public.dentalia_bot_whatsapp_consultas where usuario_id=binding.usuario_id and creado_en>now()-interval '1 minute')>=10 then
    return jsonb_build_object('handled',true);
  end if;
  permission_code := case tema when 'appointments' then 'AGENDA_LEER' when 'payments' then 'FINANZA_LEER'
    when 'receivables' then 'FINANZA_LEER' when 'followups' then 'SEGUIMIENTO_LEER' when 'patients' then 'PACIENTE_LEER' else 'IA_LEER' end;
  if not public.dentalia_actor_permission(binding.usuario_id,permission_code) then
    data := jsonb_build_object('denied',true);
  else
    start_at := target_date::timestamp at time zone 'America/Lima'; end_at := start_at + interval '1 day';
    if tema='link' then
      update public.dentalia_bot_whatsapp_vinculos set verificado_en=now(),desafio_hash=null,desafio_expira_en=null,actualizado_en=now() where usuario_id=binding.usuario_id;
    elsif tema='appointments' then
      select jsonb_build_object('count',count(*)) into data from public.citas where inicio>=start_at and inicio<end_at and estado<>'CANCELADA';
      data := data || jsonb_build_object('items',coalesce((select jsonb_agg(x.item order by x.inicio,x.id) from (
        select c.id,c.inicio,jsonb_build_object('time',to_char(c.inicio at time zone 'America/Lima','HH24:MI'),
          'patient',concat_ws(' ',p.nombres,p.apellido_paterno),'status',c.estado) item
        from public.citas c join public.pacientes p on p.id=c.paciente_id
        where c.inicio>=start_at and c.inicio<end_at and c.estado<>'CANCELADA' order by c.inicio,c.id limit 10) x),'[]'::jsonb));
    elsif tema='payments' then
      select jsonb_build_object('count',count(*),'total',coalesce(sum(monto),0)) into data from public.pagos
        where registrado_en>=start_at and registrado_en<end_at and estado='REGISTRADO';
    elsif tema='receivables' then
      select jsonb_build_object('count',count(*),'total',coalesce(sum(saldo),0)) into data from public.cuentas_por_cobrar where estado<>'ANULADA' and saldo>0;
    elsif tema='followups' then
      select jsonb_build_object('alerts',count(*) filter(where estado='ALERTA'),'responses',count(*) filter(where estado='RESPONDIDO'),
        'scheduled',count(*) filter(where estado='PROGRAMADO'),'sent',count(*) filter(where estado='ENVIADO')) into data from public.seguimientos_postconsulta;
    elsif tema='patients' then
      select jsonb_build_object('active',count(*) filter(where activo),'total',count(*)) into data from public.pacientes;
    elsif tema='overview' then
      -- Every section checks its own current permission; the summary cannot bypass revoked access.
      if public.dentalia_actor_permission(binding.usuario_id,'AGENDA_LEER') then data:=data||jsonb_build_object('appointments',(select count(*) from public.citas where inicio>=start_at and inicio<end_at and estado<>'CANCELADA')); end if;
      if public.dentalia_actor_permission(binding.usuario_id,'FINANZA_LEER') then data:=data||jsonb_build_object('payments',(select coalesce(sum(monto),0) from public.pagos where registrado_en>=start_at and registrado_en<end_at and estado='REGISTRADO')); end if;
      if public.dentalia_actor_permission(binding.usuario_id,'SEGUIMIENTO_LEER') then data:=data||jsonb_build_object('review',(select count(*) from public.seguimientos_postconsulta where estado in ('ALERTA','RESPONDIDO'))); end if;
    end if;
  end if;
  insert into public.dentalia_bot_whatsapp_consultas(usuario_id,instancia,proveedor_id,tema)
    values(binding.usuario_id,instancia,mensaje_id,tema) on conflict on constraint dentalia_bot_consulta_proveedor_unique do nothing returning id into claim;
  if claim is null then return jsonb_build_object('handled',true); end if;
  return jsonb_build_object('handled',true,'claimId',claim,'topic',tema,'date',target_date,'data',data);
end $$;

create function public.finalizar_dentalia_whatsapp_respuesta_bot(consulta_id uuid, enviada boolean, proveedor_respuesta text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() is distinct from 'service_role' then raise exception using errcode='42501',message='Solo servidor'; end if;
  update public.dentalia_bot_whatsapp_consultas set estado=case when enviada then 'ENVIADO' else 'FALLIDO' end,
    respuesta_proveedor_id=left(proveedor_respuesta,200),actualizado_en=now() where id=consulta_id and estado='RESERVADO';
end $$;

revoke all on function public.estado_dentalia_whatsapp_bot(),public.configurar_dentalia_whatsapp_bot(text,boolean),public.es_numero_dentalia_whatsapp_bot(text),public.preparar_dentalia_whatsapp_respuesta_bot(text,text,text,text,integer,text),public.finalizar_dentalia_whatsapp_respuesta_bot(uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.estado_dentalia_whatsapp_bot(),public.configurar_dentalia_whatsapp_bot(text,boolean) to authenticated;
grant execute on function public.es_numero_dentalia_whatsapp_bot(text),public.preparar_dentalia_whatsapp_respuesta_bot(text,text,text,text,integer,text),public.finalizar_dentalia_whatsapp_respuesta_bot(uuid,boolean,text) to service_role;
