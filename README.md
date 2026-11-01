# Pensil Food

Recetario casero con menú semanal en familia, lista de mercado automática y
comentarios. React + Vite en el frontend (publicado en GitHub Pages) y
[Supabase](https://supabase.com) como base de datos y autenticación.

## Funcionalidades

- **Recetas**: catálogo público (cualquiera puede verlo sin cuenta) y recetas
  propias de cada familia (crear, editar y borrar).
- **Cuentas**: ingreso con Google o con correo y contraseña.
- **Familias**: cada usuario pertenece a una familia; quien la crea queda como
  administrador e invita a los demás con un código de 6 letras o un enlace.
- **Menú semanal compartido**: un plan por familia y por semana (lunes a
  domingo). Cualquier integrante elige desayuno, almuerzo y cena; se ve quién
  eligió cada comida y los cambios aparecen en vivo para todos.
- **Lista de mercado** automática con descarga en PDF.
- **Comentarios** en cada receta y en cada menú semanal, privados de la familia.
- **Favoritos** por usuario (los que estaban guardados en el navegador se suben
  a la cuenta al ingresar por primera vez).

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
2. **Authentication → Sign In / Providers → Google**: actívalo con un
   *Client ID* y *Client Secret* de Google Cloud (APIs y servicios →
   Credenciales → ID de cliente OAuth, tipo “Aplicación web”). En Google, la
   *URI de redireccionamiento autorizada* debe ser
   `https://nredvzzxzgsckyyhfnqk.supabase.co/auth/v1/callback`.
