-- ============================================================================
-- PENSIL FOOD — ESQUEMA INICIAL
-- ----------------------------------------------------------------------------
-- Perfiles (1:1 con auth.users), familias con código de invitación, recetas
-- (catálogo público + recetas propias de cada familia), favoritos por usuario,
-- menús semanales compartidos por familia y comentarios en recetas y menús.
-- Toda la seguridad vive en RLS: el frontend habla directo con la API.
-- ============================================================================

-- Funciones internas (no expuestas por la API REST).
create schema if not exists private;

-- ---------------------------------------------------------------------------
-- PERFILES
-- ---------------------------------------------------------------------------
create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null default '',
  avatar_url text,
  creado_en timestamptz not null default now()
);

-- Crea el perfil automáticamente al registrarse (Google o correo).
create or replace function private.crear_perfil_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(new.email, '@', 1)
    ),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function private.crear_perfil_nuevo_usuario();

-- ---------------------------------------------------------------------------
-- FAMILIAS
-- ---------------------------------------------------------------------------
create table public.familias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(trim(nombre)) between 1 and 80),
  codigo_invitacion text not null unique,
  creada_por uuid references public.perfiles (id) on delete set null,
  creada_en timestamptz not null default now()
);

-- Cada usuario pertenece como máximo a una familia (user_id es la PK).
create table public.familia_miembros (
  user_id uuid primary key references public.perfiles (id) on delete cascade,
  familia_id uuid not null references public.familias (id) on delete cascade,
  rol text not null default 'miembro' check (rol in ('admin', 'miembro')),
  unido_en timestamptz not null default now()
);
create index familia_miembros_familia_idx on public.familia_miembros (familia_id);

-- Familia del usuario autenticado. SECURITY DEFINER para que las políticas
-- RLS puedan consultarla sin recursión sobre familia_miembros.
create or replace function private.mi_familia_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select familia_id from public.familia_miembros where user_id = (select auth.uid())
$$;

create or replace function private.generar_codigo_invitacion()
returns text
language plpgsql
set search_path = ''
as $$
declare
  alfabeto constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  codigo text;
begin
  loop
    codigo := '';
    for i in 1..6 loop
      codigo := codigo || substr(alfabeto, 1 + floor(random() * length(alfabeto))::int, 1);
    end loop;
    exit when not exists (select 1 from public.familias where codigo_invitacion = codigo);
  end loop;
  return codigo;
end;
$$;

-- RPC: crea una familia y deja al usuario como admin.
create or replace function public.crear_familia(p_nombre text)
returns public.familias
language plpgsql
security definer
set search_path = ''
as $$
declare
  nueva public.familias;
begin
  if (select auth.uid()) is null then
    raise exception 'Debes iniciar sesión.';
  end if;
  if exists (select 1 from public.familia_miembros where user_id = (select auth.uid())) then
    raise exception 'Ya perteneces a una familia. Sal de ella antes de crear otra.';
  end if;
  if coalesce(trim(p_nombre), '') = '' then
    raise exception 'Ponle un nombre a tu familia.';
  end if;

  insert into public.familias (nombre, codigo_invitacion, creada_por)
  values (trim(p_nombre), private.generar_codigo_invitacion(), (select auth.uid()))
  returning * into nueva;

  insert into public.familia_miembros (user_id, familia_id, rol)
  values ((select auth.uid()), nueva.id, 'admin');

  return nueva;
end;
$$;

-- RPC: se une a una familia con su código de invitación.
create or replace function public.unirse_a_familia(p_codigo text)
returns public.familias
language plpgsql
security definer
set search_path = ''
as $$
declare
  encontrada public.familias;
begin
  if (select auth.uid()) is null then
    raise exception 'Debes iniciar sesión.';
  end if;
  if exists (select 1 from public.familia_miembros where user_id = (select auth.uid())) then
    raise exception 'Ya perteneces a una familia. Sal de ella antes de unirte a otra.';
  end if;

  select * into encontrada
  from public.familias
  where codigo_invitacion = upper(trim(p_codigo));

  if encontrada.id is null then
    raise exception 'No encontramos una familia con ese código.';
  end if;

  insert into public.familia_miembros (user_id, familia_id, rol)
  values ((select auth.uid()), encontrada.id, 'miembro');

  return encontrada;
end;
$$;

-- RPC: sale de la familia. Si era el último integrante, la familia se borra;
-- si era el único admin, el integrante más antiguo pasa a ser admin.
create or replace function public.salir_de_familia()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_familia uuid;
begin
  delete from public.familia_miembros
  where user_id = (select auth.uid())
  returning familia_id into v_familia;

  if v_familia is null then
    return;
  end if;

  if not exists (select 1 from public.familia_miembros where familia_id = v_familia) then
    delete from public.familias where id = v_familia;
  elsif not exists (
    select 1 from public.familia_miembros where familia_id = v_familia and rol = 'admin'
  ) then
    update public.familia_miembros set rol = 'admin'
    where user_id = (
      select user_id from public.familia_miembros
      where familia_id = v_familia order by unido_en limit 1
    );
  end if;
end;
$$;

-- RPC (solo admin): genera un código de invitación nuevo.
create or replace function public.regenerar_codigo_familia()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_codigo text;
begin
  if not exists (
    select 1 from public.familia_miembros
    where user_id = (select auth.uid()) and rol = 'admin'
  ) then
    raise exception 'Solo un administrador de la familia puede cambiar el código.';
  end if;
  v_codigo := private.generar_codigo_invitacion();
  update public.familias set codigo_invitacion = v_codigo where id = private.mi_familia_id();
  return v_codigo;
end;
$$;

-- ---------------------------------------------------------------------------
-- RECETAS
-- familia_id null => receta del catálogo público (visible para todos).
-- ---------------------------------------------------------------------------
create table public.recetas (
  id bigint generated by default as identity primary key,
  nombre text not null check (char_length(trim(nombre)) between 1 and 120),
  categoria text not null,
  imagen text,
  descripcion text not null default '',
  tiempo_preparacion integer not null default 0 check (tiempo_preparacion >= 0),
  porciones integer not null default 1 check (porciones between 1 and 50),
  dificultad text not null default 'Fácil' check (dificultad in ('Fácil', 'Media', 'Difícil')),
  ingredientes jsonb not null default '[]'::jsonb check (jsonb_typeof(ingredientes) = 'array'),
  pasos jsonb not null default '[]'::jsonb check (jsonb_typeof(pasos) = 'array'),
  familia_id uuid references public.familias (id) on delete cascade,
  creada_por uuid references public.perfiles (id) on delete set null,
  creada_en timestamptz not null default now()
);
create index recetas_familia_idx on public.recetas (familia_id);
create index recetas_creada_por_idx on public.recetas (creada_por);

-- ---------------------------------------------------------------------------
-- FAVORITOS (por usuario)
-- ---------------------------------------------------------------------------
create table public.favoritos (
  user_id uuid not null references public.perfiles (id) on delete cascade,
  receta_id bigint not null references public.recetas (id) on delete cascade,
  creado_en timestamptz not null default now(),
  primary key (user_id, receta_id)
);
create index favoritos_receta_idx on public.favoritos (receta_id);

-- ---------------------------------------------------------------------------
-- MENÚS SEMANALES (uno por familia y semana; semana_inicio es el lunes)
-- ---------------------------------------------------------------------------
create table public.menus_semanales (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references public.familias (id) on delete cascade,
  semana_inicio date not null check (extract(isodow from semana_inicio) = 1),
  creado_en timestamptz not null default now(),
  unique (familia_id, semana_inicio)
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.menus_semanales (id) on delete cascade,
  dia smallint not null check (dia between 0 and 6),
  momento text not null check (momento in ('desayuno', 'almuerzo', 'cena')),
  receta_id bigint not null references public.recetas (id) on delete cascade,
  elegido_por uuid references public.perfiles (id) on delete set null,
  actualizado_en timestamptz not null default now(),
  unique (menu_id, dia, momento)
);
create index menu_items_receta_idx on public.menu_items (receta_id);
create index menu_items_elegido_por_idx on public.menu_items (elegido_por);

-- RPC: devuelve (y crea si no existe) el menú de la familia para la semana
-- que contiene p_fecha.
create or replace function public.obtener_menu_semana(p_fecha date)
returns public.menus_semanales
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_familia uuid := private.mi_familia_id();
  v_lunes date := p_fecha - (extract(isodow from p_fecha)::int - 1);
  v_menu public.menus_semanales;
begin
  if v_familia is null then
    raise exception 'Únete a una familia o crea una para planear el menú.';
  end if;

  insert into public.menus_semanales (familia_id, semana_inicio)
  values (v_familia, v_lunes)
  on conflict (familia_id, semana_inicio) do nothing;

  select * into v_menu from public.menus_semanales
  where familia_id = v_familia and semana_inicio = v_lunes;
  return v_menu;
end;
$$;

-- ---------------------------------------------------------------------------
-- COMENTARIOS
-- Los comentarios de recetas son privados de cada familia.
-- ---------------------------------------------------------------------------
create table public.comentarios_receta (
  id uuid primary key default gen_random_uuid(),
  receta_id bigint not null references public.recetas (id) on delete cascade,
  familia_id uuid not null references public.familias (id) on delete cascade,
  autor_id uuid not null references public.perfiles (id) on delete cascade,
  texto text not null check (char_length(trim(texto)) between 1 and 1000),
  creado_en timestamptz not null default now()
);
create index comentarios_receta_receta_idx on public.comentarios_receta (receta_id, familia_id);
create index comentarios_receta_familia_idx on public.comentarios_receta (familia_id);
create index comentarios_receta_autor_idx on public.comentarios_receta (autor_id);

create table public.comentarios_menu (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.menus_semanales (id) on delete cascade,
  autor_id uuid not null references public.perfiles (id) on delete cascade,
  texto text not null check (char_length(trim(texto)) between 1 and 1000),
  creado_en timestamptz not null default now()
);
create index comentarios_menu_menu_idx on public.comentarios_menu (menu_id);
create index comentarios_menu_autor_idx on public.comentarios_menu (autor_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.perfiles enable row level security;
alter table public.familias enable row level security;
alter table public.familia_miembros enable row level security;
alter table public.recetas enable row level security;
alter table public.favoritos enable row level security;
alter table public.menus_semanales enable row level security;
alter table public.menu_items enable row level security;
alter table public.comentarios_receta enable row level security;
alter table public.comentarios_menu enable row level security;

-- Perfiles: el propio y los de tu familia.
create policy "perfiles_ver_propio_y_familia" on public.perfiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or id in (
      select user_id from public.familia_miembros where familia_id = (select private.mi_familia_id())
    )
  );
create policy "perfiles_editar_propio" on public.perfiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Familias: solo la tuya. Altas/bajas van por RPC.
create policy "familias_ver_propia" on public.familias
  for select to authenticated
  using (id = (select private.mi_familia_id()));
create policy "familias_admin_renombra" on public.familias
  for update to authenticated
  using (
    id = (select private.mi_familia_id())
    and exists (
      select 1 from public.familia_miembros
      where user_id = (select auth.uid()) and rol = 'admin'
    )
  )
  with check (id = (select private.mi_familia_id()));

create policy "miembros_ver_familia" on public.familia_miembros
  for select to authenticated
  using (familia_id = (select private.mi_familia_id()));

-- Recetas: catálogo público para todos; las de familia solo para su familia.
create policy "recetas_ver" on public.recetas
  for select to anon, authenticated
  using (familia_id is null or familia_id = (select private.mi_familia_id()));
create policy "recetas_crear_en_familia" on public.recetas
  for insert to authenticated
  with check (
    familia_id = (select private.mi_familia_id())
    and creada_por = (select auth.uid())
  );
create policy "recetas_editar_de_familia" on public.recetas
  for update to authenticated
  using (familia_id = (select private.mi_familia_id()))
  with check (familia_id = (select private.mi_familia_id()));
create policy "recetas_borrar_de_familia" on public.recetas
  for delete to authenticated
  using (familia_id = (select private.mi_familia_id()));

-- Favoritos: solo los propios.
create policy "favoritos_ver_propios" on public.favoritos
  for select to authenticated using (user_id = (select auth.uid()));
create policy "favoritos_agregar_propios" on public.favoritos
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "favoritos_quitar_propios" on public.favoritos
  for delete to authenticated using (user_id = (select auth.uid()));

-- Menús: solo de tu familia (se crean por RPC).
create policy "menus_ver_familia" on public.menus_semanales
  for select to authenticated
  using (familia_id = (select private.mi_familia_id()));

create policy "menu_items_ver_familia" on public.menu_items
  for select to authenticated
  using (menu_id in (
    select id from public.menus_semanales where familia_id = (select private.mi_familia_id())
  ));
create policy "menu_items_crear_familia" on public.menu_items
  for insert to authenticated
  with check (
    elegido_por = (select auth.uid())
    and menu_id in (
      select id from public.menus_semanales where familia_id = (select private.mi_familia_id())
    )
  );
create policy "menu_items_editar_familia" on public.menu_items
  for update to authenticated
  using (menu_id in (
    select id from public.menus_semanales where familia_id = (select private.mi_familia_id())
  ))
  with check (
    elegido_por = (select auth.uid())
    and menu_id in (
      select id from public.menus_semanales where familia_id = (select private.mi_familia_id())
    )
  );
create policy "menu_items_borrar_familia" on public.menu_items
  for delete to authenticated
  using (menu_id in (
    select id from public.menus_semanales where familia_id = (select private.mi_familia_id())
  ));

-- Comentarios de recetas: los ve y escribe tu familia; cada quien borra los suyos.
create policy "comentarios_receta_ver" on public.comentarios_receta
  for select to authenticated
  using (familia_id = (select private.mi_familia_id()));
create policy "comentarios_receta_crear" on public.comentarios_receta
  for insert to authenticated
  with check (
    autor_id = (select auth.uid())
    and familia_id = (select private.mi_familia_id())
  );
create policy "comentarios_receta_borrar" on public.comentarios_receta
  for delete to authenticated
  using (autor_id = (select auth.uid()));

create policy "comentarios_menu_ver" on public.comentarios_menu
  for select to authenticated
  using (menu_id in (
    select id from public.menus_semanales where familia_id = (select private.mi_familia_id())
  ));
create policy "comentarios_menu_crear" on public.comentarios_menu
  for insert to authenticated
  with check (
    autor_id = (select auth.uid())
    and menu_id in (
      select id from public.menus_semanales where familia_id = (select private.mi_familia_id())
    )
  );
create policy "comentarios_menu_borrar" on public.comentarios_menu
  for delete to authenticated
  using (autor_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- PERMISOS
-- ---------------------------------------------------------------------------
grant usage on schema private to authenticated, anon;
grant execute on function private.mi_familia_id() to authenticated, anon;

revoke execute on function public.crear_familia(text) from public, anon;
revoke execute on function public.unirse_a_familia(text) from public, anon;
revoke execute on function public.salir_de_familia() from public, anon;
revoke execute on function public.regenerar_codigo_familia() from public, anon;
revoke execute on function public.obtener_menu_semana(date) from public, anon;
grant execute on function public.crear_familia(text) to authenticated;
grant execute on function public.unirse_a_familia(text) to authenticated;
grant execute on function public.salir_de_familia() to authenticated;
grant execute on function public.regenerar_codigo_familia() to authenticated;
grant execute on function public.obtener_menu_semana(date) to authenticated;

-- ---------------------------------------------------------------------------
-- REALTIME: el menú y los comentarios se actualizan en vivo para la familia.
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.menu_items;
alter publication supabase_realtime add table public.comentarios_menu;
alter publication supabase_realtime add table public.comentarios_receta;
