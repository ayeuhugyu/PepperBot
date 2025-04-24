class TablifyOptions {
    no_header: boolean = false;
    header_seperator: string = '-';
    column_separator: string = ' | ';
    row_separator: string = '\n';
    padding_character: string = ' ';
    non_padded_column_names: string[] = [];
    non_padded_row_indexes: number[] = [];

    constructor(init?: Partial<TablifyOptions>) {
        Object.assign(this, init);
    }
}

export function tablify(input_columns: string[], rows: string[][], input_options?: Partial<TablifyOptions>) {
    const options = new TablifyOptions(input_options);
    const columns: string[][] = [];
    input_columns.forEach((column, index) => {
        let columnData = rows.map(row => row[index]);
        if (!options.no_header) {
            columnData.unshift(column);
        }
        const maxLength = Math.max(...columnData.map(item => (item || "").length));
        const dontPad = options.non_padded_column_names.includes(column) || columnData.every(item => item.length === maxLength);
        if (!options.no_header) {
            const header_seperator = options.header_seperator.repeat(dontPad ? column.length : maxLength);
            columnData.splice(1, 0, header_seperator);
        }
        if (!dontPad) {
            columnData = columnData.map(item => (item || "")?.padEnd(maxLength, options.padding_character));
        }
        columns.push(columnData);
    });

    const finalString = columns[0].map((_, rowIndex) => {
        const dontPadRow = options.non_padded_row_indexes.includes(rowIndex - (options.no_header ? 0 : 1));
        let rowString = options.column_separator +
            columns.map(column => column[rowIndex]).join(options.column_separator) +
            options.column_separator;

        if (!dontPadRow && rowString.startsWith(' ' + options.column_separator.slice(1))) {
            rowString = rowString.slice(1);
        }

        return rowString;
    }).join(options.row_separator);

    return finalString;
}