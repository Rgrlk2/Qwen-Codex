import copy
import unittest
from datetime import date

import generar_demo
import ghl_provision as gp


def blank_config():
    """Config con datos operativos faltantes, para probar que nada se inventa."""
    config = copy.deepcopy(gp.load_config())
    config["seguros_aceptados"] = None
    config["clinica"]["ghl_user_id"] = None
    for service in config["servicios"]:
        service["horarios"] = None
        service["precio_particular_gs"] = None
    return config


class ProvisionTests(unittest.TestCase):
    def test_open_hours_conversion(self):
        result = gp.open_hours_payload([{"dias": [4], "desde": "14:30", "hasta": "18:00"}])
        self.assertEqual(result, [{"daysOfTheWeek": [4], "hours": [
            {"openHour": 14, "openMinute": 30, "closeHour": 18, "closeMinute": 0}]}])

    def test_open_hours_rejects_bad_input(self):
        with self.assertRaises(gp.ConfigError):
            gp.open_hours_payload([{"dias": [7], "desde": "08:00", "hasta": "12:00"}])
        with self.assertRaises(gp.ConfigError):
            gp.open_hours_payload([{"dias": [1], "desde": "12:00", "hasta": "08:00"}])

    def test_demo_schedule_is_valid(self):
        self.assertEqual(gp.schedule_errors(gp.load_config()), [])

    def test_detects_overlap_and_out_of_hours(self):
        config = copy.deepcopy(gp.load_config())
        consulta = next(s for s in config["servicios"] if s["clave"] == "consulta_enfermedad")
        consulta["horarios"].append({"sede": "hernandarias", "dias": [3], "desde": "10:00", "hasta": "13:00"})
        errors = gp.schedule_errors(config)
        self.assertTrue(any("Superposición" in e for e in errors))
        self.assertTrue(any("fuera del horario" in e for e in errors))

    def test_licenciada_can_overlap_with_doctor(self):
        config = copy.deepcopy(gp.load_config())
        vacunas = next(s for s in config["servicios"] if s["clave"] == "vacunacion")
        vacunas["horarios"].append({"sede": "hernandarias", "dias": [1], "desde": "08:00", "hasta": "09:00",
                                    "profesional": "lic"})
        self.assertEqual(gp.schedule_errors(config), [])

    def test_one_calendar_per_service_and_sede(self):
        names = [gp.calendar_name(s, sede) for s, sede, _ in gp.calendar_specs(gp.load_config())]
        self.assertEqual(len(names), len(set(names)))
        self.assertIn("AgendarIA · Consulta por enfermedad · Santa Rita", names)
        self.assertFalse(any("Electroencefalografía" in n for n in names))

    def test_calendar_enforces_48h_window_and_personal_user(self):
        config = gp.load_config()
        service, sede, blocks = gp.calendar_specs(config)[0]
        payload = gp.calendar_payload(config, service, sede, blocks, "LOC")
        self.assertEqual((payload["allowBookingFor"], payload["allowBookingForUnit"]), (2, "days"))
        self.assertFalse(payload["autoConfirm"])
        self.assertEqual(payload["calendarType"], "personal")
        self.assertEqual(payload["teamMembers"][0]["userId"], "szEt5JMJQiTra12QG6q4")
        self.assertEqual(payload["teamMembers"][0]["meetingLocation"], sede["direccion"])

    def test_licenciada_calendar_assigned_to_her_user(self):
        config = copy.deepcopy(gp.load_config())
        next(p for p in config["clinica"]["profesionales"] if p["clave"] == "lic")["ghl_user_id"] = "LIC1"
        specs = {(s["clave"], sede["clave"]): (s, sede, b) for s, sede, b in gp.calendar_specs(config)}
        lic = gp.calendar_payload(config, *specs[("vacunacion", "hernandarias")], "LOC")
        dra = gp.calendar_payload(config, *specs[("vacunacion", "cde_centro")], "LOC")
        self.assertEqual(lic["teamMembers"][0]["userId"], "LIC1")
        self.assertEqual(dra["teamMembers"][0]["userId"], "szEt5JMJQiTra12QG6q4")

    def test_event_calendar_without_user(self):
        config = copy.deepcopy(gp.load_config())
        config["clinica"]["ghl_user_id"] = None
        service, sede, blocks = gp.calendar_specs(config)[0]
        self.assertEqual(gp.calendar_payload(config, service, sede, blocks, "LOC")["calendarType"], "event")

    def test_plan_skips_services_without_hours(self):
        plan = gp.build_plan(blank_config(), "LOC")
        self.assertEqual(plan["calendars"], [])
        skipped = {s["servicio"] for s in plan["skipped_calendars"]}
        self.assertIn("Consulta por enfermedad", skipped)
        self.assertNotIn("Electroencefalografía", skipped)

    def test_plan_is_idempotent(self):
        config = gp.load_config()
        fields = [{"name": f["name"]} for f in gp.custom_field_payloads(config)]
        tags = [{"name": t} for t in gp.TAGS]
        calendars = [{"name": gp.calendar_name(s, sede)} for s, sede, _ in gp.calendar_specs(config)]
        plan = gp.build_plan(config, "LOC", fields, tags, calendars)
        self.assertEqual((plan["custom_fields"], plan["tags"], plan["calendars"]), ([], [], []))

    def test_option_fields_list_active_services_and_sedes(self):
        fields = {f["name"]: f for f in gp.custom_field_payloads(gp.load_config())}
        self.assertNotIn("Electroencefalografía", fields["Servicio solicitado"]["options"])
        self.assertIn("Vacunación", fields["Servicio solicitado"]["options"])
        self.assertIn("Santa Rita — Centro Médico Demo", fields["Sede preferida"]["options"])

    def test_kb_marks_demo_and_never_invents_missing_prices(self):
        self.assertIn("DATOS DE MUESTRA", gp.render_kb(gp.load_config()))
        kb = gp.render_kb(blank_config())
        self.assertIn("PENDIENTE", kb)
        self.assertNotIn("Gs. 0", kb.split("## Vacunas")[0])
        self.assertIn("todavía no disponible", kb)
        self.assertIn("Sanatorio Le Blanc", kb)

    def test_kb_explains_sena_only_for_particulares(self):
        kb = gp.render_kb(gp.load_config())
        self.assertIn("seña de Gs. 100.000", kb)
        self.assertIn("por seguro no pagan seña", kb)
        self.assertIn("Banco Itaú Paraguay", kb)
        self.assertIn("Secretaría verifica que el dinero ingresó", kb)

    def test_gaps_reported(self):
        gaps = gp.config_gaps(blank_config())
        self.assertIn("seguros_aceptados", gaps)
        self.assertIn("consulta_enfermedad.horarios", gaps)

    def test_demo_contact_is_do_not_disturb(self):
        responsable = {"nombre": "Ana", "apellido": "Demo", "telefono": "+595900123456", "email": "a@example.com",
                       "parentesco": "Madre", "sede_habitual": "cde_centro", "seguro": "", "idioma": "Español"}
        child = {"nombre": "Mateo", "apellido": "Demo", "fecha_nacimiento": "2020-01-01"}
        body = gp.contact_payload(responsable, [child], {"nombre_hijo": "F1"}, {"cde_centro": "CDE"})
        self.assertTrue(body["dnd"])
        self.assertIn(gp.DEMO_TAG, body["tags"])
        self.assertEqual(body["customFields"], [{"id": "F1", "field_value": "Mateo Demo"}])

    def test_demo_appointment_never_notifies(self):
        turno = {"servicio_nombre": "Vacunación", "inicio": "2026-03-02T08:00", "fin": "2026-03-02T08:15",
                 "estado": "inasistencia", "sede_nombre": "CDE"}
        body = gp.appointment_payload(turno, "CAL", "CON", {"nombre": "Lucía", "apellido": "Demo"})
        self.assertFalse(body["toNotify"])
        self.assertEqual(body["appointmentStatus"], "noshow")
        self.assertEqual(body["startTime"], "2026-03-02T08:00:00-03:00")


class DemoDataTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.gen = generar_demo.Generator(gp.load_config(), date(2026, 10, 10)).run()

    def test_deterministic(self):
        other = generar_demo.Generator(gp.load_config(), date(2026, 10, 10)).run()
        self.assertEqual(self.gen.turnos, other.turnos)

    def test_period_and_closed_days(self):
        days = {t["inicio"][:10] for t in self.gen.turnos}
        self.assertGreaterEqual(min(days), "2026-01-01")
        self.assertLessEqual(max(days), "2026-10-10")
        for closed in ("2026-01-01", "2026-04-03", "2026-07-22", "2026-09-29"):
            self.assertNotIn(closed, days)

    def test_no_double_booking_per_professional(self):
        seen = set()
        for t in self.gen.turnos:
            key = (t["inicio"], t["profesional"])
            self.assertNotIn(key, seen)
            seen.add(key)

    def test_turnos_inside_configured_blocks(self):
        services = {s["clave"]: s for s in gp.active_services(gp.load_config())}
        for t in self.gen.turnos[:500]:
            weekday = (date.fromisoformat(t["inicio"][:10]).weekday() + 1) % 7
            start = gp.minutes(t["inicio"][11:])
            self.assertTrue(any(b["sede"] == t["sede"] and weekday in b["dias"]
                                and gp.minutes(b["desde"]) <= start < gp.minutes(b["hasta"])
                                for b in services[t["servicio"]]["horarios"]), t)

    def test_rebooked_turnos_reference_original(self):
        ids = {t["id"]: t for t in self.gen.turnos}
        rebooked = [t for t in self.gen.turnos if t["reprogramado_de"]]
        self.assertTrue(rebooked)
        for t in rebooked:
            self.assertEqual(ids[t["reprogramado_de"]]["estado"], "reprogramado")
            self.assertGreater(t["inicio"], ids[t["reprogramado_de"]]["inicio"])

    def test_codigo_rojo_day(self):
        rojo = [t for t in self.gen.turnos if t["motivo_estado"].startswith("Código Rojo")]
        self.assertTrue(rojo)
        self.assertTrue(all(t["inicio"].startswith("2026-08-18T") and t["inicio"][11:] >= "14:00" for t in rojo))

    def test_fictitious_identifiers_only(self):
        for r in self.gen.responsables:
            self.assertTrue(r["telefono"].startswith("+595900"))
            self.assertTrue(r["email"].endswith("@example.com"))
        self.assertTrue(all(p["documento"].startswith(("DEMO-", "PROV-")) for p in self.gen.pacientes))

    def test_sena_only_on_particular_turnos(self):
        for t in self.gen.turnos:
            if t["cobertura"] == "Seguro":
                self.assertEqual(t["sena_gs"], 0)
            elif t["estado"] in ("atendido", "inasistencia", "reprogramado"):
                self.assertEqual(t["sena_gs"], 100000)
        expired = [t for t in self.gen.turnos if t["motivo_estado"].startswith("Preturno vencido")]
        self.assertTrue(expired)
        self.assertTrue(all(t["sena_gs"] == 0 and t["cobertura"] == "Particular" for t in expired))

    def test_families_with_several_children(self):
        self.assertGreater(self.gen.summary()["familias_con_varios_hijos"], 50)


if __name__ == "__main__":
    unittest.main()
