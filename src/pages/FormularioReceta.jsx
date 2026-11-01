import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useRecetas } from '../context/RecetasContext'
import { CATEGORIAS, DIFICULTADES, recetaHaciaDb } from '../data/catalogo'
import { mensajeError, supabase } from '../lib/supabase'
import AvisoSinFamilia from '../components/AvisoSinFamilia'
import Cargando from '../components/Cargando'
import EstadoVacio from '../components/EstadoVacio'
import './DetalleReceta.css'
import './FormularioReceta.css'

const INGREDIENTE_VACIO = { cantidad: '', unidad: '', nombre: '' }

function formularioVacio() {
  return {
    nombre: '',
    categoria: CATEGORIAS[0],
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

// Crear (/recetas/nueva) o editar (/recetas/:id/editar) una receta de la familia.
function FormularioReceta() {
  const { id } = useParams()
  const esEdicion = Boolean(id)
  const { usuario, familia } = useAuth()
  const { recetaPorId, recargar, cargando } = useRecetas()
  const navigate = useNavigate()
  const recetaExistente = esEdicion ? recetaPorId(id) : null

  const [form, setForm] = useState(formularioVacio)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (recetaExistente) setForm(formularioDesdeReceta(recetaExistente))
  }, [recetaExistente])

  if (!familia) {
    return (
      <div className="contenido-pagina">
        <div className="contenedor seccion">
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
            icono="🔒"
            titulo="No puedes editar esta receta"
            mensaje="Solo se pueden editar las recetas que agregó tu familia."
          />
        </div>
      </div>
    )
  }

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

    if (ingredientes.length === 0) {
      setError('Agrega al menos un ingrediente.')
      return
    }
    if (pasos.length === 0) {
      setError('Agrega al menos un paso de preparación.')
      return
    }

    const fila = recetaHaciaDb({ ...form, ingredientes, pasos })
    setGuardando(true)
    try {
      let recetaId = Number(id)
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
        recetaId = data.id
      }
      await recargar()
      navigate(`/recetas/${recetaId}`)
    } catch (e) {
      setError(mensajeError(e))
      setGuardando(false)
    }
  }

  return (
    <div className="contenido-pagina">
      <div className="contenedor seccion">
        <Link to={esEdicion ? `/recetas/${id}` : '/recetas'} className="detalle-volver">
          ← Volver
        </Link>
        <h1 className="formulario-titulo">{esEdicion ? 'Editar receta' : 'Nueva receta'}</h1>
        <p className="formulario-intro">
          Se guardará en el recetario de <strong>{familia.nombre}</strong>: solo los integrantes de tu
          familia la verán y podrán usarla en el menú semanal.
        </p>

        <form className="formulario-receta tarjeta" onSubmit={guardar}>
          <div className="formulario-grid">
            <label className="formulario-campo formulario-ancho">
              Nombre
              <input
                className="campo-formulario"
                value={form.nombre}
                onChange={(e) => cambiar('nombre', e.target.value)}
                maxLength={120}
                required
              />
            </label>
            <label className="formulario-campo">
              Categoría
              <select
                className="campo-formulario"
                value={form.categoria}
                onChange={(e) => cambiar('categoria', e.target.value)}
              >
                {CATEGORIAS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="formulario-campo">
              Dificultad
              <select
                className="campo-formulario"
                value={form.dificultad}
                onChange={(e) => cambiar('dificultad', e.target.value)}
              >
                {DIFICULTADES.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label className="formulario-campo">
              Tiempo (minutos)
              <input
                type="number"
                min={0}
                className="campo-formulario"
                value={form.tiempoPreparacion}
                onChange={(e) => cambiar('tiempoPreparacion', e.target.value)}
                required
              />
            </label>
            <label className="formulario-campo">
              Porciones
              <input
                type="number"
                min={1}
                max={50}
                className="campo-formulario"
                value={form.porciones}
                onChange={(e) => cambiar('porciones', e.target.value)}
                required
              />
            </label>
            <label className="formulario-campo formulario-ancho">
              Foto (enlace a una imagen, opcional)
              <input
                type="url"
                className="campo-formulario"
                placeholder="https://…"
                value={form.imagen}
                onChange={(e) => cambiar('imagen', e.target.value)}
              />
            </label>
            <label className="formulario-campo formulario-ancho">
              Descripción
              <textarea
                className="campo-formulario"
                rows={3}
                value={form.descripcion}
                onChange={(e) => cambiar('descripcion', e.target.value)}
              />
            </label>
          </div>

          <fieldset className="formulario-lista">
            <legend>Ingredientes</legend>
            <p className="formulario-ayuda">
              Deja la cantidad vacía para ingredientes “al gusto” (no se escalan con las porciones).
            </p>
            {form.ingredientes.map((ingrediente, indice) => (
              <div key={indice} className="formulario-ingrediente">
                <input
                  className="campo-formulario"
                  placeholder="Cant."
                  inputMode="decimal"
                  value={ingrediente.cantidad}
                  onChange={(e) => cambiarIngrediente(indice, 'cantidad', e.target.value)}
                  aria-label={`Cantidad del ingrediente ${indice + 1}`}
                />
                <input
                  className="campo-formulario"
                  placeholder="Unidad (tazas, g…)"
                  value={ingrediente.unidad}
                  onChange={(e) => cambiarIngrediente(indice, 'unidad', e.target.value)}
                  aria-label={`Unidad del ingrediente ${indice + 1}`}
                />
                <input
                  className="campo-formulario"
                  placeholder="Ingrediente"
                  value={ingrediente.nombre}
                  onChange={(e) => cambiarIngrediente(indice, 'nombre', e.target.value)}
                  aria-label={`Nombre del ingrediente ${indice + 1}`}
                />
                <button
                  type="button"
                  className="formulario-quitar"
                  onClick={() => quitarDeLista('ingredientes', indice)}
                  disabled={form.ingredientes.length === 1}
                  aria-label={`Quitar ingrediente ${indice + 1}`}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="boton boton-contorno"
              onClick={() => cambiar('ingredientes', [...form.ingredientes, { ...INGREDIENTE_VACIO }])}
            >
              <Plus size={16} aria-hidden="true" /> Agregar ingrediente
            </button>
          </fieldset>

          <fieldset className="formulario-lista">
            <legend>Preparación</legend>
            {form.pasos.map((paso, indice) => (
              <div key={indice} className="formulario-paso">
                <span className="detalle-paso-numero">{indice + 1}</span>
                <textarea
                  className="campo-formulario"
                  rows={2}
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
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="boton boton-contorno"
              onClick={() => cambiar('pasos', [...form.pasos, ''])}
            >
              <Plus size={16} aria-hidden="true" /> Agregar paso
            </button>
          </fieldset>

          {error && <p className="mensaje-error">{error}</p>}

          <div className="formulario-acciones">
            <button type="submit" className="boton boton-primario" disabled={guardando}>
              {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Guardar receta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FormularioReceta
