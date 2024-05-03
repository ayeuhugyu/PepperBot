const configNonDefault = await import("../../config.json", {
    assert: { type: "json" },
});
if (!configNonDefault || !configNonDefault.default)
    throw new Error("config.json unable to be imported");
export const config = configNonDefault.default;

const persistenDataNonDefault = await import(
    "../../resources/data/persistent_data.json",
    { assert: { type: "json" } }
);
if (!configNonDefault || !configNonDefault.default)
    throw new Error("persistent_data.json unable to be imported");
export const persistent_data = persistenDataNonDefault.default;

const reactionRolesNonDefault = await import(
    "../../resources/data/reaction_roles.json",
    { assert: { type: "json" } }
);
if (!configNonDefault || !configNonDefault.default)
    throw new Error("reaction_roles.json unable to be imported");
export const reaction_roles = reactionRolesNonDefault.default;

const diabolicalEventsNonDefault = await import(
    "../../resources/data/diabolical_events.json",
    { assert: { type: "json" } }
);
if (!configNonDefault || !configNonDefault.default)
    throw new Error("diabolical_events.json unable to be imported");
export const diabolical_events = diabolicalEventsNonDefault.default;

// i honestly do not care that it still tries to export it if it fails to import, if it fails to import there's a more serious problem than that anyway
