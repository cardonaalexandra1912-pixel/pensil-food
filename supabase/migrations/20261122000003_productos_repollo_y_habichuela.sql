-- «Repollo» y «habichuela» eran alias de Repollo morado y de Arveja, así que el
-- repollo blanco del chop suey salía como morado y la habichuela como arveja.
-- Cada uno queda como producto propio.
update public.productos set alias = array['repollo morado'] where nombre = 'Repollo morado';
update public.productos set alias = array['arveja', 'arvejas dulces', 'frijolitos verdes'] where nombre = 'Arveja';
insert into public.productos (nombre, seccion, unidad_compra, unidad_compra_plural, despensa, se_compra, equivalencias, alias) values
  ('Repollo', 'Frutas y verduras', 'unidad', 'unidades', false, true, '{"taza": 0.15}'::jsonb, array['repollo', 'repollo blanco']),
  ('Habichuela', 'Frutas y verduras', 'lb', 'lb', false, true, '{"taza": 0.3}'::jsonb, array['habichuela']);
