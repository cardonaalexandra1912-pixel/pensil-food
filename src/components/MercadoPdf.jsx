import { useEffect, useMemo, useRef, useState } from 'react'
import { Download, Send, X } from 'lucide-react'
import { MOMENTOS } from '../data/catalogo'
import { useAuth } from '../context/AuthContext'
import { useRecetas } from '../context/RecetasContext'
import { DIAS_SEMANA, contarComidasLlenas, leerMenuDeSemana, recetasDelMenu } from '../hooks/useMenuSemanal'
import { armarListaMercado, gruposDeCompra, textoWhatsapp } from '../utils/listaMercado'
import { descargarListaMercadoPdf } from '../utils/listaMercadoPdf'
import { fechaISO, sumarDias, textoSemana } from '../utils/fechas'
import './MercadoPdf.css'

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

// «23 nov – 6 dic»
function textoRango(desde, hasta) {
  return `${desde.getDate()} ${MESES_CORTOS[desde.getMonth()]} – ${hasta.getDate()} ${MESES_CORTOS[hasta.getMonth()]}`
}

// Hoja para sacar la lista de mercado: de esta semana o de esta y la
// siguiente juntas, en PDF o por WhatsApp. Se abre desde un botón que siempre
// está a la mano en el menú, para no tener que bajar hasta el final.
function MercadoPdf({ lunes, menu, alCerrar }) {
  const dialogoRef = useRef(null)
  const { familia } = useAuth()
  const { recetaPorId, productos } = useRecetas()
  const [semanas, setSemanas] = useState(1)
  const [menuSiguiente, setMenuSiguiente] = useState(null)
  const [error, setError] = useState('')
  const [generando, setGenerando] = useState(false)
  const lunesSiguiente = useMemo(() => sumarDias(lunes, 7), [lunes])

  useEffect(() => {
    const dialogo = dialogoRef.current
    if (dialogo && !dialogo.open) dialogo.showModal()
  }, [])

  // La semana siguiente se trae al abrir, para mostrar cuánto suma.
  useEffect(() => {
    let cancelado = false
    leerMenuDeSemana(familia.id, lunesSiguiente)
      .then((leido) => !cancelado && setMenuSiguiente(leido))
      .catch(() => !cancelado && setError('No pudimos leer la semana siguiente.'))
    return () => {
      cancelado = true
    }
  }, [familia.id, lunesSiguiente])

  const opciones = useMemo(() => {
    const una = { menus: [{ lunes, menu }], hasta: sumarDias(lunes, 6) }
    const dos = menuSiguiente && {
      menus: [
        { lunes, menu },
        { lunes: lunesSiguiente, menu: menuSiguiente },
      ],
      hasta: sumarDias(lunes, 13),
    }
    return [una, dos].map((opcion) => {
      if (!opcion) return null
      const recetas = opcion.menus.flatMap(({ menu: m }) => recetasDelMenu(m, recetaPorId))
      const lista = armarListaMercado(recetas, productos)
      const comidas = opcion.menus.reduce((total, { menu: m }) => total + contarComidasLlenas(m), 0)
      return { ...opcion, lista, comidas, rango: textoRango(lunes, opcion.hasta) }
    })
  }, [lunes, lunesSiguiente, menu, menuSiguiente, recetaPorId, productos])

  const elegida = opciones[semanas - 1]
  const siguienteVacia = menuSiguiente && contarComidasLlenas(menuSiguiente) === 0

  async function descargar() {
    if (!elegida) return
    const dias = elegida.menus.flatMap(({ lunes: l, menu: m }) =>
      DIAS_SEMANA.map((dia, indice) => ({
        dia: `${dia} ${sumarDias(l, indice).getDate()}`,
        comidas: MOMENTOS.map(({ clave, etiqueta }) => ({
          momento: etiqueta,
          nombre: m[indice][clave]
            .map((item) => recetaPorId(item.receta_id)?.nombre)
            .filter(Boolean)
            .join(' + '),
        })).filter((comida) => comida.nombre),
      })).filter((dia) => dia.comidas.length > 0),
    )
    setGenerando(true)
    try {
      await descargarListaMercadoPdf(dias, gruposDeCompra(elegida.lista), elegida.lista.despensa, {
        rango: elegida.rango,
        nombre: `mercado-${fechaISO(lunes)}${semanas === 2 ? '-2-semanas' : ''}.pdf`,
      })
    } finally {
      setGenerando(false)
    }
  }

  function enviar() {
    if (!elegida) return
    const texto = textoWhatsapp(elegida.lista, `Lista de mercado (${elegida.rango})`)
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener')
  }

  return (
    <dialog
      ref={dialogoRef}
      className="selector-receta mercado-pdf"
      aria-labelledby="mercado-pdf-titulo"
      onClose={alCerrar}
      onClick={(evento) => {
        if (evento.target === dialogoRef.current) dialogoRef.current.close()
      }}
    >
      <div className="selector-receta-hoja">
        <div className="selector-receta-cabecera">
          <h2 id="mercado-pdf-titulo">Lista de mercado</h2>
          <button
            type="button"
            className="selector-receta-cerrar"
            onClick={() => dialogoRef.current.close()}
            aria-label="Cerrar"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <div className="mercado-pdf-opciones" role="radiogroup" aria-label="Semanas que incluye">
          {[
            { valor: 1, titulo: 'Esta semana', opcion: opciones[0] },
            { valor: 2, titulo: 'Esta y la siguiente', opcion: opciones[1] },
          ].map(({ valor, titulo, opcion }) => (
            <button
              key={valor}
              type="button"
              role="radio"
              aria-checked={semanas === valor}
              className="mercado-pdf-opcion"
              disabled={!opcion}
              onClick={() => setSemanas(valor)}
            >
              <strong>{titulo}</strong>
              <span>{opcion ? opcion.rango : 'Cargando…'}</span>
              {opcion && (
                <span className="mercado-pdf-cuenta">
                  {opcion.lista.totalPorComprar} productos · {opcion.comidas} comidas
                </span>
              )}
            </button>
          ))}
        </div>

        {semanas === 2 && siguienteVacia && (
          <p className="mercado-pdf-aviso">
            La semana del {textoSemana(lunesSiguiente)} todavía no tiene comidas: la lista sale igual a la de esta
            semana.
          </p>
        )}
        {error && <p className="mensaje-error">{error}</p>}

        <div className="mercado-pdf-acciones">
          <button type="button" className="boton boton-primario" onClick={descargar} disabled={!elegida || generando}>
            <Download aria-hidden="true" />
            {generando ? 'Preparando PDF…' : 'Descargar PDF'}
          </button>
          <button type="button" className="boton boton-secundario" onClick={enviar} disabled={!elegida}>
            <Send aria-hidden="true" /> Enviar por WhatsApp
          </button>
        </div>
      </div>
    </dialog>
  )
}

export default MercadoPdf
