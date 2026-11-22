-- ============================================================================
-- COMPRAS: las facturas del mercado
-- ----------------------------------------------------------------------------
-- Cada factura (compras) y sus artículos (compra_items). Lo que es comida del
-- catálogo queda enlazado a su producto (producto_id), con su presentación y
-- precio: con eso se sabe dónde se consigue cada cosa y cuánto cuesta, para
-- estimar el mercado y comparar tiendas. Lo que no es del catálogo (aseo,
-- mecato) queda con producto_id null para el total de la factura.
-- Por ahora las facturas se cargan desde Supabase; la familia las puede leer.
-- ============================================================================

create table public.compras (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references public.familias (id) on delete cascade,
  tienda text not null,
  fecha timestamptz not null,
  total numeric not null,
  numero_factura text,
  creado_en timestamptz not null default now()
);

create table public.compra_items (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references public.compras (id) on delete cascade,
  linea smallint not null,
  codigo text,
  descripcion text not null,
  producto_id bigint references public.productos (id) on delete set null,
  presentacion text,
  cantidad numeric not null,
  unidad text not null default 'un',
  precio_unitario numeric not null,
  total numeric not null,
  unique (compra_id, linea)
);
create index compra_items_producto_idx on public.compra_items (producto_id);
create index compras_familia_idx on public.compras (familia_id);

alter table public.compras enable row level security;
alter table public.compra_items enable row level security;

create policy "compras_ver_familia" on public.compras
  for select to authenticated
  using (familia_id = (select private.mi_familia_id()));
create policy "compra_items_ver_familia" on public.compra_items
  for select to authenticated
  using (compra_id in (select id from public.compras where familia_id = (select private.mi_familia_id())));

-- La cuajada de la factura del Ara es el mismo producto que el queso campesino.
update public.productos set alias = alias || array['cuajada'] where nombre = 'Queso campesino' and not ('cuajada' = any(alias));
