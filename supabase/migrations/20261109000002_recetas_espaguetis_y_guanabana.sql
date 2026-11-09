-- Dos recetas más del catálogo:
--   * Almuerzo: Espaguetis con camarones, pollo desmechado, maicitos y salsa bechamel.
--   * Jugo de guanábana con leche (o agua) y leche Klim.
-- Sin foto todavía: la tarjeta muestra el ícono de su categoría.
-- No fijamos el id (las familias ya pueden haber creado recetas con los siguientes);
-- cada una se inserta solo si no existe ya en el catálogo con ese nombre.

insert into public.recetas (nombre, categoria, imagen, descripcion, tiempo_preparacion, porciones, dificultad, ingredientes, pasos)
select v.nombre, v.categoria, null, v.descripcion, v.tiempo_preparacion, v.porciones, v.dificultad, v.ingredientes, v.pasos
from (values
  (
    'Espaguetis con Camarones, Pollo Desmechado, Maicitos y Salsa Bechamel',
    'Almuerzos',
    'Espaguetis bañados en una bechamel casera de leche y cebolla en cuadritos, con camarones salteados, pechuga desmechada y maicitos. Se sirven con aguacate al lado. Un almuerzo completo y muy rendidor.',
    45, 4, 'Media',
    '[{"cantidadBase":250,"unidad":"g","nombre":"espaguetis"},{"cantidadBase":250,"unidad":"g","nombre":"camarones pelados y limpios"},{"cantidadBase":1,"unidad":"","nombre":"pechuga de pollo"},{"cantidadBase":1,"unidad":"taza","nombre":"maicitos (maíz tierno desgranado)"},{"cantidadBase":1,"unidad":"","nombre":"cebolla en cuadritos"},{"cantidadBase":3,"unidad":"cdas","nombre":"mantequilla"},{"cantidadBase":3,"unidad":"cdas","nombre":"harina de trigo"},{"cantidadBase":2,"unidad":"tazas","nombre":"leche"},{"cantidadBase":2,"unidad":"dientes","nombre":"ajo picado"},{"cantidadBase":1,"unidad":"","nombre":"aguacate en láminas"},{"cantidadBase":null,"unidad":"","nombre":"Sal, pimienta y nuez moscada al gusto"}]'::jsonb,
    '["Cocina la pechuga en agua con sal unos 20 minutos, hasta que esté bien cocida. Déjala entibiar y desmenúzala con dos tenedores. Guarda un poco del caldo.","Cocina los espaguetis en abundante agua con sal según el paquete, hasta que estén al dente. Escúrrelos.","Mientras tanto, saltea los camarones con el ajo y una cucharada de mantequilla, de 2 a 3 minutos, solo hasta que se pongan rosados. Sácalos y resérvalos.","Para la bechamel: en la misma olla derrite el resto de la mantequilla y sofríe la cebolla en cuadritos hasta que esté transparente. Agrega la harina y revuelve un minuto.","Vierte la leche poco a poco sin dejar de revolver, para que no se formen grumos, hasta que la salsa espese. Sazona con sal, pimienta y una pizca de nuez moscada. Si queda muy espesa, aligérala con un chorrito del caldo del pollo.","Agrega a la salsa el pollo desmechado, los maicitos y los camarones, y calienta todo un par de minutos.","Mezcla con los espaguetis y sirve enseguida, con el aguacate en láminas al lado."]'::jsonb
  ),
  (
    'Jugo de Guanábana con Leche Klim',
    'Jugos y Bebidas',
    'Jugo cremoso de guanábana licuado con leche (o con agua, si lo prefieres más ligero) y leche en polvo Klim, que le da más cuerpo y un sabor de casa.',
    10, 4, 'Fácil',
    '[{"cantidadBase":2,"unidad":"tazas","nombre":"pulpa de guanábana (sin semillas)"},{"cantidadBase":3,"unidad":"tazas","nombre":"leche fría (o agua)"},{"cantidadBase":3,"unidad":"cdas","nombre":"leche en polvo Klim"},{"cantidadBase":null,"unidad":"","nombre":"Azúcar al gusto"},{"cantidadBase":null,"unidad":"","nombre":"Hielo al gusto"}]'::jsonb,
    '["Si usas la fruta entera, pélala y sácale todas las semillas: son negras y no se deben licuar.","Pon en la licuadora la pulpa de guanábana con la leche fría (o el agua) y la leche Klim.","Licúa hasta que quede cremoso. Prueba y endulza al gusto.","Si quieres un jugo más suave, cuélalo. Sirve frío, con hielo."]'::jsonb
  )
) as v(nombre, categoria, descripcion, tiempo_preparacion, porciones, dificultad, ingredientes, pasos)
where not exists (
  select 1 from public.recetas r where r.familia_id is null and r.nombre = v.nombre
);
