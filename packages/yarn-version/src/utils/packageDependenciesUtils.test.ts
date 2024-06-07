import { PackageDependencyDescriptorUtils } from "./packageDependenciesUtils";

describe("PackageDependencyDescriptorUtils.parse", () => {
  it.each([
    [
      ["name", "1.1.1"],
      { key: "name", name: { name: "name" }, selector: "1.1.1" },
    ],
    [
      ["name2", "npm:@scope/name@1.1.1"],
      {
        key: "name2",
        name: { scope: "scope", name: "name" },
        selector: "1.1.1",
      },
    ],
  ] as const)('should parse "%s" to "%s"', ([k, v], expected) => {
    expect(PackageDependencyDescriptorUtils.parse(k, v)).toStrictEqual(
      expected,
    );
  });
});

// describe(stringifyPackageDescriptor.name, () => {});
