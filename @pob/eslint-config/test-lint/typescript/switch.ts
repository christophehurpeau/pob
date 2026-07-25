type Day =
  | "Friday"
  | "Monday"
  | "Saturday"
  | "Sunday"
  | "Thursday"
  | "Tuesday"
  | "Wednesday";

declare const day: Day;
let result = 0;

// eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
switch (day) {
  case "Monday":
    result = 1;
    break;
  // no default
}

export const getResult = (): number => result;

enum Fruit {
  Apple = "apple",
  Banana = "banana",
  Cherry = "cherry",
}

declare const fruit: Fruit;

switch (fruit) {
  case Fruit.Apple:
    console.log("an apple");
    break;

  case Fruit.Banana:
  case Fruit.Cherry:
  default:
    console.log("a fruit");
    break;
}
