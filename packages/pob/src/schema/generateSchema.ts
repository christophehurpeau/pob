/* oxlint-disable eslint-js/no-bitwise -- TypeScript types and symbols have bit flags */
/**
 * Generates the JSON schema of pob.json from the `PobConfig` type of
 * src/engine/config.ts, with the JSDoc of each key as description.
 */
import { fileURLToPath } from "node:url";
import { format } from "oxfmt";
import ts from "typescript";

type JsonSchema = Record<string, unknown>;

const configPath = fileURLToPath(
  new URL("../engine/config.ts", import.meta.url),
);

const describe = (
  checker: ts.TypeChecker,
  symbol: ts.Symbol | undefined,
): Record<string, string> => {
  if (!symbol) return {};
  const description = ts
    .displayPartsToString(symbol.getDocumentationComment(checker))
    .trim();
  const deprecated = symbol
    .getJsDocTags(checker)
    .some((tag) => tag.name === "deprecated");
  return {
    ...(description ? { description } : {}),
    ...(deprecated ? { deprecated: "true" } : {}),
  };
};

const toSchema = (
  checker: ts.TypeChecker,
  type: ts.Type,
  seen: Set<ts.Type>,
): JsonSchema => {
  if (type.flags & ts.TypeFlags.BooleanLiteral) {
    return { const: checker.typeToString(type) === "true" };
  }
  if (type.flags & ts.TypeFlags.Boolean) return { type: "boolean" };
  if (type.isStringLiteral()) return { const: type.value };
  if (type.isNumberLiteral()) return { const: type.value };
  if (type.flags & ts.TypeFlags.String) return { type: "string" };
  if (type.flags & ts.TypeFlags.Number) return { type: "number" };
  if (type.flags & (ts.TypeFlags.Unknown | ts.TypeFlags.Any)) return {};

  if (type.isUnion()) {
    const members = type.types.filter(
      (member) => !(member.flags & ts.TypeFlags.Undefined),
    );
    const isBoolean = members.every(
      (member) => member.flags & ts.TypeFlags.BooleanLiteral,
    );
    if (isBoolean && members.length === 2) return { type: "boolean" };
    if (members.every((member) => member.isStringLiteral())) {
      return {
        enum: members.map((member) => member.value),
      };
    }
    if (members.length === 1 && members[0]) {
      return toSchema(checker, members[0], seen);
    }
    return { anyOf: members.map((member) => toSchema(checker, member, seen)) };
  }

  if (checker.isArrayType(type)) {
    const [itemType] = checker.getTypeArguments(type as ts.TypeReference);
    return {
      type: "array",
      items: itemType ? toSchema(checker, itemType, seen) : {},
    };
  }

  if (type.flags & ts.TypeFlags.Object) {
    if (seen.has(type)) return {};
    seen.add(type);
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];
    for (const property of checker.getPropertiesOfType(type)) {
      const declaration =
        property.valueDeclaration ?? property.declarations?.[0];
      if (!declaration) continue;
      const propertyType = checker.getTypeOfSymbolAtLocation(
        property,
        declaration,
      );
      const { deprecated, ...description } = describe(checker, property);
      properties[property.name] = {
        ...description,
        ...(deprecated ? { deprecated: true } : {}),
        ...toSchema(checker, propertyType, seen),
      };
      if (!(property.flags & ts.SymbolFlags.Optional)) {
        required.push(property.name);
      }
    }
    seen.delete(type);
    const indexType = checker.getIndexTypeOfType(type, ts.IndexKind.String);
    return {
      type: "object",
      properties,
      ...(required.length > 0 ? { required } : {}),
      additionalProperties: indexType
        ? toSchema(checker, indexType, seen)
        : false,
    };
  }

  throw new Error(
    `Unsupported type in PobConfig: ${checker.typeToString(type)}`,
  );
};

export const generatePobConfigSchema = (): JsonSchema => {
  const program = ts.createProgram([configPath], {
    strict: true,
    noEmit: true,
    allowImportingTsExtensions: true,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
  });
  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(configPath);
  if (!sourceFile) throw new Error(`Cannot read ${configPath}`);
  const declaration = sourceFile.statements.find(
    (statement): statement is ts.InterfaceDeclaration =>
      ts.isInterfaceDeclaration(statement) &&
      statement.name.text === "PobConfig",
  );
  if (!declaration) throw new Error("PobConfig not found");
  const type = checker.getTypeAtLocation(declaration);
  return {
    $schema: "https://json-schema.org/draft-07/schema#",
    title: "pob.json",
    description:
      "Config of pob: the files of the package are generated from it. Run `pob explain <file>` to know which keys control a file.",
    ...toSchema(checker, type, new Set()),
  };
};

/** formatted like the repository formats json files */
export const serializeSchema = async (schema: JsonSchema): Promise<string> => {
  const { code } = await format("pob.schema.json", JSON.stringify(schema), {
    printWidth: 80,
  });
  return code;
};
