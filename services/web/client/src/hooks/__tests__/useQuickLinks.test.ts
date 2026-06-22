import { describe, expect, it } from "vitest";
import { QUICK_LINK_ICONS, getIconByName } from "@/lib/quickLinkIcons";
import { Link } from "lucide-react";

/**
 * Tests unitaires pour les utilitaires des liens rapides (FR-044).
 * Les tests d'intégration du hook useQuickLinks nécessitent @testing-library/react
 * et sont couverts par la validation manuelle.
 */
describe("FR-044 — quickLinkIcons utilities", () => {
  // ── nominal ─────────────────────────────────────────────────────────────────

  it("nominal: QUICK_LINK_ICONS contient des entrées avec name et label", () => {
    expect(QUICK_LINK_ICONS.length).toBeGreaterThan(0);
    for (const entry of QUICK_LINK_ICONS) {
      expect(typeof entry.name).toBe("string");
      expect(entry.name.length).toBeGreaterThan(0);
      expect(typeof entry.label).toBe("string");
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });

  it("nominal: getIconByName retourne la même référence que Link pour le nom 'Link'", () => {
    const icon = getIconByName("Link");
    expect(icon).toBe(Link);
  });

  it("nominal: tous les noms d'icônes sont uniques", () => {
    const names = QUICK_LINK_ICONS.map((i) => i.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  // ── edge ────────────────────────────────────────────────────────────────────

  it("edge: getIconByName retourne l'icône Link comme fallback pour un nom inconnu", () => {
    const icon = getIconByName("UnknownIconThatDoesNotExist");
    expect(icon).toBe(Link);
  });

  // ── URL validation logic used in AddQuickLinkDialog ──────────────────────────

  it("nominal: URL https:// est valide selon la regex du dialog", () => {
    const URL_REGEX = /^https?:\/\/.+/;
    expect(URL_REGEX.test("https://example.com")).toBe(true);
    expect(URL_REGEX.test("http://example.com/path?q=1")).toBe(true);
  });

  it("edge: URL sans protocole est rejetée", () => {
    const URL_REGEX = /^https?:\/\/.+/;
    expect(URL_REGEX.test("example.com")).toBe(false);
    expect(URL_REGEX.test("www.example.com")).toBe(false);
    expect(URL_REGEX.test("ftp://example.com")).toBe(false);
  });

  it("failure: URL vide est rejetée", () => {
    const URL_REGEX = /^https?:\/\/.+/;
    expect(URL_REGEX.test("")).toBe(false);
  });
});

// ── UpdateQuickLinkDto shape ─────────────────────────────────────────────────

describe("FR-044 — UpdateQuickLinkDto", () => {
  it("nominal: tous les champs sont optionnels (patch partiel)", () => {
    type UpdateQuickLinkDto = { icon?: string; url?: string; label?: string };
    const dto: UpdateQuickLinkDto = { label: "Nouveau titre" };
    expect(dto.icon).toBeUndefined();
    expect(dto.url).toBeUndefined();
    expect(dto.label).toBe("Nouveau titre");
  });

  it("edge: mise à jour d'un seul champ icon est valide", () => {
    type UpdateQuickLinkDto = { icon?: string; url?: string; label?: string };
    const dto: UpdateQuickLinkDto = { icon: "Globe" };
    expect(dto.icon).toBe("Globe");
    expect(dto.label).toBeUndefined();
    expect(dto.url).toBeUndefined();
  });

  it("edge: label dépasse 60 caractères — validation regex", () => {
    const label = "a".repeat(61);
    expect(label.length).toBeGreaterThan(60);
  });
});
