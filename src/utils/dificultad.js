// "Fácil" / "Media" / "Difícil" -> clase de la etiqueta (verde, lápiz, tomate).
export function claseDificultad(dificultad) {
  if (dificultad === 'Fácil') return 'etiqueta-dificultad-facil'
  if (dificultad === 'Media') return 'etiqueta-dificultad-media'
  return 'etiqueta-dificultad-dificil'
}
