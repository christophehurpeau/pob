import "./foo.ts";
import "./folder-with-index/index.ts";

const initWith = function (): void {
  console.log("init");
};

initWith();

// oxlint-disable-next-line import/first
import "./export.ts";
