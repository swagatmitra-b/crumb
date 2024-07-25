import { Token } from "./lexer";
import { Statement, Expression } from "./ast";
import { Identifier } from "./expressions";

export class SayStatement implements Statement {
  Token: Token;
  Name?: Identifier;
  Value?: Expression;

  constructor(token: Token) {
    this.Token = token;
  }

  tokenLiteral(): string {
    return this.Token.literal;
  }

  statementNode(): void {}
}

export class ReturnStatement implements Statement {
  Token: Token;
  ReturnValue?: Expression;

  constructor(token: Token) {
    this.Token = token;
  }

  tokenLiteral(): string {
    return this.Token.literal;
  }

  statementNode(): void {}
}

export class BlockStatement implements Statement {
  Token: Token;
  Statements: Statement[];

  constructor(token: Token) {
    this.Token = token;
    this.Statements = [];
  }

  statementNode(): void {}

  tokenLiteral(): string {
    return this.Token.literal;
  }
}
