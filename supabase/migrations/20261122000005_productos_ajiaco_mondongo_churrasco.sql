-- Productos para el ajiaco, la sopa de mondongo y el churrasco de la semana
-- del 30 de noviembre, con su nutrición y pesos. «Churrasco» pasa a ser un
-- nombre de la carne de res.
update public.productos set alias = alias || array['churrasco'] where nombre = 'Carne de res' and not ('churrasco' = any(alias));
insert into public.productos (nombre, seccion, unidad_compra, unidad_compra_plural, despensa, se_compra, equivalencias, alias, nutricion, gramos) values
  ('Papa sabanera', 'Frutas y verduras', 'lb', 'lb', false, true, '{"unidad": 0.35}'::jsonb, array['papa sabanera'],
   '{"kcal": 79, "proteina": 2, "carbohidratos": 17.5, "grasa": 0.1, "fibra": 2, "azucar": 0.8}'::jsonb, '{"unidad": 150}'::jsonb),
  ('Guascas', 'Frutas y verduras', 'manojo', 'manojos', false, true, '{"cda": 0.1}'::jsonb, array['guasca'],
   '{"kcal": 40, "proteina": 3, "carbohidratos": 6, "grasa": 0.5, "fibra": 3, "azucar": 0}'::jsonb, '{"cda": 1, "taza": 20}'::jsonb),
  ('Alcaparras', 'Despensa', 'frasco', 'frascos', true, true, '{}'::jsonb, array['alcaparra'],
   '{"kcal": 23, "proteina": 2.4, "carbohidratos": 4.9, "grasa": 0.9, "fibra": 3.2, "azucar": 0.4}'::jsonb, '{"cda": 9}'::jsonb),
  ('Mondongo', 'Carnes, pollo y pescado', 'lb', 'lb', false, true, '{}'::jsonb, array['mondongo', 'callo'],
   '{"kcal": 85, "proteina": 12, "carbohidratos": 0, "grasa": 3.7, "fibra": 0, "azucar": 0}'::jsonb, '{}'::jsonb);
