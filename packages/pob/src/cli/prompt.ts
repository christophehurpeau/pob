import { createInterface } from "node:readline/promises";
import type { Ask, Question } from "./questions.ts";

export interface Prompter {
  ask: Ask;
  close: () => void;
}

const formatDefault = (question: Question, defaultValue: unknown): string => {
  if (defaultValue === undefined) return "";
  if (question.kind === "confirm") return defaultValue ? " (Y/n)" : " (y/N)";
  return ` (${typeof defaultValue === "string" ? defaultValue : JSON.stringify(defaultValue)})`;
};

const parseConfirm = (answer: string, defaultValue: unknown): unknown => {
  if (answer === "") return defaultValue ?? false;
  if (/^y(?:es)?$/i.test(answer)) return true;
  if (/^no?$/i.test(answer)) return false;
  return undefined;
};

const parseSelect = (
  answer: string,
  choices: readonly string[],
  defaultValue: unknown,
): unknown => {
  if (answer === "") return defaultValue;
  const index = Number(answer);
  if (Number.isInteger(index) && index >= 1 && index <= choices.length) {
    return choices[index - 1];
  }
  return choices.includes(answer) ? answer : undefined;
};

export const parseAnswer = (
  question: Question,
  answer: string,
  defaultValue: unknown,
): unknown => {
  switch (question.kind) {
    case "confirm":
      return parseConfirm(answer, defaultValue);
    case "select":
      return parseSelect(answer, question.choices ?? [], defaultValue);
    case "input":
      return answer === "" ? defaultValue : answer;
    default:
      throw new Error("Unknown question kind");
  }
};

/** Prompts on stdin/stdout, asking again until the answer is valid. */
export const createReadlinePrompter = (): Prompter => {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return {
    ask: async (question, defaultValue) => {
      const choices =
        question.kind === "select" && question.choices
          ? `\n${question.choices.map((choice, index) => `  ${index + 1}) ${choice}`).join("\n")}\n`
          : " ";
      for (;;) {
        const rawAnswer = await readline.question(
          `? ${question.message}${choices}${formatDefault(question, defaultValue)} `,
        );
        const answer = rawAnswer.trim();
        const value = parseAnswer(question, answer, defaultValue);
        if (value !== undefined && value !== "") return value;
        if (question.optional && answer === "") return undefined;
        console.log("  invalid answer");
      }
    },
    close: () => {
      readline.close();
    },
  };
};
