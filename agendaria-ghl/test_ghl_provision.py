import copy
import unittest

import ghl_provision as gp


def config_with_hours():
    config = copy.deepcopy(gp.load_config())
    for service in config["servicios"]:
        service["horarios"] = [{"dias": [1, 2, 3, 4, 5], "desde": "08:00", "hasta": "12:00"}]
        service["duracion_min"] = service["duracion_min"] or 30
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

    def test_calendar_enforces_48h_window_and_pending_confirmation(self):
        config = config_with_hours()
        service = gp.active_services(config)[0]
        payload = gp.calendar_payload(config, service, "LOC")
        self.assertEqual((payload["allowBookingFor"], payload["allowBookingForUnit"]), (2, "days"))
        self.assertFalse(payload["autoConfirm"])
        self.assertEqual(payload["slotDuration"], 20)
        self.assertEqual(payload["calendarType"], "event")

    def test_personal_calendar_when_user_configured(self):
        config = config_with_hours()
        config["clinica"]["ghl_user_id"] = "USER1"
        payload = gp.calendar_payload(config, gp.active_services(config)[0], "LOC")
        self.assertEqual(payload["calendarType"], "personal")
        self.assertEqual(payload["teamMembers"][0]["userId"], "USER1")

    def test_plan_skips_calendars_without_hours_and_inactive_services(self):
        plan = gp.build_plan(gp.load_config(), "LOC")
        self.assertEqual(plan["calendars"], [])
        skipped = {s["servicio"] for s in plan["skipped_calendars"]}
        self.assertIn("Consulta pediátrica", skipped)
        self.assertNotIn("Electroencefalografía", skipped)

    def test_plan_is_idempotent(self):
        config = config_with_hours()
        fields = [{"name": f["name"]} for f in gp.custom_field_payloads(config)]
        tags = [{"name": t} for t in gp.TAGS]
        calendars = [{"name": gp.CALENDAR_PREFIX + s["nombre"]} for s in gp.active_services(config)]
        plan = gp.build_plan(config, "LOC", fields, tags, calendars)
        self.assertEqual((plan["custom_fields"], plan["tags"], plan["calendars"]), ([], [], []))

    def test_service_field_lists_only_active_services(self):
        field = next(f for f in gp.custom_field_payloads(gp.load_config()) if f["name"] == "Servicio solicitado")
        self.assertNotIn("Electroencefalografía", field["options"])
        self.assertIn("Vacunación", field["options"])

    def test_kb_never_invents_missing_prices(self):
        kb = gp.render_kb(gp.load_config())
        self.assertIn("PENDIENTE", kb)
        self.assertNotIn("Gs. 0", kb)
        self.assertIn("todavía no disponible", kb)

    def test_gaps_reported(self):
        gaps = gp.config_gaps(gp.load_config())
        self.assertIn("clinica.direccion", gaps)
        self.assertIn("consulta_pediatrica.horarios", gaps)


if __name__ == "__main__":
    unittest.main()
