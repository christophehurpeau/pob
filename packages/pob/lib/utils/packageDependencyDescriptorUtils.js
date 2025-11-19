// TODO use pm-utils when available

export const PackageDescriptorNameUtils = {
  parse: (value) => {
    if (value.startsWith("@")) {
      const [scope, name] = value.slice(1).split("/", 2);
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

export const PackageDependencyDescriptorUtils = {
  make: (descriptor, selector) => {
    return {
      key: descriptor.key,
      npmName: descriptor.npmName,
      nameDescriptor: descriptor.nameDescriptor,
      selector,
    };
  },
  parse: (dependencyKey, dependencyValue) => {
    const parseFromNpm = (v) => {
      if (!v.startsWith("@")) return v.split("@", 2);
      const [packageNameWithoutFirstChar, selector] = v.slice(1).split("@", 2);
      return [`@${packageNameWithoutFirstChar}`, selector];
    };
    const [name, selector] = dependencyValue.startsWith("npm:")
      ? parseFromNpm(dependencyValue.slice("npm:".length))
      : [dependencyKey, dependencyValue];

    return {
      key: dependencyKey,
      npmName: name,
      nameDescriptor: PackageDescriptorNameUtils.parse(name),
      selector,
    };
  },
  stringify: (descriptor) => {
    return [
      descriptor.key,
      descriptor.npmName !== descriptor.key
        ? `npm:${descriptor.npmName}@${descriptor.selector}`
        : descriptor.selector,
    ];
  },
};
