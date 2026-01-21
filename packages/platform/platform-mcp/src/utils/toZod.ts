import {JsonSchema} from "@tsed/schema";
import {type AnyZodObject, z, type ZodTypeAny} from "zod";

type JsonSchemaLike = ReturnType<JsonSchema["toJSON"]> & {
  properties?: Record<string, JsonSchemaLike>;
  items?: JsonSchemaLike;
  required?: string[];
  enum?: any[];
};

function createZodType(schema: JsonSchemaLike | undefined): ZodTypeAny {
  if (!schema) {
    return z.any();
  }

  switch (schema.type) {
    case "string": {
      let current = z.string();
      if (schema.enum?.length) {
        current = current.refine((value) => schema.enum!.includes(value));
      }
      return current;
    }
    case "number":
    case "integer":
      return z.number();
    case "boolean":
      return z.boolean();
    case "array":
      return z.array(createZodType(schema.items));
    case "object":
      return z.object(buildShape(schema) || {});
    default:
      return z.any();
  }
}

function buildShape(schema: JsonSchemaLike | undefined): Record<string, AnyZodObject> | undefined {
  if (!schema?.properties) {
    return undefined;
  }

  const required = new Set(schema.required || []);
  return Object.entries(schema.properties).reduce<Record<string, AnyZodObject>>((shape, [key, value]) => {
    const type = createZodType(value as JsonSchemaLike);
    shape[key] = required.has(key) ? type : type.optional();
    return shape;
  }, {});
}

export function toZod(schema: unknown): Record<string, AnyZodObject> | undefined {
  if (schema instanceof JsonSchema) {
    return buildShape(schema.toJSON() as JsonSchemaLike);
  }

  return schema as Record<string, AnyZodObject> | undefined;
}
