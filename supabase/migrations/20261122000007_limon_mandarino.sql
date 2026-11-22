-- En la casa se compra limón mandarino: así sale en la lista de mercado.
-- Las recetas que dicen «limón» lo siguen reconociendo.
update public.productos
set nombre = 'Limón mandarino', alias = array['limón', 'jugo de limón', 'limón mandarino']
where nombre = 'Limón';
