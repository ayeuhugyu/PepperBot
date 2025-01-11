import * as classes from "../lib/classDefinitions.js"

export default {
    ardour: new classes.murmur({
        "name": "ardour",
        "rich_name": "Ardour",
        "description": "An application of the Song that enables one to channel the Murmur into raw strength. Press H.",
        "murmurGiver": "old_stranger"
    }),
    tacet: new classes.murmur({
        "name": "tacet",
        "rich_name": "Tacet",
        "description": "An application of the Song that enables the user to suppress their own Murmur. Press T while crouched.",
        "murmurGiver": "cestis"
    }),
    rythm: new classes.murmur({
        "name": "rythm",
        "rich_name": "Rythm",
        "description": "An application of the Song that enables the user to percieve the subtle Murmur emanating from all things. Press G while crouched.",
        "murmurGiver": "kadrivus_entomolius_auditan"
    })
}