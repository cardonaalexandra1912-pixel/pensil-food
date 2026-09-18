import { useMemo } from 'react'
import { CATEGORIAS, recetas } from '../data/recetas'
import { DIAS_SEMANA, useMenuSemanal } from '../hooks/useMenuSemanal'
import { agruparIngredientes } from '../utils/ingredientes'
import EstadoVacio from '../components/EstadoVacio'
import './MenuSemanal.css'

// Página de Menú Semanal: 7 tarjetas (una por día) para elegir desayuno, almuerzo
// y cena, más una lista de mercado que se arma sola con los ingredientes de lo elegido.
function MenuSemanal() {
  const { menu, seleccionarReceta, limpiarMenu } = useMenuSemanal()

  // El select de Desayuno solo muestra recetas de categoría "Desayunos".
  const recetasDesayuno = useMemo(() => recetas.filter((receta) => receta.categoria === 'Desayunos'), [])

  // Agrupamos el resto de categorías (todo menos Desayunos) una sola vez, para
  // usarlas como <optgroup> en los selects de Almuerzo y Cena (así son más
  // fáciles de recorrer visualmente y no repiten las opciones de desayuno).
  const recetasPorCategoria = useMemo(
    () =>
      CATEGORIAS.filter((categoria) => categoria !== 'Desayunos')
        .map((categoria) => ({
          categoria,
          items: recetas.filter((receta) => receta.categoria === categoria),
        }))
        .filter((grupo) => grupo.items.length > 0),
    []
  )

  // Todas las recetas seleccionadas en la semana (desayunos + almuerzos + cenas de los 7 días)
  const recetasSeleccionadas = useMemo(() => {
    const ids = []
    DIAS_SEMANA.forEach((dia) => {
      if (menu[dia].desayuno) ids.push(Number(menu[dia].desayuno))
      if (menu[dia].almuerzo) ids.push(Number(menu[dia].almuerzo))
      if (menu[dia].cena) ids.push(Number(menu[dia].cena))
    })
    return ids.map((id) => recetas.find((r) => r.id === id)).filter(Boolean)
  }, [menu])

  // Lista de mercado: junta todos los ingredientes (a su cantidad base) de las
  // recetas seleccionadas y los agrupa por nombre + unidad, sumando cantidades
  // cuando corresponde (ver agruparIngredientes en utils/ingredientes.js).
  const listaMercado = useMemo(() => {
    const todosLosIngredientes = recetasSeleccionadas.flatMap((receta) => receta.ingredientes)
    return agruparIngredientes(todosLosIngredientes)
  }, [recetasSeleccionadas])

  return (
    <div className="contenido-pagina">
      <div className="contenedor seccion">
        <div className="encabezado-seccion">
          <h1>Menú Semanal</h1>
          <button type="button" className="boton boton-contorno" onClick={limpiarMenu}>
            Limpiar semana
          </button>
        </div>
        <p className="menu-semanal-intro">
          Elige el desayuno, el almuerzo y la cena de cada día. La lista de mercado se arma sola
          con lo que selecciones.
        </p>

        {/* --- Grid de 7 días --- */}
        <div className="menu-semanal-grid">
          {DIAS_SEMANA.map((dia) => (
            <div key={dia} className="dia-card">
              <h3>{dia}</h3>

              <label className="dia-card-label" htmlFor={`${dia}-desayuno`}>
                Desayuno
              </label>
              <select
                id={`${dia}-desayuno`}
                className="campo-formulario"
                value={menu[dia].desayuno}
                onChange={(e) => seleccionarReceta(dia, 'desayuno', e.target.value)}
              >
                <option value="">Sin seleccionar</option>
                {recetasDesayuno.map((receta) => (
                  <option key={receta.id} value={receta.id}>
                    {receta.nombre}
                  </option>
                ))}
              </select>

              <label className="dia-card-label" htmlFor={`${dia}-almuerzo`}>
                Almuerzo
              </label>
              <select
                id={`${dia}-almuerzo`}
                className="campo-formulario"
                value={menu[dia].almuerzo}
                onChange={(e) => seleccionarReceta(dia, 'almuerzo', e.target.value)}
              >
                <option value="">Sin seleccionar</option>
                {recetasPorCategoria.map((grupo) => (
                  <optgroup key={grupo.categoria} label={grupo.categoria}>
                    {grupo.items.map((receta) => (
                      <option key={receta.id} value={receta.id}>
                        {receta.nombre}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              <label className="dia-card-label" htmlFor={`${dia}-cena`}>
                Cena
              </label>
              <select
                id={`${dia}-cena`}
                className="campo-formulario"
                value={menu[dia].cena}
                onChange={(e) => seleccionarReceta(dia, 'cena', e.target.value)}
              >
                <option value="">Sin seleccionar</option>
                {recetasPorCategoria.map((grupo) => (
                  <optgroup key={grupo.categoria} label={grupo.categoria}>
                    {grupo.items.map((receta) => (
                      <option key={receta.id} value={receta.id}>
                        {receta.nombre}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* --- Lista de mercado --- */}
        <section className="lista-mercado">
          <h2>🛒 Lista de Mercado</h2>

          {listaMercado.length === 0 ? (
            <EstadoVacio
              icono="🛒"
              titulo="Aún no hay nada en tu lista"
              mensaje="Selecciona las comidas de la semana y aquí aparecerán automáticamente los ingredientes que necesitas comprar."
            />
          ) : (
            <ul className="lista-mercado-items">
              {listaMercado.map((item) => (
                <li key={`${item.claveNombre}|${item.texto}`}>
                  <span>{item.texto}</span>
                  {!item.esNumerico && item.veces > 1 && (
                    <span className="lista-mercado-cantidad">×{item.veces}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

export default MenuSemanal
