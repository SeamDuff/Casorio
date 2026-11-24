# Mesas compartidas (Vercel + Upstash)

## Archivos
- `index.html`: el organizador de mesas, ahora con guardado compartido. Si en el repo tu HTML tiene otro nombre, reemplazá ese archivo por este.
- `api/mesas.js`: función de Vercel que lee y guarda las mesas en la base.

## Pasos en Vercel (una sola vez)
1. Entrá a tu proyecto en Vercel → pestaña **Storage** → **Create Database** → elegí **Upstash for Redis** (plan gratis) → crearla y **Connect** al proyecto. Esto agrega solo las variables `KV_REST_API_URL` y `KV_REST_API_TOKEN`.
2. **Settings → Environment Variables** → agregá `MESAS_CLAVE` con la contraseña que van a usar vos y Cande.
3. Subí `index.html` y la carpeta `api/` al repo. Vercel redeploya solo (si no, **Deployments → Redeploy**).

## Uso
- La primera vez pide la contraseña y tu nombre; quedan recordados en ese navegador.
- Abrí la página primero en la compu donde ya cargaste invitados: si la base está vacía, sube lo que tengas ahí.
- Cada cambio se guarda solo. La otra persona lo ve en unos 15 segundos (o al volver a la pestaña).
- Arriba dice "Compartido ✓" y quién hizo el último cambio. Si los dos tocan algo en el mismo segundo, gana el primero y al otro le aparece un aviso para que repita su cambio.
- Abierto como archivo suelto (doble clic) funciona como antes, solo en esa compu.
