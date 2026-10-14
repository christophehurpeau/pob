// Same as react/jsx-sort-props of eslint-plugin-react with the options
// { noSortAlphabetically: true, reservedFirst: true, shorthandFirst: true,
// callbacksLast: true }: only the groups are ordered, not the names.

const RESERVED_PROPS = new Set([
  "children",
  "dangerouslySetInnerHTML",
  "key",
  "ref",
]);

const getPropName = (attribute) =>
  attribute.name.type === "JSXNamespacedName"
    ? `${attribute.name.namespace.name}:${attribute.name.name.name}`
    : attribute.name.name;

// dangerouslySetInnerHTML is only reserved on DOM elements
const isReservedProp = (name, isDomElement) =>
  RESERVED_PROPS.has(name) &&
  (name !== "dangerouslySetInnerHTML" || isDomElement);

const isCallbackProp = (name) => /^on[A-Z]/.test(name);

const isShorthandProp = (attribute) => attribute.value === null;

/**
 * Sort key: reserved props first, callbacks last, shorthand props first among
 * the others.
 */
const getRank = (attribute, isDomElement) => {
  const name = getPropName(attribute);
  if (isReservedProp(name, isDomElement)) {
    return isShorthandProp(attribute) ? 0 : 1;
  }
  if (isCallbackProp(name)) return isShorthandProp(attribute) ? 4 : 5;
  return isShorthandProp(attribute) ? 2 : 3;
};

/** Attributes split by spread attributes, which are not moved. */
const getAttributeGroups = (attributes) => {
  /** @type {any[][]} */
  const groups = [];
  let group = [];
  for (const attribute of attributes) {
    if (attribute.type === "JSXSpreadAttribute") {
      groups.push(group);
      group = [];
    } else {
      group.push(attribute);
    }
  }
  groups.push(group);
  return groups.filter((attributeGroup) => attributeGroup.length > 1);
};

export default {
  meta: {
    type: "layout",

    docs: {
      description:
        "Enforce the order of JSX props: reserved props first, then shorthand props, callbacks last",
      category: "Stylistic Issues",
      recommended: true,
    },

    fixable: "code",

    messages: {
      listReservedPropsFirst:
        "Reserved props must be listed before all other props",
      listShorthandFirst:
        "Shorthand props must be listed before all other props",
      listCallbacksLast: "Callbacks must be listed after all other props",
    },
  },

  create: (context) => ({
    JSXOpeningElement(node) {
      const isDomElement =
        node.name.type === "JSXIdentifier" && /^[a-z]/.test(node.name.name);

      for (const group of getAttributeGroups(node.attributes)) {
        const ranks = group.map((attribute) =>
          getRank(attribute, isDomElement),
        );
        const sorted = group
          .map((attribute, index) => ({ attribute, rank: ranks[index] }))
          .toSorted((a, b) => a.rank - b.rank)
          .map(({ attribute }) => attribute);

        const fix = (fixer) =>
          group.map((attribute, index) =>
            fixer.replaceText(
              attribute,
              context.sourceCode.getText(sorted[index]),
            ),
          );

        // report the first prop out of its group
        for (let index = 1; index < group.length; index++) {
          const previousRank = ranks[index - 1];
          const rank = ranks[index];
          if (rank >= previousRank) continue;

          const attribute = group[index];
          const name = getPropName(attribute);
          const previousName = getPropName(group[index - 1]);
          let messageId = "listShorthandFirst";
          let reportedAttribute = attribute;
          if (isReservedProp(name, isDomElement)) {
            messageId = "listReservedPropsFirst";
          } else if (isCallbackProp(previousName) && !isCallbackProp(name)) {
            // like eslint-plugin-react, report the callback
            messageId = "listCallbacksLast";
            reportedAttribute = group[index - 1];
          }
          context.report({ node: reportedAttribute, messageId, fix });
          break;
        }
      }
    },
  }),
};
