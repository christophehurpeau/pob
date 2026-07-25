import { Hello } from "../Hello";

const things = ["1", "2", "3"];

// eslint-disable-next-line react/no-array-index-key
things.map((thing, index) => <Hello key={index} name={thing} />);
