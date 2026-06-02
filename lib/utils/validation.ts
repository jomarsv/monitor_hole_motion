export type ValidationResult =
  | {
      ok: true;
      value: string;
    }
  | {
      ok: false;
      message: string;
    };

export const QUESTION_MIN_LENGTH = 8;
export const QUESTION_MAX_LENGTH = 1200;

export function validateQuestion(question: unknown): ValidationResult {
  if (typeof question !== "string") {
    return { ok: false, message: "A pergunta deve ser enviada como texto." };
  }

  const value = question.trim();

  if (value.length < QUESTION_MIN_LENGTH) {
    return {
      ok: false,
      message: `Escreva uma pergunta com pelo menos ${QUESTION_MIN_LENGTH} caracteres.`
    };
  }

  if (value.length > QUESTION_MAX_LENGTH) {
    return {
      ok: false,
      message: `A pergunta deve ter no maximo ${QUESTION_MAX_LENGTH} caracteres.`
    };
  }

  return { ok: true, value };
}
