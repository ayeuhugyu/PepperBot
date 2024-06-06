import * as log from "./log.js";
const start = performance.now();
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

const emojisNonDefault = await import("../../resources/data/emojis.json", {
    assert: { type: "json" },
});
if (!configNonDefault || !configNonDefault.default)
    throw new Error("emojis.json unable to be imported");
export const emojis = emojisNonDefault.default;

const deepwoken_namesnondefault = await import(
    "../../resources/data/deepwoken_names.json",
    { assert: { type: "json" } }
);
if (!configNonDefault || !configNonDefault.default)
    throw new Error("deepwoken_names.json unable to be imported");
export const deepwoken_names = deepwoken_namesnondefault.default;

const allWordsNonDefault = await import(
    "../../resources/data/the_english_lexicon.json",
    { assert: { type: "json" } }
);
if (!configNonDefault || !configNonDefault.default)
    throw new Error("the_english_lexicon.json unable to be imported");
export const allWords = allWordsNonDefault.default;

const nounsNonDefault = await import(
    "../../resources/data/nouns.json",
    { assert: { type: "json" } }
);
if (!configNonDefault || !configNonDefault.default)
    throw new Error("nouns.json unable to be imported");
export const nouns = nounsNonDefault.default;

const verbsNonDefault = await import(
    "../../resources/data/verbs.json",
    { assert: { type: "json" } }
);
if (!configNonDefault || !configNonDefault.default)
    throw new Error("verbs.json unable to be imported");
export const verbs = verbsNonDefault.default;

log.info(`loaded JSONs in ${Math.floor(performance.now() - start)}ms`);
