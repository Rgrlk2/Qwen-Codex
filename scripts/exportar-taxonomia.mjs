/**
 * Exporta la taxonomía del motor como SQL, para cargarla en el servidor.
 *
 *   npm run exportar:taxonomia
 *
 * ⛔ No se transcribe: se lee del mismo archivo que usa el motor. Copiar a
 *    mano 1.400 líneas de taxonomía garantiza que las dos versiones diverjan.
 */
import { writeFileSync } from 'node:fs';
import {
  OPERACIONES_SEMILLA, NECESIDADES_SEMILLA, ACTIVIDADES_CURADAS,
  RELACIONES_OPERACION_NECESIDAD, RELACIONES_NECESIDAD_PRODUCTO,
} from '../packages/mock/src/datos-motor.ts';

/** Literal SQL seguro: comillas simples duplicadas. */
const t = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const arr = (xs) => `array[${xs.map(t).join(', ')}]::text[]`;

const sql = [
`-- Taxonomia del motor, extraida de packages/mock/src/datos-motor.ts.
-- ⛔ Generado por scripts/exportar-taxonomia.mjs. No editar a mano.
alter table public.operacion add column if not exists clave text unique;
alter table public.necesidad add column if not exists clave text unique;
alter table public.actividad add column if not exists clave text unique;`,

`insert into public.operacion (clave,nombre,pregunta,estado) values\n` +
OPERACIONES_SEMILLA.map((o) => `(${t(o.id)},${t(o.nombre)},${t(o.pregunta)},'confirmada')`).join(',\n') +
`\non conflict (clave) do update set nombre=excluded.nombre,pregunta=excluded.pregunta;`,

`insert into public.necesidad (clave,nombre,descripcion,pregunta_confirmacion,estado) values\n` +
NECESIDADES_SEMILLA.map((n) => `(${t(n.id)},${t(n.nombre)},${t(n.descripcion)},${t(n.preguntaConfirmacion)},'confirmada')`).join(',\n') +
`\non conflict (clave) do update set nombre=excluded.nombre,descripcion=excluded.descripcion,pregunta_confirmacion=excluded.pregunta_confirmacion;`,

`insert into public.actividad (clave,nombre,sinonimos,estado) values\n` +
ACTIVIDADES_CURADAS.map((a) => `(${t(a.id)},${t(a.nombre)},${arr(a.sinonimos)},'confirmada')`).join(',\n') +
`\non conflict (clave) do update set nombre=excluded.nombre,sinonimos=excluded.sinonimos;`,

`insert into public.actividad_operacion (actividad_id,operacion_id,probabilidad,motivo)\nselect a.id,o.id,v.p::probabilidad,v.m from (values\n` +
ACTIVIDADES_CURADAS.flatMap((a) => a.operaciones.map((r) => `(${t(a.id)},${t(r.operacionId)},${t(r.probabilidad)},${t(r.motivo)})`)).join(',\n') +
`\n) as v(a,o,p,m)\njoin public.actividad a on a.clave=v.a join public.operacion o on o.clave=v.o\non conflict (actividad_id,operacion_id) do update set probabilidad=excluded.probabilidad,motivo=excluded.motivo;`,

`insert into public.operacion_necesidad (operacion_id,necesidad_id,probabilidad,motivo)\nselect o.id,n.id,v.p::probabilidad,v.m from (values\n` +
RELACIONES_OPERACION_NECESIDAD.map((r) => `(${t(r.operacionId)},${t(r.necesidadId)},${t(r.probabilidad)},${t(r.motivo)})`).join(',\n') +
`\n) as v(o,n,p,m)\njoin public.operacion o on o.clave=v.o join public.necesidad n on n.clave=v.n\non conflict (operacion_id,necesidad_id) do update set probabilidad=excluded.probabilidad,motivo=excluded.motivo;`,

`insert into public.necesidad_producto (necesidad_id,producto_id,encaje,adaptacion_requerida,argumento)\nselect n.id,v.pr,v.e::encaje_producto,v.ad,v.ar from (values\n` +
RELACIONES_NECESIDAD_PRODUCTO.map((r) => `(${t(r.necesidadId)},${t(r.productoId)},${t(r.encaje)},${t(r.adaptacionRequerida ?? null)},${t(r.argumento)})`).join(',\n') +
`\n) as v(n,pr,e,ad,ar)\njoin public.necesidad n on n.clave=v.n\non conflict (necesidad_id,producto_id) do update set encaje=excluded.encaje,adaptacion_requerida=excluded.adaptacion_requerida,argumento=excluded.argumento;`,
].join('\n\n') + '\n';

writeFileSync('supabase/taxonomia.sql', sql, 'utf8');


console.log(`operaciones ............ ${OPERACIONES_SEMILLA.length}`);
console.log(`necesidades ............ ${NECESIDADES_SEMILLA.length}`);
console.log(`actividades ............ ${ACTIVIDADES_CURADAS.length}`);
console.log(`actividad → operacion .. ${ACTIVIDADES_CURADAS.reduce((s, a) => s + a.operaciones.length, 0)}`);
console.log(`operacion → necesidad .. ${RELACIONES_OPERACION_NECESIDAD.length}`);
console.log(`necesidad → producto ... ${RELACIONES_NECESIDAD_PRODUCTO.length}`);
console.log(`\nsupabase/taxonomia.sql — ${(sql.length / 1024).toFixed(0)} KB`);
