import type { ParameterSpec } from "foss-earth/settings";
import {
  catalogueDefaults,
  catalogueSpec,
  catalogueStore,
  type CatalogueParameters,
  type CatalogueRegistry,
  type CatalogueStore,
  type CatalogueValues,
} from "@0sfs/engines/parameterCatalogue";

/**
 * The autopilot's flight parameters: its part of the flight's settings, with
 * their homes, section titles and defaults. The host composes the parts into
 * its catalogue in this order and registers them. Spec:
 * docs/proposals/flight-settings.md.
 */

const AUTOPILOT = { tab: "autopilot", section: "package" } as const;

/** Section titles for the sections only the autopilot's parameters are in, by tab and section id. */
export const AUTOPILOT_SECTION_TITLES: readonly (readonly [tab: string, section: string, title: string])[] = [
  ["autopilot", "package", "Autopilot"],
];

const main = <T extends { tab: string; section: string }>(home: T) => ({ ...home, level: "main" as const });
const all = <T extends { tab: string; section: string }>(home: T) => ({ ...home, level: "all" as const });
const within = (min: number, max: number) => () => ({ min, max });

export const AUTOPILOT_PARAMETERS = [
  // Autopilot: what the HUD's AP button engages.
  {
    id: "osfs.autopilot.backend",
    label: "Autopilot backend",
    description: "Which autopilot flies the automated axes: the one built in, or ArduPilot when it is connected.",
    unit: "none",
    kind: "choice",
    choices: [
      { id: "ours", label: "Built in" },
      { id: "ardupilot", label: "ArduPilot" },
    ],
    default: "ours",
    defaultReason: "The built-in autopilot needs nothing else running.",
    home: main(AUTOPILOT),
    appliesLive: true,
    source: "autopilot/src/controlArbiter.ts",
  },
  autopilotAxis("roll", "Roll", "Stabilizes bank with the ailerons."),
  autopilotAxis("pitch", "Pitch", "Holds pitch attitude with the elevator."),
  autopilotAxis("yaw", "Yaw / rudder", "Yaw damper and heading hold with the rudder."),
  autopilotAxis("throttle", "Throttle", "Auto-throttle using the throttle behaviour."),
  autopilotAxis("gear", "Landing gear", "Holds the gear lever while the autopilot is engaged."),
  autopilotAxis("flaps", "Flaps", "Holds flap position while the autopilot is engaged."),
  {
    id: "osfs.autopilot.throttleMode",
    label: "Throttle behaviour",
    description: "Airspeed holds the speed at engagement with the throttle; Hold keeps the lever where it was.",
    unit: "none",
    kind: "choice",
    choices: [
      { id: "airspeed", label: "Hold airspeed" },
      { id: "hold", label: "Hold lever" },
    ],
    default: "airspeed",
    defaultReason: "The original behaviour.",
    home: main(AUTOPILOT),
    appliesLive: true,
    source: "autopilot/src/ourAutopilot.ts",
  },
  {
    id: "osfs.autopilot.stickOverride",
    label: "Stick override",
    description: "The autopilot yields roll, pitch or yaw while the pilot deflects that control further than this, and recaptures the attitude on release.",
    unit: "fraction",
    kind: "number",
    step: 0.01,
    bounds: within(0.01, 0.5),
    default: 0.05,
    defaultReason: "The original value.",
    home: all(AUTOPILOT),
    appliesLive: true,
    source: "autopilot/src/ourAutopilot.ts",
  },
] as const satisfies readonly ParameterSpec[];

/** The effective value of each of the autopilot's parameters, by id. */
export type AutopilotParameterValues = CatalogueValues<typeof AUTOPILOT_PARAMETERS>;

export type AutopilotParameterId = keyof AutopilotParameterValues & string;

/** What the autopilot code reads its parameters through: the registry, or its defaults in a test. */
export type AutopilotParameters = CatalogueParameters<AutopilotParameterValues>;

/** Reads, writes and watches the autopilot's parameters, typed by id. */
export type AutopilotParameterStore = CatalogueStore<AutopilotParameterValues>;

/** The registry, typed for the autopilot's parameters. */
export function autopilotParameterStore(registry: CatalogueRegistry): AutopilotParameterStore {
  return catalogueStore(registry);
}

/** The spec of one of the autopilot's parameters. */
export const autopilotParameterSpec = catalogueSpec(AUTOPILOT_PARAMETERS);

/**
 * The autopilot's parameter defaults in memory, for code that runs without a
 * registry, such as a unit test. Overrides stand in for values the test sets.
 */
export function autopilotParameterDefaults(overrides: Partial<AutopilotParameterValues> = {}): AutopilotParameterStore {
  return catalogueDefaults(autopilotParameterSpec, overrides);
}

function autopilotAxis<Axis extends string>(axis: Axis, label: string, description: string) {
  return {
    id: `osfs.autopilot.axes.${axis}` as const,
    label: `Automate ${label.toLowerCase()}`,
    description,
    unit: "none" as const,
    kind: "boolean" as const,
    default: true,
    defaultReason: "The full package, as the AP button has always engaged it.",
    home: main(AUTOPILOT),
    appliesLive: true,
    source: "autopilot/src/controlArbiter.ts",
  };
}
