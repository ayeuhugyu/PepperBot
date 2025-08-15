import database from "./data_manager";
import * as log from "./log";

export interface MaintenanceMode {
    id: number;
    enabled: boolean;
    end_timestamp: string | null;
    created_at: string;
    updated_at: string;
}

export async function getMaintenanceMode(): Promise<MaintenanceMode | null> {
    try {
        const result = await database("maintenance_mode").select("*").first();
        return result || null;
    } catch (error) {
        log.error(`failed to get maintenance mode: ${error}`);
        return null;
    }
}

export async function enableMaintenanceMode(endTimestamp?: string): Promise<void> {
    try {
        const existing = await database("maintenance_mode").select("*").first();

        if (existing) {
            await database("maintenance_mode")
                .where("id", existing.id)
                .update({
                    enabled: true,
                    end_timestamp: endTimestamp || null,
                    updated_at: database.fn.now()
                });
        } else {
            await database("maintenance_mode").insert({
                enabled: true,
                end_timestamp: endTimestamp || null
            });
        }

        // set environment variable
        process.env.MAINTENANCE_MODE = "true";
        process.env.MAINTENANCE_END_TIMESTAMP = endTimestamp || "";

        log.info(`maintenance mode enabled${endTimestamp ? ` until ${endTimestamp}` : ""}`);
    } catch (error) {
        log.error(`failed to enable maintenance mode: ${error}`);
        throw error;
    }
}

export async function disableMaintenanceMode(): Promise<void> {
    try {
        const existing = await database("maintenance_mode").select("*").first();

        if (existing) {
            await database("maintenance_mode")
                .where("id", existing.id)
                .update({
                    enabled: false,
                    end_timestamp: null,
                    updated_at: database.fn.now()
                });
        }

        // clear environment variables
        delete process.env.MAINTENANCE_MODE;
        delete process.env.MAINTENANCE_END_TIMESTAMP;

        log.info("maintenance mode disabled");
    } catch (error) {
        log.error(`failed to disable maintenance mode: ${error}`);
        throw error;
    }
}

export async function isMaintenanceModeActive(): Promise<boolean> {
    // check environment variable first for performance
    if (process.env.MAINTENANCE_MODE === "true") {
        return true;
    }

    const maintenanceMode = await getMaintenanceMode();
    return maintenanceMode?.enabled || false;
}

export async function initializeMaintenanceMode(): Promise<void> {
    try {
        const maintenanceMode = await getMaintenanceMode();

        if (maintenanceMode?.enabled) {
            process.env.MAINTENANCE_MODE = "true";
            process.env.MAINTENANCE_END_TIMESTAMP = maintenanceMode.end_timestamp || "";
            log.info(`maintenance mode restored from database`);
        }
    } catch (error) {
        log.error(`failed to initialize maintenance mode: ${error}`);
    }
}

export function getMaintenanceEndTimestamp(): string | null {
    return process.env.MAINTENANCE_END_TIMESTAMP || null;
}
