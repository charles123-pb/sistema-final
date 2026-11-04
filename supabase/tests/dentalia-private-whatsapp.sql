-- Execute inside BEGIN/ROLLBACK. No WhatsApp delivery calls and no new user accounts.
do $$
declare actor bigint; auth_id uuid; config jsonb; reply jsonb; challenge text; linked timestamptz;
  test_phone text := '51999999991';
begin
  select id,auth_user_id into actor,auth_id from public.usuarios where email='dental@americana.com';
  if actor is null or auth_id is null then raise exception 'La cuenta de prueba del dueño no está disponible'; end if;
  if has_function_privilege('anon','public.estado_dentalia_whatsapp()','EXECUTE')
    or has_function_privilege('authenticated','public.preparar_dentalia_whatsapp_respuesta(text,text,text,text,integer,text)','EXECUTE')
    or has_table_privilege('authenticated','public.dentalia_whatsapp_vinculos','SELECT')
    or has_table_privilege('anon','public.dentalia_whatsapp_consultas','SELECT') then raise exception 'Acceso público inesperado'; end if;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',auth_id,'role','authenticated')::text,true);
  config := public.configurar_dentalia_whatsapp(test_phone,false);
  challenge := split_part(config->>'command',' ',3);
  if config->>'phone'<>test_phone or (config->>'verified')::boolean then raise exception 'Vinculación debe comenzar sin verificar'; end if;
  begin
    perform public.preparar_dentalia_whatsapp_respuesta(test_phone,'denied','test','overview',0,null);
    raise exception 'La llamada authenticated no debe pasar';
  exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claims','{"role":"service_role"}',true);
  reply := public.preparar_dentalia_whatsapp_respuesta('51999999992','unknown','test','overview',0,null);
  if (reply->>'handled')::boolean then raise exception 'Desconocido debe continuar por el flujo existente'; end if;
  reply := public.preparar_dentalia_whatsapp_respuesta(test_phone,'unverified','test','overview',0,null);
  if not (reply->>'handled')::boolean or reply ? 'claimId' then raise exception 'No dar datos sin verificar'; end if;
  reply := public.preparar_dentalia_whatsapp_respuesta(test_phone,'invalid-token','test','link',0,repeat('0',32));
  if reply ? 'claimId' then raise exception 'No aceptar token incorrecto'; end if;
  update public.dentalia_whatsapp_vinculos set desafio_expira_en=now()-interval '1 second' where usuario_id=actor;
  reply := public.preparar_dentalia_whatsapp_respuesta(test_phone,'expired-token','test','link',0,challenge);
  if reply ? 'claimId' then raise exception 'No aceptar token vencido'; end if;
  update public.dentalia_whatsapp_vinculos set desafio_expira_en=now()+interval '10 minutes' where usuario_id=actor;
  reply := public.preparar_dentalia_whatsapp_respuesta(test_phone,'link-valid','test','link',0,challenge);
  if not (reply ? 'claimId') then raise exception 'Token válido debe vincular'; end if;
  select verificado_en into linked from public.dentalia_whatsapp_vinculos where usuario_id=actor;
  if linked is null then raise exception 'Vinculación no guardada'; end if;
  reply := public.preparar_dentalia_whatsapp_respuesta(test_phone,'token-reused','test','link',0,challenge);
  if reply ? 'claimId' then raise exception 'Token debe ser de un solo uso'; end if;
  reply := public.preparar_dentalia_whatsapp_respuesta(test_phone,'overview-one','test','overview',0,null);
  if not(reply ? 'claimId') or reply->>'date'<>((now() at time zone 'America/Lima')::date)::text then raise exception 'Resumen o fecha de Lima incorrectos'; end if;
  perform public.finalizar_dentalia_whatsapp_respuesta((reply->>'claimId')::uuid,false,null);
  reply := public.preparar_dentalia_whatsapp_respuesta(test_phone,'overview-one','test','overview',0,null);
  if reply ? 'claimId' then raise exception 'No reintentar duplicados ni fallos ambiguos'; end if;
  reply := public.preparar_dentalia_whatsapp_respuesta(test_phone,'invalid-date','test','appointments',999,null);
  if reply ? 'claimId' then raise exception 'Rechazar fecha arbitraria'; end if;
  reply := public.preparar_dentalia_whatsapp_respuesta(test_phone,'payments-test','test','payments',0,null);
  if (reply->'data'->>'total')::numeric is distinct from (select coalesce(sum(monto),0) from public.pagos where estado='REGISTRADO' and (registrado_en at time zone 'America/Lima')::date=(now() at time zone 'America/Lima')::date) then raise exception 'Cobros deben excluir anulados y usar fecha de Lima'; end if;
  reply := public.preparar_dentalia_whatsapp_respuesta(test_phone,'receivables-test','test','receivables',0,null);
  if (reply->'data'->>'total')::numeric is distinct from (select coalesce(sum(saldo),0) from public.cuentas_por_cobrar where estado<>'ANULADA' and saldo>0) then raise exception 'Saldos incorrectos'; end if;
  if public.dentalia_actor_permission(-1,'IA_LEER') then raise exception 'No autorizar cuenta inexistente'; end if;
  for i in 1..6 loop
    reply := public.preparar_dentalia_whatsapp_respuesta(test_phone,'rate-fill-'||i,'test','help',0,null);
    if not(reply ? 'claimId') then raise exception 'El límite debe permitir diez consultas por minuto'; end if;
  end loop;
  reply := public.preparar_dentalia_whatsapp_respuesta(test_phone,'rate-excess','test','help',0,null);
  if reply ? 'claimId' then raise exception 'Respetar límite de diez consultas por minuto'; end if;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',auth_id,'role','authenticated')::text,true);
  perform public.configurar_dentalia_whatsapp(null,true);
  perform set_config('request.jwt.claims','{"role":"service_role"}',true);
  reply := public.preparar_dentalia_whatsapp_respuesta(test_phone,'revoked','test','overview',0,null);
  if not(reply->>'handled')::boolean or reply ? 'claimId' then raise exception 'Contacto desactivado no debe recibir datos ni pasar al bot de pacientes'; end if;
end $$;
