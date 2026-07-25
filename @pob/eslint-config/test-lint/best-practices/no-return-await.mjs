// eslint-disable-next-line require-await
const bar = async () => {
  return "bar";
};

export async function foo() {
  // eslint-disable-next-line no-return-await
  return await bar();
}
