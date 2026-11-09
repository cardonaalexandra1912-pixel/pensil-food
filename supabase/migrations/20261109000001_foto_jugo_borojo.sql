-- Foto del vaso de Jugo de Borojó (receta 38), que se creó sin imagen.
-- Solo la pone si la receta sigue sin foto, para no pisar una que se haya subido a mano.
update public.recetas
set imagen = 'imagenes/recetas/38.jpg'
where id = 38 and (imagen is null or imagen = '');
