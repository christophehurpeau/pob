/**
 * Combination of an optional scope and name.
 *
 * eg `@npm/types`
 */
export interface PackageDescriptorName {
  scope?: string;
  name: string;
}

interface DescriptorUtils<Descriptor> {
  parse: (value: string) => Descriptor;
  stringify: (descriptor: Descriptor) => string;
}

export const PackageDescriptorNameUtils: DescriptorUtils<PackageDescriptorName> =
  {
    parse: (value) => {
      if (value.startsWith("@")) {
        const [scope, name] = value.slice(1).split("/", 2);
        if (!scope || !name) {
          throw new Error(`Invalid package descriptor name: ${value}`);
        }
        return { scope, name };
      }
      return { name: value };
    },
    stringify: (descriptor) => {
      return descriptor.scope === undefined
        ? descriptor.name
        : `@${descriptor.scope}/${descriptor.name}`;
    },
  };

export interface PackageDependencyDescriptor {
  key: string;
  name: PackageDescriptorName;
  selector: string; // can be npm tag or version or version range or git url or local folder path
}

interface PackageDependencyDescriptorUtils<
  Descriptor = PackageDependencyDescriptor,
> {
  make: (descriptor: Descriptor, selector: string) => Descriptor;
  parse: (dependencyKey: string, dependencyValue: string) => Descriptor;
  stringify: (descriptor: Descriptor) => [key: string, value: string];
}

export const PackageDependencyDescriptorUtils: PackageDependencyDescriptorUtils =
  {
    make: (descriptor, selector) => {
      return { key: descriptor.key, name: descriptor.name, selector };
    },
    parse: (dependencyKey, dependencyValue) => {
      const [name, selector] = dependencyValue.startsWith("npm:")
        ? (() => {
            const v = dependencyValue.slice("npm:".length);
            if (!v.startsWith("@")) v.split("@", 2);
            const [packageNameWithoutFirstChar, selector] = v
              .slice(1)
              .split("@", 2);
            if (!packageNameWithoutFirstChar || !selector) {
              throw new Error(`Invalid package descriptor: ${dependencyValue}`);
            }
            return [`@${packageNameWithoutFirstChar}`, selector];
          })()
        : [dependencyKey, dependencyValue];

      return {
        key: dependencyKey,
        name: PackageDescriptorNameUtils.parse(name),
        selector,
      };
    },
    stringify: (descriptor) => {
      return [descriptor.key, descriptor.selector];
    },
  };

// export const PackageDependencySelectorUtils;
