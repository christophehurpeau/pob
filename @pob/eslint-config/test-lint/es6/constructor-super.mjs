// eslint-disable-next-line no-undef
export class A extends B {
  /* eslint-disable-next-line constructor-super */ // oxlint-disable-next-line no-empty-function
  constructor() {} // Would throw a ReferenceError.
}
