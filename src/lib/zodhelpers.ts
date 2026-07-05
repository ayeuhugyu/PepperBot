import z from "zod"

export type ZodAnySchema = z.ZodType<any, unknown, z.core.$ZodTypeInternals<any, unknown>>;
export type ZodInferSchema<S extends ZodAnySchema> = z.infer<S>;