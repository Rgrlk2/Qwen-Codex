#!/usr/bin/env python3
"""Genera la base DEMO de pacientes ficticios y turnos históricos 2026 (hasta ayer).

    python3 generar_demo.py [--hasta 2026-10-10]

Determinista (semilla fija). Respeta horarios por servicio y sede de config/leguizamon.json,
feriados, vacaciones, la regla de 48 h y estacionalidad pediátrica. Todos los datos son
ficticios: teléfonos +595 900..., correos @example.com, documentos DEMO-/PROV-.
"""
import csv
import json
import random
import sys
from datetime import date, datetime, timedelta

import ghl_provision as gp

SEED = 1637
DESDE = date(2026, 1, 1)
HASTA_DEFAULT = date(2026, 10, 10)

FERIADOS = {
    date(2026, 1, 1): "Año Nuevo",
    date(2026, 3, 1): "Día de los Héroes",
    date(2026, 4, 2): "Jueves Santo",
    date(2026, 4, 3): "Viernes Santo",
    date(2026, 5, 1): "Día del Trabajador",
    date(2026, 5, 14): "Independencia",
    date(2026, 5, 15): "Independencia",
    date(2026, 6, 12): "Paz del Chaco",
    date(2026, 8, 15): "Fundación de Asunción",
    date(2026, 9, 29): "Victoria de Boquerón",
}
VACACIONES = [(date(2026, 1, 19), date(2026, 2, 1)), (date(2026, 7, 20), date(2026, 8, 2))]
CODIGO_ROJO = (date(2026, 8, 18), "14:00", "Código Rojo — recibimiento de parto")

# Ocupación base por mes (invierno alto, enero bajo).
OCUPACION_MES = {1: .55, 2: .62, 3: .78, 4: .76, 5: .86, 6: .94, 7: .95, 8: .88, 9: .78, 10: .72}
AJUSTE_SERVICIO = {
    "consulta_enfermedad": {5: 1.1, 6: 1.2, 7: 1.2, 8: 1.1, 1: .8},
    "certificado_escolar": {2: 1.5, 3: 1.6, 4: .8, 7: .6},
    "vacunacion": {4: 1.4, 5: 1.4, 6: 1.2},
}

NOMBRES_F = ["Sofía", "Valentina", "Isabella", "Camila", "Martina", "Lucía", "Emma", "Mía", "Renata", "Alma",
             "Victoria", "Abigail", "Aitana", "Ana Paula", "Luana", "Yasmin", "Helena", "Laura", "Julia", "Maite",
             "Kiara", "Rocío", "Milagros", "Fiorella", "Antonella", "Belén", "Ximena", "Larissa", "Gabriela", "Elena"]
NOMBRES_M = ["Mateo", "Santiago", "Thiago", "Benjamín", "Joaquín", "Lucas", "Gael", "Bautista", "Liam", "Tomás",
             "Enzo", "Lorenzo", "Dylan", "Felipe", "Davi", "Arthur", "Heitor", "Miguel", "Samuel", "Ian",
             "Iker", "Agustín", "Fabrizio", "Derlis", "Néstor", "Pedro Henrique", "Matías", "Emiliano", "Rafael", "Bruno"]
ADULTOS_F = ["María José", "Andrea", "Romina", "Carolina", "Natalia", "Fernanda", "Lorena", "Patricia", "Liz",
             "Gisselle", "Mirian", "Diana", "Jéssica", "Paola", "Fabiana", "Aline", "Daiane", "Raquel", "Sonia", "Nilda"]
ADULTOS_M = ["Juan Carlos", "Marcelo", "Rodrigo", "Diego", "Hugo", "Óscar", "Víctor", "César", "Ramón", "Édgar",
             "Fabio", "Anderson", "Wellington", "Gustavo", "Ricardo", "Celso", "Rubén", "Alcides", "Elvio", "Arnaldo"]
APELLIDOS_PY = ["Benítez", "González", "Martínez", "Giménez", "Ramírez", "Báez", "Ortiz", "Villalba", "Acosta",
                "Duarte", "Cáceres", "Fernández", "Ayala", "Rojas", "Insfrán", "Ojeda", "Cabrera", "Riveros",
                "Aquino", "Sanabria", "Paredes", "Escobar", "Cardozo", "Vera", "Galeano", "Núñez", "Espínola"]
APELLIDOS_BR = ["Da Silva", "Dos Santos", "Oliveira", "Pereira", "Schneider", "Kuhn", "Becker", "Ferreira",
                "Rodrigues", "Lima", "Costa", "Weber", "Klein", "Souza", "Bortolini"]
APELLIDOS_MENONITAS = ["Friesen", "Penner", "Wiebe", "Klassen", "Giesbrecht", "Unruh"]

IDIOMA_POR_SEDE = {
    "cde_centro": [("Español", 72), ("Portugués", 12), ("Yopará", 16)],
    "hernandarias": [("Español", 62), ("Portugués", 13), ("Yopará", 25)],
    "santa_rita": [("Español", 25), ("Portugués", 62), ("Yopará", 13)],
}
SEDE_HABITUAL = [("cde_centro", 62), ("hernandarias", 24), ("santa_rita", 14)]
CANALES = [("WhatsApp", 55), ("Llamada", 22), ("Web", 13), ("Administración", 10)]
ESTADOS = [("atendido", 80), ("inasistencia", 6), ("cancelado", 8), ("reprogramado", 6)]
MOTIVOS_CANCELACION = ["El niño ya se recuperó", "Viaje familiar", "Conflicto con horario escolar",
                       "Sin movilidad ese día", "Lo atendieron en guardia", "Cambio de seguro"]
MOTIVOS_REPROGRAMACION = ["Pedido de la familia", "Niño con fiebre, prefiere teleconsulta",
                          "Coincide con evento escolar", "Responsable con turno laboral"]


def pick(rng, weighted):
    items, weights = zip(*weighted)
    return rng.choices(items, weights=weights)[0]


def age_years(birth, on):
    return (on - birth).days / 365.25


class Generator:
    def __init__(self, config, hasta, seed=SEED):
        self.config = config
        self.hasta = hasta
        self.rng = random.Random(seed)
        self.services = {s["clave"]: s for s in gp.active_services(config)}
        self.sedes = gp.sedes_by_key(config)
        self.seguros = config.get("seguros_aceptados") or []
        self.responsables, self.pacientes, self.turnos, self.espera = [], [], [], []
        self.ocupados = set()
        self.ultima_visita = {}
        self.phones = set()

    # ---------- personas ----------
    def new_phone(self):
        while True:
            phone = f"+595900{self.rng.randint(100000, 999999)}"
            if phone not in self.phones:
                self.phones.add(phone)
                return phone

    def surname_for(self, sede):
        roll = self.rng.random()
        if sede == "santa_rita":
            return self.rng.choice(APELLIDOS_BR if roll < .6 else APELLIDOS_MENONITAS if roll < .7 else APELLIDOS_PY)
        return self.rng.choice(APELLIDOS_PY if roll < .85 else APELLIDOS_BR)

    def new_responsable(self, creado, sede=None):
        rng = self.rng
        sede = sede or pick(rng, SEDE_HABITUAL)
        mother = rng.random() < .78
        rid = f"R{len(self.responsables) + 1:04d}"
        apellido = self.surname_for(sede)
        nombre = rng.choice(ADULTOS_F if mother else ADULTOS_M)
        seguro = ""
        if rng.random() < .45 and self.seguros:
            options = [s["nombre"] for s in self.seguros]
            weights = [4 if "Brasil" in o and sede == "santa_rita" else 1 if "Brasil" in o else 3 for o in options]
            seguro = rng.choices(options, weights=weights)[0]
        slug = f"{nombre.split()[0]}.{apellido.split()[-1]}".lower()
        for a, b in zip("áéíóúñüê", "aeiounue"):
            slug = slug.replace(a, b)
        responsable = {
            "id": rid, "nombre": nombre, "apellido": apellido,
            "documento": f"DEMO-{rng.randint(1000000, 7999999)}",
            "parentesco": rng.choice(["Madre"] * 9 + ["Abuela"]) if mother else rng.choice(["Padre"] * 9 + ["Tutor"]),
            "telefono": self.new_phone(), "email": f"{slug}.{rid.lower()}@example.com",
            "idioma": pick(rng, IDIOMA_POR_SEDE[sede]), "sede_habitual": sede, "seguro": seguro,
            "creado": creado.isoformat(),
        }
        self.responsables.append(responsable)
        return responsable

    def new_paciente(self, responsable, birth, desde):
        rng = self.rng
        female = rng.random() < .5
        pid = f"P{len(self.pacientes) + 1:04d}"
        surname = responsable["apellido"] if rng.random() < .7 else f"{self.surname_for(responsable['sede_habitual'])} {responsable['apellido']}"
        has_id = age_years(birth, desde) >= 1 and rng.random() < .6
        paciente = {
            "id": pid, "responsable_id": responsable["id"],
            "nombre": rng.choice(NOMBRES_F if female else NOMBRES_M), "apellido": surname,
            "sexo": "F" if female else "M", "fecha_nacimiento": birth.isoformat(),
            "documento": f"DEMO-{rng.randint(5000000, 9999999)}" if has_id else f"PROV-{pid}",
            "paciente_desde": desde.isoformat(),
        }
        self.pacientes.append(paciente)
        return paciente

    def seed_existing_patients(self, n_families=300):
        rng = self.rng
        for _ in range(n_families):
            since = date(rng.randint(2015, 2025), rng.randint(1, 12), rng.randint(1, 28))
            responsable = self.new_responsable(since)
            for _ in range(pick(rng, [(1, 60), (2, 30), (3, 10)])):
                birth = DESDE - timedelta(days=rng.randint(60, 14 * 365))
                self.new_paciente(responsable, birth, max(since, birth))

    # ---------- agenda ----------
    def is_closed(self, day):
        return day in FERIADOS or any(a <= day <= b for a, b in VACACIONES)

    def slots_for(self, day):
        weekday = (day.weekday() + 1) % 7  # 0=domingo, como en la config
        for service in self.services.values():
            duration = service["duracion_min"]
            for block in service["horarios"]:
                if weekday not in block["dias"]:
                    continue
                t, end = gp.minutes(block["desde"]), gp.minutes(block["hasta"])
                while t + duration <= end:
                    yield service, block, t
                    t += duration

    def eligible(self, service_key, day, sede):
        rng = self.rng
        pool = [p for p in self.pacientes if p["paciente_desde"] <= day.isoformat()]
        if service_key == "certificado_escolar":
            pool = [p for p in pool if 4 <= age_years(date.fromisoformat(p["fecha_nacimiento"]), day) <= 14]
        elif service_key in ("pediatria_integrativa", "consulta_nutricional"):
            pool = [p for p in pool if age_years(date.fromisoformat(p["fecha_nacimiento"]), day) >= 1]
        if sede != "virtual" and rng.random() < .85:
            resp_sede = {r["id"]: r["sede_habitual"] for r in self.responsables}
            local = [p for p in pool if resp_sede[p["responsable_id"]] == sede]
            pool = local or pool
        return pool

    def patient_for(self, service_key, day, sede):
        rng = self.rng
        if service_key == "primera_consulta":
            if rng.random() < .25 and self.responsables:
                responsable = rng.choice(self.responsables)
            else:
                responsable = self.new_responsable(day, None if sede == "virtual" else sede)
            birth = day - timedelta(days=rng.randint(30, 12 * 365))
            return self.new_paciente(responsable, birth, day)
        if service_key == "control_recien_nacido":
            responsable = rng.choice(self.responsables) if rng.random() < .3 else self.new_responsable(day, sede)
            return self.new_paciente(responsable, day - timedelta(days=rng.randint(5, 25)), day)
        pool = self.eligible(service_key, day, sede)
        recent = [p for p in pool if (day - self.ultima_visita.get(p["id"], date.min)).days > 14]
        return rng.choice(recent or pool) if pool else None

    def coverage(self, responsable, service_key):
        for seguro in self.seguros:
            if seguro["nombre"] == responsable["seguro"] and service_key in seguro["servicios"]:
                return "Seguro", seguro["nombre"], seguro["copago_gs"]
        return "Particular", "", self.services[service_key]["precio_particular_gs"]

    def add_turno(self, service, block, day, start_min, patient, estado=None, canal=None,
                  reprogramado_de="", motivo=""):
        rng = self.rng
        responsable = next(r for r in self.responsables if r["id"] == patient["responsable_id"])
        sede = self.sedes[block["sede"]]
        start = datetime.combine(day, datetime.min.time()) + timedelta(minutes=start_min)
        end = start + timedelta(minutes=service["duracion_min"])
        canal = canal or (pick(rng, [("WhatsApp", 40), ("Llamada", 45), ("Web", 5), ("Administración", 10)])
                          if block["sede"] == "santa_rita" else pick(rng, CANALES))
        lead_hours = rng.uniform(0, 1) if canal == "Administración" else rng.uniform(2, 48)
        estado = estado or pick(rng, ESTADOS)
        if estado == "cancelado" and not motivo:
            motivo = rng.choice(MOTIVOS_CANCELACION)
        if estado == "reprogramado" and not motivo:
            motivo = rng.choice(MOTIVOS_REPROGRAMACION)
        cobertura, seguro, monto = self.coverage(responsable, service["clave"])
        turno = {
            "id": f"T{len(self.turnos) + 1:05d}", "paciente_id": patient["id"], "responsable_id": responsable["id"],
            "servicio": service["clave"], "servicio_nombre": service["nombre"],
            "sede": block["sede"], "sede_nombre": sede["nombre"], "profesional": block.get("profesional", "dra"),
            "inicio": start.strftime("%Y-%m-%dT%H:%M"), "fin": end.strftime("%Y-%m-%dT%H:%M"),
            "estado": estado, "canal": canal, "idioma": responsable["idioma"],
            "cobertura": cobertura, "seguro": seguro, "monto_gs": monto,
            "sena_pagada": "si" if cobertura == "Particular" and rng.random() < .72 else "no",
            "recordatorio_enviado": "si" if canal != "Administración" or rng.random() < .5 else "no",
            "creado_en": (start - timedelta(hours=lead_hours)).strftime("%Y-%m-%dT%H:%M"),
            "reprogramado_de": reprogramado_de, "motivo_estado": motivo,
        }
        self.turnos.append(turno)
        self.ocupados.add((day, start_min, block.get("profesional", "dra")))
        if estado == "atendido":
            self.ultima_visita[patient["id"]] = day
        return turno

    def free_slot(self, service_key, after_day, max_days=4):
        """Primer horario libre del mismo servicio dentro de la ventana de 48 h siguiente."""
        day = after_day
        for _ in range(max_days):
            day += timedelta(days=1)
            if day > self.hasta or self.is_closed(day):
                continue
            for service, block, start in self.slots_for(day):
                if service["clave"] == service_key and (day, start, block.get("profesional", "dra")) not in self.ocupados:
                    return block, day, start
        return None

    def rebook(self, turno, patient):
        found = self.free_slot(turno["servicio"], date.fromisoformat(turno["inicio"][:10]))
        if found:
            block, day, start = found
            self.add_turno(self.services[turno["servicio"]], block, day, start, patient,
                           estado="atendido" if self.rng.random() < .9 else "inasistencia",
                           canal="WhatsApp", reprogramado_de=turno["id"])

    def run(self):
        rng = self.rng
        self.seed_existing_patients()
        day = DESDE
        rojo_day, rojo_from, rojo_motivo = CODIGO_ROJO
        while day <= self.hasta:
            if not self.is_closed(day):
                for service, block, start in sorted(self.slots_for(day), key=lambda s: s[2]):
                    prof = block.get("profesional", "dra")
                    if (day, start, prof) in self.ocupados:
                        continue
                    rate = OCUPACION_MES[day.month] * AJUSTE_SERVICIO.get(service["clave"], {}).get(day.month, 1)
                    if rng.random() > min(rate, .97):
                        continue
                    patient = self.patient_for(service["clave"], day, block["sede"])
                    if not patient:
                        continue
                    if day == rojo_day and start >= gp.minutes(rojo_from) and prof == "dra":
                        turno = self.add_turno(service, block, day, start, patient,
                                               estado="reprogramado", motivo=rojo_motivo)
                    else:
                        turno = self.add_turno(service, block, day, start, patient)
                    if turno["estado"] == "reprogramado":
                        self.rebook(turno, patient)
            day += timedelta(days=1)
        self.build_waitlist()
        return self

    def build_waitlist(self):
        rng = self.rng
        for i in range(70):
            patient = rng.choice(self.pacientes)
            requested = DESDE + timedelta(days=rng.randint(0, (self.hasta - DESDE).days))
            estado = pick(rng, [("agendado", 55), ("notificado", 20), ("esperando", 10), ("desistió", 15)])
            if requested > self.hasta - timedelta(days=3):
                estado = "esperando"
            service = rng.choice([s for s in self.services if s != "primera_consulta"])
            self.espera.append({
                "id": f"E{i + 1:03d}", "paciente_id": patient["id"], "responsable_id": patient["responsable_id"],
                "servicio": service, "sede_preferida": rng.choice([s for s in self.sedes if s != "virtual"]),
                "dias_preferidos": ", ".join(sorted(rng.sample(gp.DAY_NAMES[1:7], rng.randint(1, 3)),
                                                   key=gp.DAY_NAMES.index)),
                "solicitado_en": requested.isoformat(), "estado": estado,
                "motivo": "Pidió turno fuera de la ventana de 48 h",
            })
        self.espera.sort(key=lambda e: e["solicitado_en"])

    # ---------- salida ----------
    def summary(self):
        by_month, by_status, by_service, by_sede, by_canal, by_idioma = {}, {}, {}, {}, {}, {}
        for t in self.turnos:
            for bucket, key in ((by_month, t["inicio"][:7]), (by_status, t["estado"]), (by_service, t["servicio"]),
                                (by_sede, t["sede"]), (by_canal, t["canal"]), (by_idioma, t["idioma"])):
                bucket[key] = bucket.get(key, 0) + 1
        attended = [t for t in self.turnos if t["estado"] == "atendido"]
        return {
            "_modo": "DEMO — datos ficticios",
            "periodo": [DESDE.isoformat(), self.hasta.isoformat()],
            "responsables": len(self.responsables), "pacientes": len(self.pacientes),
            "familias_con_varios_hijos": sum(1 for r in self.responsables
                                            if sum(p["responsable_id"] == r["id"] for p in self.pacientes) > 1),
            "turnos": len(self.turnos), "lista_espera": len(self.espera),
            "facturado_atendidos_gs": sum(int(t["monto_gs"]) for t in attended),
            "turnos_por_mes": dict(sorted(by_month.items())), "por_estado": by_status,
            "por_servicio": by_service, "por_sede": by_sede, "por_canal": by_canal, "por_idioma": by_idioma,
        }

    def write(self, out_dir=gp.DEMO_DIR):
        out_dir.mkdir(parents=True, exist_ok=True)
        for name, rows in (("responsables.csv", self.responsables), ("pacientes.csv", self.pacientes),
                           ("turnos.csv", self.turnos), ("lista_espera.csv", self.espera)):
            with open(out_dir / name, "w", encoding="utf-8", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=list(rows[0]))
                writer.writeheader()
                writer.writerows(rows)
        (out_dir / "resumen.json").write_text(json.dumps(self.summary(), ensure_ascii=False, indent=2) + "\n",
                                              encoding="utf-8")


def main(argv):
    hasta = date.fromisoformat(argv[argv.index("--hasta") + 1]) if "--hasta" in argv else HASTA_DEFAULT
    generator = Generator(gp.load_config(), hasta).run()
    generator.write()
    print(json.dumps(generator.summary(), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main(sys.argv)
