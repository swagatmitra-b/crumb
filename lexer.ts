export enum TokenType {
  SAY = "SAY",
  INVAR = "INVAR",
  FUN = "FUNCTION",
  IF = "IF",
  ELSE = "ELSE",
  RETURN = "RETURN",
  TRUE = "TRUE",
  FALSE = "FALSE",
  IDENTIFIER = "IDENTIFIER",
  NUMBER = "NUMBER",
  ASSIGN = "ASSIGN",
  PLUS = "PLUS",
  MINUS = "MINUS",
  BANG = "BANG",
  SLASH = "SLASH",
  EQUAL = "EQUAL",
  NOTEQ = "NOTEQ",
  ASTERISK = "ASTERISK",
  LT = "<",
  GT = ">",
  L_PAREN = "L_PAREN",
  R_PAREN = "R_PAREN",
  L_BRACE = "L_BRACE",
  R_BRACE = "R_BRACE",
  COMMA = "COMMA",
  SCOLON = "SCOLON",
  ILLEGAL = "ILLEGAL",
  EOF = "EOF",
}

type Token = {
  literal: string;
  type: TokenType;
};

class Lexer {
  input: string;
  pos: number;
  readPos: number;
  char: string;

  constructor(input: string) {
    this.input = input;
    this.pos = 0;
    this.readPos = 0;
    this.char = "";
    this.readChar();
  }

  readChar() {
    if (this.readPos >= this.input.length) {
      this.char = "\0";
    } else {
      this.char = this.input[this.readPos];
    }
    this.pos = this.readPos;
    this.readPos++;
  }

  nextToken() {
    let token: Token;
    this.eatWhiteSpace();

    switch (this.char) {
      case "+":
        token = this.newToken(TokenType.PLUS, this.char);
        break;
      case "=":
        if (this.peekChar() == "=") {
          let char = this.char;
          this.readChar();
          token = this.newToken(TokenType.EQUAL, this.char + char);
        } else token = this.newToken(TokenType.ASSIGN, this.char);
        break;
      case ")":
        token = this.newToken(TokenType.R_PAREN, this.char);
        break;
      case "(":
        token = this.newToken(TokenType.L_PAREN, this.char);
        break;
      case "}":
        token = this.newToken(TokenType.R_BRACE, this.char);
        break;
      case "{":
        token = this.newToken(TokenType.L_BRACE, this.char);
        break;
      case ",":
        token = this.newToken(TokenType.COMMA, this.char);
        break;
      case ";":
        token = this.newToken(TokenType.SCOLON, this.char);
        break;
      case "<":
        token = this.newToken(TokenType.LT, "");
        break;
      case ">":
        token = this.newToken(TokenType.GT, "");
        break;
      case "-":
        token = this.newToken(TokenType.MINUS, "");
        break;
      case "*":
        token = this.newToken(TokenType.ASTERISK, "");
        break;
      case "/":
        token = this.newToken(TokenType.SLASH, "");
        break;
      case "!":
        if (this.peekChar() == "=") {
          let char = this.char;
          this.readChar();
          token = this.newToken(TokenType.NOTEQ, this.char + char);
        } else token = this.newToken(TokenType.ASSIGN, this.char);
        break;
      case "\0":
        token = this.newToken(TokenType.EOF, "");
        break;
      default:
        if (this.isLetter(this.char)) {
          let value = this.readIdentifier();
          let type = this.getType(value);
          return {
            type,
            literal: value,
          };
        } else if (this.isDigit(this.char)) {
          let value = this.readNumber();
          let type = TokenType.NUMBER;
          return {
            type,
            literal: value,
          };
        } else {
          token = this.newToken(TokenType.ILLEGAL, this.char);
        }
    }
    this.readChar();
    return token;
  }

  readIdentifier() {
    let position = this.pos;
    while (this.isLetter(this.char)) this.readChar();
    return this.input.slice(position, this.pos);
  }

  readNumber() {
    let position = this.pos;
    while (this.isDigit(this.char)) this.readChar();
    return this.input.slice(position, this.pos);
  }

  getType(val: string) {
    if (keywords[val]) return keywords[val];
    else return TokenType.IDENTIFIER;
  }

  isLetter(char: string) {
    return (
      (char >= "A" && char <= "Z") ||
      (char >= "a" && char <= "z") ||
      char == "_"
    );
  }

  isDigit(char: string) {
    return char >= "0" && char <= "9";
  }

  newToken(tokenType: TokenType, value: string) {
    return { type: tokenType, literal: value };
  }

  eatWhiteSpace() {
    while (
      this.char == " " ||
      this.char == "\n" ||
      this.char == "\t" ||
      this.char == "\r"
    ) {
      this.readChar();
    }
  }

  peekChar() {
    if (this.readPos >= this.input.length) {
      return "\0";
    } else {
      return this.input[this.readPos];
    }
  }
}

const keywords: Record<string, TokenType> = {
  say: TokenType.SAY,
  invar: TokenType.INVAR,
  true: TokenType.TRUE,
  false: TokenType.FALSE,
  if: TokenType.IF,
  else: TokenType.ELSE,
  return: TokenType.RETURN,
};

const lexeme = new Lexer("say love = 23 + a");

while (true) {
  let token = lexeme.nextToken();
  console.log(token);
  if (!token.literal) break;
}

// export enum TokenType {
//   SAY = "SAY",
//   INVAR = "INVAR",
//   FUN = "FUN",
//   IDENTIFIER = "IDENTIFIER",
//   NUMBER = "NUMBER",
//   ASSIGN = "ASSIGN",
//   PLUS = "PLUS",
//   L_PAREN = "L_PAREN",
//   R_PAREN = "R_PAREN",
//   L_BRACE = "L_CURL",
//   R_BRACE = "R_CURL",
//   COMMA = "COMMA",
//   SCOLON = "SCOLON",
//   ILLEGAL = "ILLEGAL",
//   EOF = "EOF",
// }

// const keywords: Record<string, TokenType> = {
//   say: TokenType.SAY,
//   invar: TokenType.INVAR,
// };

// export interface Token {
//   literal: string;
//   type: TokenType;
// }

// function getType(lexeme: string): TokenType {
//   switch (lexeme) {
//     case "=":
//       return TokenType.ASSIGN;
//     case "+":
//       return TokenType.PLUS;
//     case "(":
//       return TokenType.L_PAREN;
//     case ")":
//       return TokenType.R_PAREN;
//     case "{":
//       return TokenType.L_BRACE;
//     case "}":
//       return TokenType.R_BRACE;
//     case ",":
//       return TokenType.COMMA;
//     case ";":
//       return TokenType.SCOLON;
//     default:
//       if (/^[0-9]+$/.test(lexeme)) 
//         return TokenType.NUMBER;
//        else if (keywords[lexeme]) return keywords[lexeme];
//       else return TokenType.IDENTIFIER;
//   }
// }

// function whiteSpaces(lexeme: string): Boolean {
//   if (lexeme == "" || lexeme == "\n" || lexeme == "\t") {
//     return true;
//   }
//   return false;
// }

// export function tokenize(lexemeString: string): Token[] {
//   const tokens = lexemeString.split(" ");
//   const tokenArray: Token[] = [];

//   for (const lexeme of tokens) {
//     if (whiteSpaces(lexeme)) continue;
//     tokenArray.push({ literal: lexeme, type: getType(lexeme) });
//   }

//   tokenArray.push({ literal: "EndOfFile", type: TokenType.EOF });
//   return tokenArray;

// }

// export const TokenString = tokenize("invar fifty = 2 + a");

// console.log(TokenString);
