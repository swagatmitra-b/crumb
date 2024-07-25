import { Token, TokenType } from "./lexer";
import { Statement, Expression } from "./ast";
import { BlockStatement } from "./statements";

export enum OP_PREC {
  _,
  LOWEST,
  EQUALS,
  LESSGREATER,
  SUM,
  PRODUCT,
  PREFIX,
  CALL,
}

export const precedenceTable: Partial<Record<TokenType, OP_PREC>> = {
  [TokenType.EQUAL]: OP_PREC.EQUALS,
  [TokenType.NOTEQ]: OP_PREC.EQUALS,
  [TokenType.LT]: OP_PREC.LESSGREATER,
  [TokenType.GT]: OP_PREC.LESSGREATER,
  [TokenType.PLUS]: OP_PREC.SUM,
  [TokenType.MINUS]: OP_PREC.SUM,
  [TokenType.SLASH]: OP_PREC.PRODUCT,
  [TokenType.ASTERISK]: OP_PREC.PRODUCT,
};

export class Identifier implements Expression {
  Token: Token;
  Value: string;

  constructor(token: Token, value: string) {
    this.Token = token;
    this.Value = value;
  }

  tokenLiteral(): string {
    return this.Token.literal;
  }
  expressionNode(): void {}
}

export class ExpressionStatement implements Statement {
  Token: Token;
  Expression: Expression | null;

  constructor(token: Token) {
    this.Token = token;
    this.Expression = null;
  }

  statementNode(): void {}
  tokenLiteral(): string {
    return this.Token.literal;
  }
}

export class IntegerLiteral implements Expression {
  Token: Token;
  Value: number | null;

  constructor(token: Token) {
    this.Token = token;
    this.Value = null;
  }

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.Token.literal;
  }
}

export class PrefixExpression implements Expression {
  Token: Token;
  Operator: string;
  Right: Expression | null;

  constructor(token: Token, op: string) {
    this.Token = token;
    this.Operator = op;
    this.Right = null;
  }

  expressionNode(): void {}
  tokenLiteral(): string {
    return this.Token.literal;
  }
}

export class InfixExpression implements Expression {
  Token: Token;
  Left: Expression;
  Operator: string;
  Right: Expression | null;

  constructor(token: Token, op: string, left: Expression) {
    this.Token = token;
    this.Operator = op;
    this.Left = left;
    this.Right = null;
  }

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.Token.literal;
  }
}

export class Boolean implements Expression {
  Token: Token;
  Value: boolean;

  constructor(token: Token, val: boolean) {
    this.Token = token;
    this.Value = val;
  }

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.Token.literal;
  }
}

export class IfStatement implements Expression {
  Token: Token;
  Condition: Expression | null;
  doBlock: BlockStatement | null;
  elseBlock: BlockStatement | null;

  constructor(token: Token) {
    this.Token = token;
    this.Condition = null;
    this.doBlock = null;
    this.elseBlock = null;
  }

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.Token.literal;
  }
}
