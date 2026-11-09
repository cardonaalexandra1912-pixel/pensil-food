-- Ilustraciones de las recetas de Espaguetis con Camarones y Jugo de Guanábana.
-- Correr DESPUÉS de que las imágenes estén publicadas (merge a main), para no mostrar imágenes rotas.
-- Solo las pone si la receta sigue sin foto, para no pisar una que se haya subido a mano.
update public.recetas
set imagen = 'imagenes/recetas/espaguetis-camarones.jpg'
where familia_id is null
  and nombre = 'Espaguetis con Camarones, Pollo Desmechado, Maicitos y Salsa Bechamel'
  and (imagen is null or imagen = '');

update public.recetas
set imagen = 'imagenes/recetas/jugo-guanabana.jpg'
where familia_id is null
  and nombre = 'Jugo de Guanábana con Leche Klim'
  and (imagen is null or imagen = '');
