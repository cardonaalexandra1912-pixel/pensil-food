// Utilidades de fechas para el menú semanal. Las semanas van de lunes a domingo
// y se manejan en la hora local del navegador.

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

// Lunes (a las 00:00 locales) de la semana que contiene la fecha.
export function lunesDe(fecha) {
  const lunes = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
  const diaSemana = (lunes.getDay() + 6) % 7 // 0 = lunes ... 6 = domingo
  lunes.setDate(lunes.getDate() - diaSemana)
  return lunes
}

export function sumarDias(fecha, dias) {
  const nueva = new Date(fecha)
  nueva.setDate(nueva.getDate() + dias)
  return nueva
}

// "2026-11-02" (sin pasar por UTC, para no cambiar de día por la zona horaria).
export function fechaISO(fecha) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}-${dia}`
}

// "2026-11-02" -> Date local
export function desdeISO(texto) {
  const [anio, mes, dia] = texto.split('-').map(Number)
  return new Date(anio, mes - 1, dia)
}

// "2 – 8 de noviembre" o "30 de noviembre – 6 de diciembre"
export function textoSemana(lunes) {
  const domingo = sumarDias(lunes, 6)
  if (lunes.getMonth() === domingo.getMonth()) {
    return `${lunes.getDate()} – ${domingo.getDate()} de ${MESES[domingo.getMonth()]}`
  }
  return `${lunes.getDate()} de ${MESES[lunes.getMonth()]} – ${domingo.getDate()} de ${MESES[domingo.getMonth()]}`
}

// "hace 5 min", "ayer", "3 de noviembre"
export function tiempoRelativo(textoFecha) {
  const fecha = new Date(textoFecha)
  const segundos = Math.round((Date.now() - fecha.getTime()) / 1000)
  if (segundos < 60) return 'ahora'
  const minutos = Math.round(segundos / 60)
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return `hace ${horas} h`
  const dias = Math.round(horas / 24)
  if (dias === 1) return 'ayer'
  if (dias < 7) return `hace ${dias} días`
  return `${fecha.getDate()} de ${MESES[fecha.getMonth()]}`
}
