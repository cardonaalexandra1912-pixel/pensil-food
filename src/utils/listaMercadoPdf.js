// ============================================================================
// LISTA DE MERCADO EN PDF
// ----------------------------------------------------------------------------
// Arma y descarga un PDF con el menú de la semana y la lista de mercado, con
// una casilla al lado de cada ingrediente para ir marcando en la tienda.
// jsPDF se carga solo cuando alguien pide el PDF, para no hacer más pesada la
// página para quien nunca lo usa.
// ============================================================================

const MARGEN = 18
const ANCHO_PAGINA = 210
const ALTO_PAGINA = 297
// Colores de Pensil.Devs: grafito, lápiz, tomate de Pensil.Food y tinta.
const GRAFITO = [22, 24, 29]
const LAPIZ = [246, 184, 28]
const TOMATE = [176, 54, 27]
const VERDE = [23, 112, 75]
const TEXTO = [22, 24, 29]
const TEXTO_SUAVE = [84, 90, 102]

// diasConRecetas: [{ dia, comidas: [{ momento: 'Desayuno', nombre }] }]
// listaMercado: el resultado de agruparIngredientes()
export async function descargarListaMercadoPdf(diasConRecetas, listaMercado) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = 0

  // Encabezado con franja de color de la marca
  doc.setFillColor(...GRAFITO)
  doc.rect(0, 0, ANCHO_PAGINA, 30, 'F')
  doc.setFillColor(...LAPIZ)
  doc.rect(0, 30, ANCHO_PAGINA, 1.6, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('Lista de Mercado', MARGEN, 19)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const fecha = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
  doc.text(`Pensil.Food  ·  ${fecha}`, ANCHO_PAGINA - MARGEN, 19, { align: 'right' })
  y = 42

  // Pasa a una página nueva cuando lo siguiente ya no cabe.
  function asegurarEspacio(alto) {
    if (y + alto > ALTO_PAGINA - MARGEN) {
      doc.addPage()
      y = MARGEN + 4
    }
  }

  function tituloSeccion(texto) {
    asegurarEspacio(16)
    doc.setTextColor(...TOMATE)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(texto, MARGEN, y)
    doc.setDrawColor(...LAPIZ)
    doc.setLineWidth(0.4)
    doc.line(MARGEN, y + 2, ANCHO_PAGINA - MARGEN, y + 2)
    y += 10
  }

  // --- Menú de la semana ---
  if (diasConRecetas.length > 0) {
    tituloSeccion('Menú de la semana')
    diasConRecetas.forEach(({ dia, comidas }) => {
      asegurarEspacio(6 + comidas.length * 5.5)
      doc.setTextColor(...VERDE)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text(dia, MARGEN, y)
      y += 5.5
      doc.setFontSize(10)
      comidas.forEach(({ momento, nombre }) => {
        doc.setTextColor(...TEXTO_SUAVE)
        doc.setFont('helvetica', 'bold')
        doc.text(`${momento}:`, MARGEN + 4, y)
        doc.setTextColor(...TEXTO)
        doc.setFont('helvetica', 'normal')
        doc.text(nombre, MARGEN + 26, y)
        y += 5.5
      })
      y += 2
    })
    y += 4
  }

  // --- Ingredientes con casilla para marcar ---
  tituloSeccion(`Ingredientes (${listaMercado.length})`)
  doc.setFontSize(11)
  const anchoTexto = ANCHO_PAGINA - MARGEN * 2 - 10
  listaMercado.forEach((item) => {
    const texto = !item.esNumerico && item.veces > 1 ? `${item.texto}  (x${item.veces})` : item.texto
    const lineas = doc.splitTextToSize(texto, anchoTexto)
    const alto = lineas.length * 5.2 + 2.6
    asegurarEspacio(alto)
    doc.setDrawColor(...TEXTO_SUAVE)
    doc.setLineWidth(0.3)
    doc.rect(MARGEN, y - 3.6, 4.2, 4.2)
    doc.setTextColor(...TEXTO)
    doc.setFont('helvetica', 'normal')
    doc.text(lineas, MARGEN + 8, y)
    y += alto
  })

  // Pie de página con número de página
  const totalPaginas = doc.getNumberOfPages()
  for (let pagina = 1; pagina <= totalPaginas; pagina++) {
    doc.setPage(pagina)
    doc.setFontSize(8)
    doc.setTextColor(...TEXTO_SUAVE)
    doc.text(`Página ${pagina} de ${totalPaginas}`, ANCHO_PAGINA / 2, ALTO_PAGINA - 8, { align: 'center' })
  }

  doc.save('lista-de-mercado.pdf')
}
