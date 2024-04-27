const NEWLINE_PLACEHOLDER = "§";
const newlinesRegex = /\n\s*/g;

const punctuation = `[](){}!?.,:;'"\/*&^%$_+-–—=<>@|~`.split("").join("\\");
const ellipsis = "\\.{3}";

const words = "[a-zA-Zа-яА-ЯёЁ]+";
const compounds = `${words}-${words}`;

const tokenizeRegex = new RegExp(
    `(${ellipsis}|${compounds}|${words}|[${punctuation}])`
);

function exists(entity) {
    return !!entity;
}

export function tokenize(text) {
    return text
        .replaceAll(newlinesRegex, NEWLINE_PLACEHOLDER)
        .split(tokenizeRegex)
        .filter(exists);
}

const PARAGRAPH_CHARACTER = " \n";

export function textify(tokens) {
    return tokens.join("").replaceAll(NEWLINE_PLACEHOLDER, PARAGRAPH_CHARACTER);
}
