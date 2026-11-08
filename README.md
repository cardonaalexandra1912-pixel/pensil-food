# Pensil Food

Recetario casero con menú semanal en familia, lista de mercado automática y
comentarios. React + Vite en el frontend (publicado en GitHub Pages) y
[Supabase](https://supabase.com) como base de datos y autenticación.

## Funcionalidades

- **Recetas**: catálogo público (cualquiera puede verlo sin cuenta) y recetas
  propias de cada familia (crear, editar y borrar).
- **Cuentas**: ingreso con correo y contraseña, y recuperación de la
  contraseña por correo (el enlace abre `/nueva-contrasena`). El ingreso con
  Google ya está programado pero apagado (ver más abajo).
- **Familias**: cada usuario pertenece a una familia; quien la crea queda como
  administrador e invita a los demás con un código de 6 letras o un enlace.
- **Menú semanal compartido**: un plan por familia y por semana (lunes a
  domingo). Cualquier integrante elige desayuno, almuerzo y cena desde una hoja
  con buscador, fotos y filtros; se ve quién eligió cada comida y los cambios
  aparecen en vivo para todos. En móvil se ve un día a la vez (tira de días con
  el avance de cada uno); en escritorio, la semana completa como planeador.
- **Inicio con sesión**: en vez de la portada, un panel con lo que hay hoy en
  casa (desayuno, almuerzo y cena, que se eligen ahí mismo), cómo va el menú de
  la semana, la lista de mercado, las favoritas y el recetario. Con sesión no
  hay pie de página y, en móvil, se navega con cinco pestañas abajo.
- **Lista de mercado** automática: se marca lo que ya está en el carrito (se
  guarda en ese teléfono), se descarga en PDF o se envía por WhatsApp.
- **Comentarios** en cada receta y en cada menú semanal, privados de la familia.
- **Favoritos** por usuario (los que estaban guardados en el navegador se suben
  a la cuenta al ingresar por primera vez).

## Diseño

Pensil.Food usa el design system **Pensil.Devs**, el mismo de Pensil.Pos y
Pensil.Devs Academy: papel blanco, tinta grafito, amarillo lápiz para la acción
principal, verde para etiquetas y confirmaciones, pie en grafito, Bricolage
Grotesque para títulos e Inter para el texto, botones en píldora de 48 px y modo
oscuro automático. Todos los colores son tokens en `src/styles/global.css`.

Lo propio de Pensil.Food (como el cohete en Pensil.Pos):

- **Tomate** como acento de cocina: favoritos, «En vivo», lo que es de tu
  familia y el margen de la ficha de receta. Nunca en el botón principal ni como
  fondo de sección.
- **Ficha de receta**: renglones de cuaderno con el margen en tomate, detrás del
  inicio y en la lista de ingredientes.
- **Íconos de comida** por categoría (trazo de 1.8 px) en lugar de emojis.

## Desarrollo

```bash
npm install
npm run dev     # http://localhost:5173/pensil-food/
npm run build
npm run lint
```

Por defecto la app usa el proyecto de Supabase **Pensil.Food**
(`src/lib/supabase.js`). Para apuntar a otro, copia `.env.example` a
`.env.local` y cambia las variables.

## Base de datos

El esquema está en `supabase/migrations/`:

| Tabla               | Para qué                                                            |
| ------------------- | ------------------------------------------------------------------- |
| `perfiles`          | Nombre y foto de cada usuario (se crea solo al registrarse)         |
| `familias`          | Familias con su código de invitación                                |
| `familia_miembros`  | Quién pertenece a qué familia (una por usuario) y su rol            |
| `recetas`           | Catálogo (`familia_id` nulo) y recetas de cada familia              |
| `favoritos`         | Recetas favoritas de cada usuario                                   |
| `menus_semanales`   | Un menú por familia y semana (`semana_inicio` = lunes)              |
| `menu_items`        | La receta elegida para cada día y momento, y quién la eligió        |
| `comentarios_receta`| Comentarios de una familia sobre una receta                        |
| `comentarios_menu`  | Comentarios sobre el menú de una semana                             |

Toda la seguridad está en políticas RLS: cada familia solo ve y modifica lo
suyo. Crear, unirse o salir de una familia y abrir el menú de una semana pasan
por funciones RPC (`crear_familia`, `unirse_a_familia`, `salir_de_familia`,
`regenerar_codigo_familia`, `obtener_menu_semana`).

## Configuración pendiente en el panel de Supabase

Estas dos cosas no se pueden hacer desde el código; se configuran una sola vez
en el panel del proyecto:

1. **Authentication → URL Configuration**
   - *Site URL*: `https://cardonaalexandra1912-pixel.github.io/pensil-food/`
   - *Redirect URLs*: agrega
     `https://cardonaalexandra1912-pixel.github.io/pensil-food/**` y
     `http://localhost:5173/pensil-food/**`
2. **(Más adelante, con el dominio definitivo) Ingreso con Google.** El código
   ya está listo pero el botón está oculto. Para encenderlo:
   activa el proveedor en **Authentication → Sign In / Providers → Google** con un
   *Client ID* y *Client Secret* de Google Cloud (APIs y servicios →
   Credenciales → ID de cliente OAuth, tipo “Aplicación web”). En Google, la
   *URI de redireccionamiento autorizada* debe ser
   `https://nredvzzxzgsckyyhfnqk.supabase.co/auth/v1/callback`. Luego construye
   con `VITE_GOOGLE_HABILITADO=true` (o cambia `GOOGLE_HABILITADO` en
   `src/lib/supabase.js`).
