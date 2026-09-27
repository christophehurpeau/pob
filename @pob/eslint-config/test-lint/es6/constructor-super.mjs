// eslint-disable-next-line no-undef
export class A extends B {
  // oxlint-disable-next-line no-empty-function, constructor-super
  constructor() {} // Would throw a ReferenceError.
}
