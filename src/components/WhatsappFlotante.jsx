import './WhatsappFlotante.css'

// Número en formato internacional, solo dígitos (código de país + número, sin "+" ni espacios),
// ej. '573001234567'. Mientras esté vacío, el botón no se muestra.
const NUMERO_WHATSAPP = ''
const MENSAJE_INICIAL = 'Hola, vengo de Pensil.Food.'

function WhatsappFlotante() {
  if (!NUMERO_WHATSAPP) return null

  const enlace = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(MENSAJE_INICIAL)}`

  return (
    <a
      href={enlace}
      className="whatsapp-flotante"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      title="Escríbenos por WhatsApp"
    >
      <svg viewBox="0 0 32 32" className="whatsapp-flotante-icono" aria-hidden="true">
        <path d="M16.004 3C8.832 3 3 8.83 3 16c0 2.293.6 4.533 1.74 6.51L3 29l6.65-1.71A12.95 12.95 0 0 0 16.004 29C23.172 29 29 23.17 29 16S23.172 3 16.004 3Zm0 23.67c-1.98 0-3.92-.53-5.61-1.54l-.4-.24-3.95 1.02 1.05-3.85-.26-.41A10.62 10.62 0 0 1 5.33 16c0-5.88 4.79-10.67 10.67-10.67 5.88 0 10.67 4.79 10.67 10.67 0 5.88-4.79 10.67-10.67 10.67Zm5.85-7.99c-.32-.16-1.89-.93-2.18-1.04-.29-.11-.5-.16-.72.16-.21.32-.82 1.04-1.01 1.25-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.9-1.78-2.22-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.73-.98-2.37-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66 0 1.57 1.14 3.08 1.3 3.3.16.21 2.25 3.43 5.45 4.81.76.33 1.35.53 1.82.67.76.24 1.46.21 2.01.13.61-.09 1.89-.77 2.16-1.52.27-.75.27-1.39.19-1.52-.08-.13-.29-.21-.61-.37Z" />
      </svg>
    </a>
  )
}

export default WhatsappFlotante
