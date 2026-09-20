/**
 * Inicio, contra Supabase. La pantalla que el vendedor ve primero.
 *
 * ⛔ LA REGLA QUE ESTE ARCHIVO HACE CUMPLIR: Inicio no calcula nada por su
 *    cuenta. Las cuatro cifras salen de la MISMA función que alimenta la
 *    pantalla de Dinero, y el contador de agenda de la MISMA que arma la
 *    Agenda. Si Inicio dijera una cifra y Dinero otra, el vendedor deja de
 *    creerle a las dos.
 *
 * ⛔ Nunca hay un total consolidado: cada cifra es `TotalesPorMoneda`.
 *
 * ⛔ `sinDatosTodavia` no es un adorno: con la cuenta vacía, la pantalla deja
 *    las dos acciones protagonistas como lo único accionable, en vez de
 *    mostrar cuatro ceros que no significan nada.
 *
 * Ver MASTER_SPEC.md §2.1.
 */

import type {
  CapaInicio, CanalPreferido, EntradaAgenda, Id, ISODate, PeriodoMensual,
  ProximoSeguimiento, Resultado, ResumenAgenda, ResumenInicio, TotalesPorMoneda,
} from '@labia/compartido';
import { supabase } from './conexion';
import { bien, fallo } from './errores';
import { crearCapaAgenda } from './agenda';
import { crearCapaDinero } from './dinero';

/**
 * ⛔ Lista CORTA: el contrato lo dice con un candado. El detalle vive en
 *    `#/agenda`. Cinco es lo que entra en la pantalla sin empujar hacia abajo
 *    las dos acciones protagonistas, que son lo dominante.
 */
const CUANTOS_POR_DEFECTO = 5;

/**
 * Los ocho orígenes de la agenda contra los cuatro que el contrato admite para
 * un "próximo seguimiento".
 *
 * ⛔ Lo que no es un seguimiento no se disfraza de seguimiento. El vencimiento
 *    de una cotización, una presentación enviada y una cotización en revisión
 *    son estados del circuito comercial: aparecen en la Agenda, no acá. Antes
 *    que etiquetarlos mal, quedan afuera.
 */
const ORIGEN_DE_SEGUIMIENTO: Readonly<
  Partial<Record<EntradaAgenda['origen'], ProximoSeguimiento['origen']>>
> = {
  seguimiento: 'paso_seguimiento',
  plan: 'objetivo_plan',
  objetivo_aceptado: 'objetivo_plan',
  apertura_enlace: 'apertura_enlace',
  manual: 'manual',
};

const CANALES: ReadonlyArray<CanalPreferido> = ['whatsapp', 'telefono', 'email', 'presencial'];

/** El canal viene de una columna de texto: se acepta sólo si es uno de los cuatro. */
function canalValido(valor: unknown): CanalPreferido | null {
  return CANALES.includes(valor as CanalPreferido) ? (valor as CanalPreferido) : null;
}

/** El período de hoy, en la forma `AAAA-MM` que usa toda la capa de dinero. */
function periodoDeHoy(): PeriodoMensual {
  const ahora = new Date();
  const mes = String(ahora.getUTCMonth() + 1).padStart(2, '0');
  return `${ahora.getUTCFullYear()}-${mes}`;
}

/** Una cifra por moneda está "en cero" cuando no tiene ninguna entrada con monto. */
function estaVacia(totales: TotalesPorMoneda): boolean {
  return totales.every((t) => t.monto === 0);
}

interface FilaSeguimiento {
  readonly id: string;
  readonly cliente_id: string | null;
  readonly titulo: string;
  readonly vence_en: string | null;
  readonly origen: EntradaAgenda['origen'];
  readonly referencia_id: string | null;
  readonly cliente?: {
    readonly nombre: string;
    readonly contacto?: ReadonlyArray<{
      readonly canal_preferido: string | null;
      readonly es_decisor: boolean;
    }> | null;
  } | null;
}

export function crearCapaInicio(): CapaInicio {
  const sb = supabase();
  const dinero = crearCapaDinero();
  const agenda = crearCapaAgenda();

  return {
    async resumenInicio() {
      const periodo = periodoDeHoy();
      // ⛔ No se recalcula acá: se proyecta lo que ya calculó la capa de dinero.
      const r = await dinero.resumenDinero(periodo);
      if (!r.ok) return r as Resultado<ResumenInicio>;
      const d = r.datos;

      return bien<ResumenInicio>({
        periodo,
        dineroVendido: d.vendido,
        dineroCobrado: d.cobrado,
        // Lo acumulado es toda la parte del vendedor que sigue viva: lo que ya
        // se le liquidó más lo que tiene devengado. Lo anulado no cuenta, y la
        // capa de dinero ya lo dejó afuera.
        comisionAcumulada: d.parteVendedor,
        comisionPendiente: d.comisionPendiente,
        // ⛔ "Sin datos todavía" es literal: no registró NINGUNA venta. Con una
        //    venta cobrada en cero seguiría siendo falso, porque hay actividad.
        sinDatosTodavia:
          estaVacia(d.vendido) && estaVacia(d.cobrado) && estaVacia(d.parteVendedor),
      });
    },

    async proximosSeguimientos(limite?: number) {
      const cuantos = Math.max(1, limite ?? CUANTOS_POR_DEFECTO);
      const origenes = Object.keys(ORIGEN_DE_SEGUIMIENTO);

      const { data, error } = await sb
        .from('entrada_agenda')
        .select(`id, cliente_id, titulo, vence_en, origen, referencia_id,
                 cliente ( nombre, contacto ( canal_preferido, es_decisor ) )`)
        .eq('estado', 'pendiente')
        .in('origen', origenes)
        // Lo más viejo primero: lo atrasado es lo que más duele.
        .order('vence_en', { ascending: true, nullsFirst: false })
        .limit(cuantos);

      if (error) return fallo<ReadonlyArray<ProximoSeguimiento>>(error);

      const ahora = Date.now();
      return bien(((data ?? []) as unknown as FilaSeguimiento[]).flatMap((f) => {
        const origen = ORIGEN_DE_SEGUIMIENTO[f.origen];
        if (!origen) return [];
        const contactos = f.cliente?.contacto ?? [];
        const decisor = contactos.find((c) => c.es_decisor) ?? contactos[0];
        const seguimiento: ProximoSeguimiento = {
          id: f.id,
          clienteId: (f.cliente_id ?? '') as Id,
          nombreCliente: f.cliente?.nombre ?? '',
          titulo: f.titulo,
          venceEn: f.vence_en,
          vencido: f.vence_en !== null && new Date(f.vence_en).getTime() < ahora,
          canal: canalValido(decisor?.canal_preferido),
          origen,
          // La referencia es a lo que dio origen al seguimiento; si no la hay,
          // la entrada de agenda se referencia a sí misma.
          referenciaId: (f.referencia_id ?? f.id) as Id,
        };
        return [seguimiento];
      }));
    },

    async resumenAgenda() {
      // ⛔ Es el CONTADOR del acceso a Agenda, no la agenda. Y sale de la misma
      //    función que arma la Agenda: dos conteos distintos serían un error
      //    que el vendedor descubre al hacer clic.
      const r = await agenda.agendaHoy();
      if (!r.ok) return r as Resultado<ResumenAgenda>;
      const hoy = r.datos;

      const deHoy: ReadonlyArray<EntradaAgenda> = [
        ...hoy.visitas, ...hoy.llamadas, ...hoy.proximosPasos, ...hoy.vencimientos,
      ];

      // La próxima es la más urgente: primero lo atrasado, y dentro de cada
      // grupo lo que vence antes. Sin fecha va al final.
      const candidatas = [...hoy.atrasados, ...deHoy];
      const proxima = candidatas.reduce<EntradaAgenda | null>((mejor, e) => {
        if (!mejor) return e;
        if (mejor.atrasada !== e.atrasada) return mejor.atrasada ? mejor : e;
        return ordenPorVencimiento(mejor, e) <= 0 ? mejor : e;
      }, null);

      return bien<ResumenAgenda>({
        pendientesHoy: deHoy.length,
        atrasados: hoy.atrasados.length,
        proximaEntrada: proxima,
      });
    },
  };
}

/** Sin fecha de vencimiento va al final: no compite con algo que sí vence. */
function ordenPorVencimiento(a: EntradaAgenda, b: EntradaAgenda): number {
  const fa = fechaDe(a);
  const fb = fechaDe(b);
  if (fa === null) return fb === null ? 0 : 1;
  if (fb === null) return -1;
  return fa - fb;
}

function fechaDe(e: EntradaAgenda): number | null {
  const cuando: ISODate | null = e.venceEn ?? e.inicioEn;
  return cuando === null ? null : new Date(cuando).getTime();
}
