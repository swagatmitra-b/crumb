export enum TokenEnum {
  IDENTIFIER = "IDENTIFIER",
  SAY = "SAY",
  INVAR = "INVAR",
  NUMBER = "NUMBER",
  OPEN_PAREN = "OPEN_PAREN",
  EQUALS = "EQUALS",
  CLOSE_PAREN = "CLOSE_PAREN",
  VAR_NAME = "VAR_NAME",
}

const keywords: Record<string, TokenEnum> = {
  say: TokenEnum.SAY,
  invar: TokenEnum.INVAR,
};

export interface Token {
  value: string;
  type: TokenEnum;
}

function getType(lexeme: string): TokenEnum {
  switch (lexeme) {
    case "=":
      return TokenEnum.EQUALS;
    case "(":
      return TokenEnum.OPEN_PAREN;
    case ")":
      return TokenEnum.CLOSE_PAREN;
    default:
      if (/^[0-9]+$/.test(lexeme)) {
        return TokenEnum.NUMBER;
      } else if (keywords[lexeme]) {
        return keywords[lexeme];
      } else {
        return TokenEnum.IDENTIFIER;
      }
  }
}

function whiteSpaces(lexeme: string): Boolean {
  if (lexeme == "" || lexeme == "\n" || lexeme == "\t") {
    return true;
  }
  return false;
}

export function tokenize(lexemeString: string): Token[] {
  const tokens = lexemeString.split(" ");
  const tokenArray: Token[] = [];

  for (const lexeme of tokens) {
    if (whiteSpaces(lexeme)) continue;
    tokenArray.push({ value: lexeme, type: getType(lexeme) });
  }

  return tokenArray;
}

export const TokenString = tokenize("invar fifty = 50");



