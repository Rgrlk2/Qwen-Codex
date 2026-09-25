/**
 * Inicio, contra Supabase. La pantalla que el vendedor ve primero.
 *
 * ⛔ LA REGLA QUE ESTE ARCHIVO HACE CUMPLIR: Inicio no inventa ni un número.
 *    Cada cifra sale de las MISMAS tablas que alimentan la pantalla de Dinero
 *    — cotizaciones aceptadas y cobros de mensualidad — y el contador de
 *    agenda de la MISMA función que arma la Agenda. Si Inicio dijera una cifra
 *    y Dinero otra, el vendedor deja de creerle a las dos.
 *
 * ⛔ LAS CUATRO CIFRAS SON ACUMULADAS, NO MENSUALES. El CEO las pidió "a hoy"
 *    y "hasta hoy": no llevan filtro de período. Y las tres últimas suman la
 *    primera, a propósito.
 *
 * ⛔ NADIE FILTRA POR VENDEDOR ACÁ. Lo hace la base: las políticas de acceso
 *    ya sólo devuelven las cotizaciones y los cobros del que está adentro. Un
 *    filtro escrito en el navegador sería una segunda verdad que podría no
 *    coincidir con la primera.
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
  CapaInicio, CanalPreferido, EntradaAgenda, Id, ISODate, MarcadorVisitas, Moneda,
  PeriodoMensual, ProximoSeguimiento, Resultado, ResumenAgenda, ResumenInicio,
  TotalesPorMoneda,
} from '@labia/compartido';
import { supabase } from './conexion';
import { bien, fallo } from './errores';
import { crearCapaAgenda } from './agenda';

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

/** ⛔ Una entrada por moneda. Nunca un total consolidado. */
function sumarPorMoneda(filas: ReadonlyArray<{ moneda: Moneda; monto: number }>): TotalesPorMoneda {
  const por = new Map<Moneda, number>();
  for (const f of filas) por.set(f.moneda, (por.get(f.moneda) ?? 0) + f.monto);
  return [...por].map(([moneda, monto]) => ({ moneda, monto }));
}

/** Suma varias cifras por moneda en una sola, sin mezclar monedas. */
function juntar(...cifras: ReadonlyArray<TotalesPorMoneda>): TotalesPorMoneda {
  return sumarPorMoneda(cifras.flat());
}

const ZONA = 'America/Asuncion';

/**
 * Cuántos milisegundos separan el reloj de Asunción del reloj universal.
 *
 * ⛔ NO se escribe "-3 horas" a mano. Hoy Paraguay está en UTC−3 todo el año,
 *    pero eso es una ley, no una constante de la naturaleza: si vuelve el
 *    horario de verano, una resta clavada empieza a contar la semana corrida
 *    una hora y nadie se entera. Esto se lo pregunta al sistema.
 */
function desfaseDeAsuncion(momento: Date): number {
  const alla = new Date(momento.toLocaleString('en-US', { timeZone: ZONA }));
  const aca = new Date(momento.toLocaleString('en-US', { timeZone: 'UTC' }));
  return alla.getTime() - aca.getTime();
}

const UN_DIA = 86_400_000;

/**
 * La semana en curso en Asunción: del lunes a las 00:00 al lunes siguiente.
 *
 * El marcador circular cuenta lo de ESTA semana. Si el corte se hiciera en
 * hora universal, los lunes a la mañana temprano el vendedor vería todavía la
 * semana pasada, y los domingos a la noche ya la que viene.
 */
function semanaEnCurso(): { readonly desde: ISODate; readonly hasta: ISODate } {
  const ahora = new Date();
  const desfase = desfaseDeAsuncion(ahora);
  /* El reloj de Asunción, leído como si fuera universal: así `getUTCDay` da
     el día que el vendedor tiene en la pared. */
  const pared = new Date(ahora.getTime() + desfase);
  const diasDesdeLunes = (pared.getUTCDay() + 6) % 7;
  const lunesPared = Date.UTC(pared.getUTCFullYear(), pared.getUTCMonth(), pared.getUTCDate())
    - diasDesdeLunes * UN_DIA;
  return {
    desde: new Date(lunesPared - desfase).toISOString(),
    hasta: new Date(lunesPared + 7 * UN_DIA - desfase).toISOString(),
  };
}

/** Objetivo de visitas por semana, por si el parámetro todavía no existe. */
const OBJETIVO_DE_VISITAS_POR_OMISION = 6;

interface FilaVenta {
  readonly moneda: Moneda;
  readonly setup_lista: number | null;
  readonly setup_especial: number | null;
}

interface FilaCobro {
  readonly moneda: Moneda;
  readonly importe: number;
  readonly estado: string;
}

/**
 * Lo que se vendió de setup en una cotización aceptada.
 *
 * ⛔ Manda el precio especial cuando existe: es el que firmó el cliente. El de
 *    lista es sólo el punto de partida de la negociación.
 */
function setupVendido(fila: FilaVenta): number {
  return fila.setup_especial ?? fila.setup_lista ?? 0;
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
  const agenda = crearCapaAgenda();

  return {
    async resumenInicio() {
      const periodo = periodoDeHoy();
      const semana = semanaEnCurso();

      /* Cuatro preguntas a la base, todas al mismo tiempo. Las políticas de
         acceso ya dejan afuera lo que no es del vendedor. */
      const [ventas, cobros, investigaciones, parametros] = await Promise.all([
        // ⛔ Vendido = cotización ACEPTADA. Una aprobada todavía no es una
        //    venta: la firma el cliente, no Lab.IA.
        sb.from('cotizacion')
          .select('moneda, setup_lista, setup_especial')
          .eq('estado', 'aceptada'),
        // ⛔ Sin filtro de período: es "hasta hoy", no "este mes".
        sb.from('cobro_mensualidad').select('moneda, importe, estado'),
        sb.from('plan')
          .select('id', { count: 'exact', head: true })
          .gte('creado_en', semana.desde)
          .lt('creado_en', semana.hasta),
        sb.from('parametros_sistema').select('visitas_objetivo_semana').maybeSingle(),
      ]);

      if (ventas.error) return fallo<ResumenInicio>(ventas.error);
      if (cobros.error) return fallo<ResumenInicio>(cobros.error);
      if (investigaciones.error) return fallo<ResumenInicio>(investigaciones.error);
      /* ⛔ El parámetro NO corta la pantalla. Si no se pudo leer, el círculo
         usa el objetivo por omisión: que falle el tablero entero por el
         denominador de un marcador sería desproporcionado. */

      const vs = (ventas.data ?? []) as unknown as FilaVenta[];
      const cs = (cobros.data ?? []) as unknown as FilaCobro[];

      const ventasEnSetup = sumarPorMoneda(
        vs.map((v) => ({ moneda: v.moneda, monto: setupVendido(v) })),
      );
      const mensualidadesCobradas = sumarPorMoneda(
        cs.filter((c) => c.estado === 'cobrado')
          .map((c) => ({ moneda: c.moneda, monto: c.importe })),
      );
      // ⛔ "Incobrable" no entra: no es plata que vaya a llegar, y ponerla en
      //    "a cobrar" sería prometerle al vendedor algo que no va a pasar.
      const mensualidadesACobrar = sumarPorMoneda(
        cs.filter((c) => c.estado === 'pendiente' || c.estado === 'atrasado')
          .map((c) => ({ moneda: c.moneda, monto: c.importe })),
      );

      const objetivoLeido = (parametros.data as { visitas_objetivo_semana?: number } | null)
        ?.visitas_objetivo_semana;
      const visitas: MarcadorVisitas = {
        hechas: investigaciones.count ?? 0,
        objetivo: typeof objetivoLeido === 'number' && objetivoLeido > 0
          ? objetivoLeido
          : OBJETIVO_DE_VISITAS_POR_OMISION,
        desde: semana.desde,
        hasta: semana.hasta,
      };

      const ventasAcumuladas = juntar(ventasEnSetup, mensualidadesCobradas, mensualidadesACobrar);

      return bien<ResumenInicio>({
        periodo,
        ventasAcumuladas,
        ventasEnSetup,
        mensualidadesCobradas,
        mensualidadesACobrar,
        visitas,
        // ⛔ "Sin datos todavía" es literal: no registró NINGUNA venta. Con una
        //    venta en cero seguiría siendo falso, porque hay actividad.
        sinDatosTodavia: vs.length === 0 && cs.length === 0 && estaVacia(ventasAcumuladas),
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
