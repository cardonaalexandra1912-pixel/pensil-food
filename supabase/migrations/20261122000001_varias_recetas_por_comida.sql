-- ============================================================================
-- VARIAS RECETAS POR COMIDA
-- ----------------------------------------------------------------------------
-- Antes cada comida del menú (desayuno, almuerzo o cena de un día) tenía una
-- sola receta. Ahora puede tener varias, por ejemplo una sopa y un plato
-- fuerte en el almuerzo. Lo único que no se puede es repetir la misma receta
-- en la misma comida.
--
-- creado_en ordena los platos de una comida en el orden en que se agregaron
-- (actualizado_en cambia cuando alguien reemplaza un plato).
-- ============================================================================

alter table public.menu_items
  drop constraint menu_items_menu_id_dia_momento_key;

alter table public.menu_items
  add constraint menu_items_menu_id_dia_momento_receta_id_key unique (menu_id, dia, momento, receta_id);

alter table public.menu_items
  add column creado_en timestamptz not null default now();
