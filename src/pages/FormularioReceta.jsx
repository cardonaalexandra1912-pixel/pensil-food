import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ClipboardPaste, ImageOff, Lock, Minus, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useRecetas } from '../context/RecetasContext'
import { CATEGORIAS, DIFICULTADES, iconoDeCategoria, recetaDesdeDb, recetaHaciaDb } from '../data/catalogo'
import { mensajeError, supabase } from '../lib/supabase'
import { ingredienteDesdeTexto, pasosDesdeTexto } from '../utils/ingredientes'
import AvisoSinFamilia from '../components/AvisoSinFamilia'
import Cargando from '../components/Cargando'
import EstadoVacio from '../components/EstadoVacio'
import './DetalleReceta.css'
import './FormularioReceta.css'

const INGREDIENTE_VACIO = { cantidad: '', unidad: '', nombre: '' }
const PASO_TIEMPO = 5
const MAX_PORCIONES = 50

function formularioVacio() {
  return {
    nombre: '',
    categoria: '',
    dificultad: DIFICULTADES[0],
    tiempoPreparacion: 30,
    porciones: 2,
    imagen: '',
    descripcion: '',
    ingredientes: [{ ...INGREDIENTE_VACIO }],
    pasos: [''],
  }
}

function formularioDesdeReceta(receta) {
  return {
    nombre: receta.nombre,
    categoria: receta.categoria,
    dificultad: receta.dificultad,
    tiempoPreparacion: receta.tiempoPreparacion,
    porciones: receta.porciones,
    imagen: receta.imagenOriginal,
    descripcion: receta.descripcion,
    ingredientes: receta.ingredientes.length
      ? receta.ingredientes.map((i) => ({
          cantidad: i.cantidadBase == null ? '' : String(i.cantidadBase),
          unidad: i.unidad || '',
          nombre: i.nombre,
        }))
      : [{ ...INGREDIENTE_VACIO }],
    pasos: receta.pasos.length ? [...receta.pasos] : [''],
  }
}

// El borrador de una receta nueva se guarda en este teléfono mientras se escribe.
function claveBorrador(usuarioId) {
  return `pensil-food:borrador-receta:${usuarioId}`
}

function leerBorrador(usuarioId) {
  try {
    return JSON.parse(localStorage.getItem(claveBorrador(usuarioId)))
  } catch {
    return null
  }
}

function guardarBorrador(usuarioId, form) {
  try {
    localStorage.setItem(claveBorrador(usuarioId), JSON.stringify(form))
  } catch {
    // Sin almacenamiento (modo privado): no hay borrador, pero se puede guardar igual.
  }
}

function borrarBorrador(usuarioId) {
  try {
    localStorage.removeItem(claveBorrador(usuarioId))
  } catch {
    // Igual que arriba.
  }
}

// Crear (/recetas/nueva) o editar (/recetas/:id/editar) una receta de la familia.
function FormularioReceta() {
  const { id } = useParams()
  const esEdicion = Boolean(id)
  const { usuario, familia } = useAuth()
  const { recetaPorId, cargando } = useRecetas()
  const recetaExistente = esEdicion ? recetaPorId(id) : null

  if (!familia) {
    return (
      <div className="contenido-pagina">
        <div className="contenedor formulario">
          <h1 className="formulario-titulo">Nueva receta</h1>
          <AvisoSinFamilia mensaje="Las recetas que agregas se guardan en el recetario de tu familia." />
        </div>
      </div>
    )
  }

  if (esEdicion && cargando) {
    return (
      <div className="contenido-pagina">
        <Cargando />
      </div>
    )
  }

  if (esEdicion && (!recetaExistente || recetaExistente.familiaId !== familia.id)) {
    return (
      <div className="contenido-pagina">
        <div className="contenedor seccion">
          <EstadoVacio
            icono={Lock}
            titulo="No puedes editar esta receta"
            mensaje="Solo se pueden editar las recetas que agregó tu familia."
          />
        </div>
      </div>
    )
  }

  const inicial = esEdicion ? formularioDesdeReceta(recetaExistente) : formularioVacio()
  const borrador = esEdicion ? null : leerBorrador(usuario.id)
  return (
    <Formulario
      key={id || 'nueva'}
      recetaId={esEdicion ? Number(id) : null}
      inicial={inicial}
      borrador={borrador}
    />
  )
}

function Formulario({ recetaId, inicial, borrador }) {
  const esEdicion = recetaId != null
  const { usuario, familia } = useAuth()
  const { recargar } = useRecetas()
  const navigate = useNavigate()
  const [form, setForm] = useState(borrador || inicial)
  const [recuperado, setRecuperado] = useState(Boolean(borrador))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [falloFoto, setFalloFoto] = useState(false)
  const [pegando, setPegando] = useState(null) // 'ingredientes' | 'pasos' | null
  const [enfocar, setEnfocar] = useState(null) // id del campo que debe recibir el foco
  const errorRef = useRef(null)

  const sinCambios = JSON.stringify(form) === JSON.stringify(inicial)

  // Borrador de la receta nueva, y aviso al cerrar la pestaña con cambios sin guardar.
  useEffect(() => {
    if (esEdicion || guardando) return
    if (sinCambios) borrarBorrador(usuario.id)
    else guardarBorrador(usuario.id, form)
  }, [form, sinCambios, esEdicion, guardando, usuario.id])

  useEffect(() => {
    if (sinCambios || guardando) return undefined
    function alSalir(evento) {
      evento.preventDefault()
    }
    window.addEventListener('beforeunload', alSalir)
    return () => window.removeEventListener('beforeunload', alSalir)
  }, [sinCambios, guardando])

  useEffect(() => {
    if (!enfocar) return
    document.getElementById(enfocar)?.focus()
    setEnfocar(null)
  }, [enfocar])

  function cambiar(campo, valor) {
    setForm((actual) => ({ ...actual, [campo]: valor }))
  }

  function cambiarIngrediente(indice, campo, valor) {
    setForm((actual) => ({
      ...actual,
      ingredientes: actual.ingredientes.map((ing, i) => (i === indice ? { ...ing, [campo]: valor } : ing)),
    }))
  }

  function cambiarPaso(indice, valor) {
    setForm((actual) => ({ ...actual, pasos: actual.pasos.map((p, i) => (i === indice ? valor : p)) }))
  }

  function quitarDeLista(campo, indice) {
    setForm((actual) => ({ ...actual, [campo]: actual[campo].filter((_, i) => i !== indice) }))
  }

  function agregarIngrediente() {
    const nuevo = form.ingredientes.length
    cambiar('ingredientes', [...form.ingredientes, { ...INGREDIENTE_VACIO }])
    setEnfocar(`ingrediente-${nuevo}-nombre`)
  }

  function agregarPaso() {
    const nuevo = form.pasos.length
    cambiar('pasos', [...form.pasos, ''])
    setEnfocar(`paso-${nuevo}`)
  }

  // Lo pegado reemplaza las filas vacías y se suma a las que ya tienen algo.
  function agregarPegado(texto) {
    if (pegando === 'ingredientes') {
      const nuevos = texto
        .split('\n')
        .map((linea) => linea.trim())
        .filter(Boolean)
        .map(ingredienteDesdeTexto)
      const actuales = form.ingredientes.filter((i) => i.nombre.trim() || i.cantidad.trim())
      cambiar('ingredientes', [...actuales, ...nuevos])
    } else {
      const actuales = form.pasos.filter((p) => p.trim())
      cambiar('pasos', [...actuales, ...pasosDesdeTexto(texto)])
    }
    setPegando(null)
  }

  function empezarDeCero() {
    borrarBorrador(usuario.id)
    setForm(inicial)
    setRecuperado(false)
  }

  function mostrarError(mensaje) {
    setError(mensaje)
    requestAnimationFrame(() => errorRef.current?.scrollIntoView({ block: 'center' }))
  }

  async function guardar(evento) {
    evento.preventDefault()
    setError('')

    const ingredientes = form.ingredientes
      .filter((i) => i.nombre.trim())
      .map((i) => {
        const cantidad = Number(String(i.cantidad).replace(',', '.'))
        const tieneCantidad = String(i.cantidad).trim() !== '' && Number.isFinite(cantidad) && cantidad > 0
        return {
          cantidadBase: tieneCantidad ? cantidad : null,
          unidad: tieneCantidad ? i.unidad.trim() : '',
          nombre: i.nombre.trim(),
        }
      })
    const pasos = form.pasos.map((p) => p.trim()).filter(Boolean)

    if (!form.categoria) return mostrarError('Elige una categoría.')
    if (ingredientes.length === 0) return mostrarError('Agrega al menos un ingrediente.')
    if (pasos.length === 0) return mostrarError('Agrega al menos un paso de preparación.')

    const fila = recetaHaciaDb({ ...form, ingredientes, pasos })
    setGuardando(true)
    try {
      let idGuardado = recetaId
      if (esEdicion) {
        const { error: errorGuardar } = await supabase.from('recetas').update(fila).eq('id', recetaId)
        if (errorGuardar) throw errorGuardar
      } else {
        const { data, error: errorGuardar } = await supabase
          .from('recetas')
          .insert({ ...fila, familia_id: familia.id, creada_por: usuario.id })
          .select('id')
          .single()
        if (errorGuardar) throw errorGuardar
        idGuardado = data.id
        borrarBorrador(usuario.id)
      }
      await recargar()
      navigate(`/recetas/${idGuardado}`, { replace: true })
    } catch (e) {
      mostrarError(mensajeError(e))
      setGuardando(false)
    }
  }

  const vistaFoto = recetaDesdeDb({ imagen: form.imagen.trim() }).imagen
  const volverA = esEdicion ? `/recetas/${recetaId}` : '/recetas'

  return (
    <div className="contenido-pagina">
      <div className="contenedor formulario">
        <header className="formulario-cabecera">
          <h1 className="formulario-titulo">{esEdicion ? 'Editar receta' : 'Nueva receta'}</h1>
          <p className="formulario-intro">
            Queda en el recetario de {familia.nombre}: solo tu familia la ve y la puede poner en el menú.
          </p>
        </header>

        {recuperado && (
          <p className="formulario-recuperado">
            Seguimos donde ibas: recuperamos la receta que no alcanzaste a guardar.
            <button type="button" onClick={empezarDeCero}>
              Empezar de cero
            </button>
          </p>
        )}

        <form className="formulario-receta" onSubmit={guardar}>
          {/* --- Lo básico --- */}
          <section className="formulario-seccion" aria-labelledby="formulario-basico">
            <h2 id="formulario-basico" className="solo-lectores">
              Lo básico
            </h2>
            <div className="formulario-campo">
              <label htmlFor="receta-nombre">Nombre de la receta</label>
              <input
                id="receta-nombre"
                className="campo-formulario formulario-nombre"
                placeholder="Ej. Ajiaco de la abuela"
                value={form.nombre}
                onChange={(e) => cambiar('nombre', e.target.value)}
                maxLength={120}
                required
              />
            </div>

            <fieldset className="formulario-campo">
              <legend>Categoría</legend>
              <div className="formulario-opciones">
                {CATEGORIAS.map((categoria) => {
                  const Icono = iconoDeCategoria(categoria)
                  return (
                    <label key={categoria} className="formulario-opcion">
                      <input
                        type="radio"
                        name="categoria"
                        value={categoria}
                        checked={form.categoria === categoria}
                        onChange={() => cambiar('categoria', categoria)}
                      />
                      <Icono size={18} aria-hidden="true" />
                      {categoria}
                    </label>
                  )
                })}
              </div>
            </fieldset>

            <div className="formulario-fila">
              <Contador
                id="receta-tiempo"
                etiqueta="Tiempo"
                sufijo="min"
                valor={form.tiempoPreparacion}
                min={0}
                paso={PASO_TIEMPO}
                alCambiar={(valor) => cambiar('tiempoPreparacion', valor)}
              />
              <Contador
                id="receta-porciones"
                etiqueta="Porciones"
                valor={form.porciones}
                min={1}
                max={MAX_PORCIONES}
                alCambiar={(valor) => cambiar('porciones', valor)}
              />
            </div>

            <fieldset className="formulario-campo">
              <legend>Dificultad</legend>
              <div className="formulario-segmentos">
                {DIFICULTADES.map((dificultad) => (
                  <label key={dificultad} className="formulario-segmento">
                    <input
                      type="radio"
                      name="dificultad"
                      value={dificultad}
                      checked={form.dificultad === dificultad}
                      onChange={() => cambiar('dificultad', dificultad)}
                    />
                    {dificultad}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="formulario-campo">
              <label htmlFor="receta-descripcion">
                Descripción <span className="formulario-opcional">(opcional)</span>
              </label>
              <textarea
                id="receta-descripcion"
                className="campo-formulario"
                rows={3}
                placeholder="¿Qué la hace especial? ¿Para cuándo es ideal?"
                value={form.descripcion}
                onChange={(e) => cambiar('descripcion', e.target.value)}
              />
            </div>

            <div className="formulario-campo">
              <label htmlFor="receta-foto">
                Foto <span className="formulario-opcional">(opcional)</span>
              </label>
              <div className="formulario-foto">
                <div className="formulario-foto-vista" aria-hidden="true">
                  {vistaFoto && !falloFoto ? (
                    <img src={vistaFoto} alt="" onError={() => setFalloFoto(true)} />
                  ) : (
                    <ImageOff size={22} />
                  )}
                </div>
                <div className="formulario-foto-campo">
                  <input
                    id="receta-foto"
                    type="url"
                    className="campo-formulario"
                    placeholder="Pega el enlace de una imagen"
                    value={form.imagen}
                    onChange={(e) => {
                      setFalloFoto(false)
                      cambiar('imagen', e.target.value)
                    }}
                    aria-describedby="receta-foto-ayuda"
                  />
                  <p id="receta-foto-ayuda" className="formulario-ayuda">
                    {falloFoto
                      ? 'No pudimos abrir esa imagen. Revisa que el enlace termine en .jpg, .png o .webp.'
                      : 'Sin foto, la receta muestra el ícono de su categoría.'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* --- Ingredientes --- */}
          <section className="formulario-seccion" aria-labelledby="formulario-ingredientes">
            <div className="formulario-seccion-cabecera">
              <h2 id="formulario-ingredientes">Ingredientes</h2>
              <button type="button" className="formulario-pegar" onClick={() => setPegando('ingredientes')}>
                <ClipboardPaste size={18} aria-hidden="true" /> Pegar una lista
              </button>
            </div>
            <p className="formulario-ayuda">
              Para {form.porciones} {Number(form.porciones) === 1 ? 'porción' : 'porciones'}. Sin cantidad, queda «al
              gusto» y no cambia con las porciones.
            </p>
            {pegando === 'ingredientes' && (
              <PanelPegar
                ejemplo={'2 tazas de arroz\n1/2 cdta de sal\n3 huevos\nCilantro al gusto'}
                ayuda="Uno por renglón. Separamos la cantidad, la unidad y el ingrediente."
                alAgregar={agregarPegado}
                alCancelar={() => setPegando(null)}
              />
            )}
            <ol className="formulario-ingredientes">
              {form.ingredientes.map((ingrediente, indice) => (
                <li key={indice} className="formulario-ingrediente">
                  <input
                    id={`ingrediente-${indice}-nombre`}
                    className="campo-formulario formulario-ingrediente-nombre"
                    placeholder="Ingrediente"
                    value={ingrediente.nombre}
                    onChange={(e) => cambiarIngrediente(indice, 'nombre', e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (indice === form.ingredientes.length - 1) agregarIngrediente()
                        else setEnfocar(`ingrediente-${indice + 1}-nombre`)
                      }
                    }}
                    enterKeyHint="next"
                    aria-label={`Ingrediente ${indice + 1}`}
                  />
                  <input
                    className="campo-formulario formulario-ingrediente-cantidad"
                    placeholder="Cant."
                    inputMode="decimal"
                    value={ingrediente.cantidad}
                    onChange={(e) => cambiarIngrediente(indice, 'cantidad', e.target.value)}
                    aria-label={`Cantidad del ingrediente ${indice + 1}`}
                  />
                  <input
                    className="campo-formulario formulario-ingrediente-unidad"
                    placeholder="Unidad"
                    list="unidades-comunes"
                    value={ingrediente.unidad}
                    onChange={(e) => cambiarIngrediente(indice, 'unidad', e.target.value)}
                    aria-label={`Unidad del ingrediente ${indice + 1}`}
                  />
                  <button
                    type="button"
                    className="formulario-quitar"
                    onClick={() => quitarDeLista('ingredientes', indice)}
                    disabled={form.ingredientes.length === 1}
                    aria-label={`Quitar ingrediente ${indice + 1}`}
                  >
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ol>
            <datalist id="unidades-comunes">
              {['tazas', 'cdas', 'cdtas', 'g', 'kg', 'lb', 'ml', 'dientes', 'pizca', 'puñado', 'unidades'].map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
            <button type="button" className="formulario-agregar" onClick={agregarIngrediente}>
              <Plus size={18} aria-hidden="true" /> Agregar ingrediente
            </button>
          </section>

          {/* --- Preparación --- */}
          <section className="formulario-seccion" aria-labelledby="formulario-pasos">
            <div className="formulario-seccion-cabecera">
              <h2 id="formulario-pasos">Preparación</h2>
              <button type="button" className="formulario-pegar" onClick={() => setPegando('pasos')}>
                <ClipboardPaste size={18} aria-hidden="true" /> Pegar los pasos
              </button>
            </div>
            {pegando === 'pasos' && (
              <PanelPegar
                ejemplo={'1. Lava el arroz.\n2. Sofríe la cebolla y el ajo.\n3. Agrega el agua y cocina 20 minutos.'}
                ayuda="Un paso por renglón. Si ya vienen numerados, quitamos los números."
                alAgregar={agregarPegado}
                alCancelar={() => setPegando(null)}
              />
            )}
            <ol className="formulario-pasos">
              {form.pasos.map((paso, indice) => (
                <li key={indice} className="formulario-paso">
                  <span className="detalle-paso-numero" aria-hidden="true">
                    {indice + 1}
                  </span>
                  <textarea
                    id={`paso-${indice}`}
                    className="campo-formulario"
                    rows={2}
                    placeholder={indice === 0 ? 'Ej. Lava el arroz y déjalo escurrir.' : 'Siguiente paso'}
                    value={paso}
                    onChange={(e) => cambiarPaso(indice, e.target.value)}
                    aria-label={`Paso ${indice + 1}`}
                  />
                  <button
                    type="button"
                    className="formulario-quitar"
                    onClick={() => quitarDeLista('pasos', indice)}
                    disabled={form.pasos.length === 1}
                    aria-label={`Quitar paso ${indice + 1}`}
                  >
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ol>
            <button type="button" className="formulario-agregar" onClick={agregarPaso}>
              <Plus size={18} aria-hidden="true" /> Agregar paso
            </button>
          </section>

          {/* --- Guardar: siempre a mano, pegado abajo --- */}
          <div className="formulario-barra">
            {error && (
              <p ref={errorRef} className="mensaje-error" role="alert">
                {error}
              </p>
            )}
            <div className="formulario-barra-botones">
              <Link to={volverA} className="boton boton-contorno">
                Cancelar
              </Link>
              <button type="submit" className="boton boton-primario" disabled={guardando}>
                {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Guardar receta'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// Número con botones − / + (tiempo de preparación y porciones).
function Contador({ id, etiqueta, sufijo, valor, min, max, paso = 1, alCambiar }) {
  const numero = Number(valor) || 0
  return (
    <div className="formulario-campo">
      <label htmlFor={id}>{etiqueta}</label>
      <div className={`formulario-contador ${sufijo ? 'con-sufijo' : ''}`}>
        <button
          type="button"
          onClick={() => alCambiar(Math.max(min, numero - paso))}
          disabled={numero <= min}
          aria-label={`Menos ${etiqueta.toLowerCase()}`}
        >
          <Minus size={18} aria-hidden="true" />
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={valor}
          onChange={(e) => alCambiar(e.target.value)}
          required
        />
        {sufijo && <span aria-hidden="true">{sufijo}</span>}
        <button
          type="button"
          onClick={() => alCambiar(max ? Math.min(max, numero + paso) : numero + paso)}
          disabled={max != null && numero >= max}
          aria-label={`Más ${etiqueta.toLowerCase()}`}
        >
          <Plus size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

function PanelPegar({ ejemplo, ayuda, alAgregar, alCancelar }) {
  const [texto, setTexto] = useState('')
  return (
    <div className="formulario-pegado">
      <label htmlFor="formulario-pegado-texto" className="solo-lectores">
        Texto para pegar
      </label>
      <textarea
        id="formulario-pegado-texto"
        className="campo-formulario"
        rows={5}
        placeholder={ejemplo}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        autoFocus
      />
      <p className="formulario-ayuda">{ayuda}</p>
      <div className="formulario-pegado-botones">
        <button type="button" className="boton boton-secundario boton-chico" onClick={() => alAgregar(texto)} disabled={!texto.trim()}>
          Agregar a la lista
        </button>
        <button type="button" className="formulario-pegar" onClick={alCancelar}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

export default FormularioReceta
