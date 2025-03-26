import { InvokerType } from "./classes/command_enums";
import database from "./data_manager";

enum StatisticsEntryType {
    COMMAND_USAGE = "COMMAND_USAGE",
    EXECUTION_TIME = "EXECUTION_TIME",
    GPT_RESPONSES = "GPT_RESPONSES",
    PIPED_COMMANDS = "PIPED_COMMANDS",
    INVOKER_TYPE = "INVOKER_TYPE"
}

type NotReal = undefined | null | never

type StatisticEntryNameLookup = {
    [StatisticsEntryType.COMMAND_USAGE]: string;
    [StatisticsEntryType.EXECUTION_TIME]: string;
    [StatisticsEntryType.GPT_RESPONSES]: NotReal;
    [StatisticsEntryType.PIPED_COMMANDS]: NotReal;
    [StatisticsEntryType.INVOKER_TYPE]: InvokerType;
};

type StatisticEntryValueLookup = {
    [StatisticsEntryType.COMMAND_USAGE]: number;
    [StatisticsEntryType.EXECUTION_TIME]: NotReal;
    [StatisticsEntryType.GPT_RESPONSES]: number;
    [StatisticsEntryType.PIPED_COMMANDS]: number;
    [StatisticsEntryType.INVOKER_TYPE]: number;
};

interface StatisticEntry<T extends StatisticsEntryType> {
    type: T;
    name: StatisticEntryNameLookup[T];
    value: StatisticEntryValueLookup[T];
    times?: T extends StatisticsEntryType.EXECUTION_TIME ? number[] : NotReal;
}

type dbStatistics = StatisticEntry<StatisticsEntryType>[];

export class Statistics {
    execution_times: Record<string, number[]> = {};
    command_usage: Record<string, number> = {};
    total_gpt_responses: number = 0;
    total_piped_commands: number = 0;
    invoker_type_usage: Record<InvokerType, number> = {
        interaction: 0,
        message: 0
    };
    constructor(data: dbStatistics) {
        data.forEach(entry => {
            switch (entry.type) {
                case StatisticsEntryType.COMMAND_USAGE:
                    this.command_usage[(entry as StatisticEntry<StatisticsEntryType.COMMAND_USAGE>).name] = entry.value as number;
                    break;
                case StatisticsEntryType.EXECUTION_TIME:
                    this.execution_times[(entry as StatisticEntry<StatisticsEntryType.EXECUTION_TIME>).name] = entry.times as number[];
                    break;
                case StatisticsEntryType.GPT_RESPONSES:
                    this.total_gpt_responses = entry.value as number;
                    break;
                case StatisticsEntryType.PIPED_COMMANDS:
                    this.total_piped_commands = entry.value as number;
                    break;
                case StatisticsEntryType.INVOKER_TYPE:
                    this.invoker_type_usage[(entry as StatisticEntry<StatisticsEntryType.INVOKER_TYPE>).name] = entry.value as number;
                    break;
            }
        });
    }
    async write(): Promise<void> {
        const data: dbStatistics = [];
        for (const command in this.command_usage) {
            data.push({
                type: StatisticsEntryType.COMMAND_USAGE,
                name: command,
                value: this.command_usage[command]
            });
        }
        for (const command in this.execution_times) {
            data.push({
                type: StatisticsEntryType.EXECUTION_TIME,
                name: command,
                value: 0,
                times: JSON.stringify(this.execution_times[command]) as any
            });
        }
        data.push({
            type: StatisticsEntryType.GPT_RESPONSES,
            name: "",
            value: this.total_gpt_responses
        });
        data.push({
            type: StatisticsEntryType.PIPED_COMMANDS,
            name: "",
            value: this.total_piped_commands
        });
        for (const invoker in this.invoker_type_usage) {
            data.push({
                type: StatisticsEntryType.INVOKER_TYPE,
                name: invoker as InvokerType,
                value: this.invoker_type_usage[invoker as InvokerType]
            });
        }
        await database("statistics").truncate();
        await database("statistics").insert(data);
    }
}

const statisticsExempt = ["restart", "eval"]; // could corrupt statistics from the process exiting before the statistics have finished writing

export async function getStatistics(): Promise<Statistics> {
    const rawData = await database("statistics").select("*");
    if (!rawData) return new Statistics([]);
    const data: dbStatistics = rawData.map((entry: any) => {
        return {
            type: entry.type as StatisticsEntryType,
            name: entry.name,
            value: entry.value,
            times: entry.type == StatisticsEntryType.EXECUTION_TIME ? JSON.parse(entry.times) : undefined
        } as StatisticEntry<StatisticsEntryType>;
    });
    return new Statistics(data);
}

export async function addExecutionTime(command: string, time: number): Promise<void> {
    if (statisticsExempt.includes(command)) return;
    const statistics = await getStatistics();
    if (!statistics.execution_times[command]) statistics.execution_times[command] = [];
    statistics.execution_times[command].push(time);
    await statistics.write();
}

export async function incrementCommandUsage(command: string): Promise<void> {
    if (statisticsExempt.includes(command)) return;
    const statistics = await getStatistics();
    if (!statistics.command_usage[command]) statistics.command_usage[command] = 0;
    statistics.command_usage[command]++;
    await statistics.write();
}

export async function incrementGPTResponses(): Promise<void> {
    const statistics = await getStatistics();
    statistics.total_gpt_responses++;
    await statistics.write();
}

export async function incrementPipedCommands(): Promise<void> {
    const statistics = await getStatistics();
    statistics.total_piped_commands++;
    await statistics.write();
}

export async function incrementInvokerTypeUsage(type: InvokerType): Promise<void> {
    const statistics = await getStatistics();
    statistics.invoker_type_usage[type]++;
    await statistics.write();
}