import { Token, Lexer, TokenType } from "./lexer";
import { ASTNode, Statement, Expression } from "./ast";
import { SayStatement, ReturnStatement } from "./statements";
import {
  Identifier,
  ExpressionStatement,
  IntegerLiteral,
  PrefixExpression,
  InfixExpression,
  OP_PREC,
  precedenceTable,
} from "./expressions";

class Program implements ASTNode {
  statements: Statement[];

  constructor() {
    this.statements = [];
  }

  tokenLiteral(): string {
    if (this.statements.length > 0) {
      return this.statements[0].tokenLiteral();
    } else return "";
  }
}

interface parsingFunctions {
  prefixParse(): Expression;
  infixParse(a: Expression): Expression;
}

class ErrorExpression implements Expression {
  token: Token;
  message: string;

  constructor(token: Token, message: string) {
    this.token = token;
    this.message = message;
  }

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }
}

class Parser {
  lexer: Lexer;
  currToken: Token;
  peekToken: Token;
  errors: string[];

  prefixParseFuncs: { [K in TokenType]?: parsingFunctions["prefixParse"] };
  infixParseFuncs: { [K in TokenType]?: parsingFunctions["infixParse"] };

  constructor(input: string) {
    this.lexer = new Lexer(input);
    this.currToken = { type: TokenType.ILLEGAL, literal: "" };
    this.peekToken = { type: TokenType.ILLEGAL, literal: "" };
    this.errors = [];
    this.prefixParseFuncs = {};
    this.infixParseFuncs = {};
    this.registerPrefix(TokenType.IDENTIFIER, this.parseIdentifier.bind(this));
    this.registerPrefix(TokenType.NUMBER, this.parseNumberLiteral.bind(this));
    this.registerPrefix(TokenType.BANG, this.parsePrefixExpression.bind(this));
    this.registerPrefix(TokenType.MINUS, this.parsePrefixExpression.bind(this));
    this.registerInfix(TokenType.EQUAL, this.parseInfixExpression.bind(this));
    this.registerInfix(TokenType.NOTEQ, this.parseInfixExpression.bind(this));
    this.registerInfix(TokenType.PLUS, this.parseInfixExpression.bind(this));
    this.registerInfix(TokenType.MINUS, this.parseInfixExpression.bind(this));
    this.registerInfix(
      TokenType.ASTERISK,
      this.parseInfixExpression.bind(this)
    );
    this.registerInfix(TokenType.SLASH, this.parseInfixExpression.bind(this));
    this.registerInfix(TokenType.GT, this.parseInfixExpression.bind(this));
    this.registerInfix(TokenType.LT, this.parseInfixExpression.bind(this));
    this.nextToken();
    this.nextToken();
  }

  nextToken() {
    this.currToken = this.peekToken;
    this.peekToken = this.lexer.nextToken();
  }

  parseProgram() {
    const program = new Program();

    while (!this.currTokenIs(TokenType.EOF)) {
      let statement = this.parseStatement();
      if (statement) program.statements.push(statement);
      this.nextToken();
    }

    return program;
  }

  parseStatement(): Statement | null {
    switch (this.currToken.type) {
      case TokenType.SAY:
        return this.parseSayStatement();
      case TokenType.RETURN:
        return this.parseReturnStatement();
      default:
        return this.parseExpressionStatement();
    }
  }

  parseSayStatement(): SayStatement | null {
    let statement = new SayStatement(this.currToken);

    if (!this.expectPeek(TokenType.IDENTIFIER)) return null;

    statement.Name = new Identifier(this.currToken, this.currToken.literal);

    if (!this.expectPeek(TokenType.ASSIGN)) return null;

    while (this.currTokenIs(TokenType.SCOLON)) this.nextToken();

    return statement;
  }

  parseReturnStatement() {
    let statement = new ReturnStatement(this.currToken);

    this.nextToken();

    while (this.currTokenIs(TokenType.SCOLON)) this.nextToken();

    return statement;
  }

  currTokenIs(t: TokenType) {
    return this.currToken.type == t;
  }

  peekTokenIs(t: TokenType) {
    return this.peekToken.type == t;
  }

  expectPeek(t: TokenType) {
    if (this.peekTokenIs(t)) {
      this.nextToken();
      return true;
    } else return false;
  }

  registerPrefix(t: TokenType, fn: parsingFunctions["prefixParse"]) {
    this.prefixParseFuncs[t] = fn;
  }

  registerInfix(t: TokenType, fn: parsingFunctions["infixParse"]) {
    this.infixParseFuncs[t] = fn;
  }

  parseExpressionStatement(): ExpressionStatement {
    let statement = new ExpressionStatement(this.currToken);

    statement.Expression = this.parseExpression(OP_PREC.LOWEST);

    if (this.peekTokenIs(TokenType.SCOLON)) {
      this.nextToken();
    }

    return statement;
  }

  parseExpression(precedence: number): Expression | null {
    let prefix = this.prefixParseFuncs[this.currToken.type];

    if (!prefix) {
      this.errors.push(`No prefix parse function for ${this.currToken.type}`);
      return new ErrorExpression(
        this.currToken,
        `No prefix parse function for ${this.currToken.type}`
      );
    }

    let leftExp = prefix();

    while (
      !this.peekTokenIs(TokenType.SCOLON) &&
      precedence < this.peekPrecedence()
    ) {
      let infix = this.infixParseFuncs[this.peekToken.type];

      if (!infix) {
        return leftExp;
      }

      this.nextToken();

      leftExp = infix(leftExp);
    }

    return leftExp;
  }

  parseIdentifier(): Expression {
    return new Identifier(this.currToken, this.currToken.literal);
  }

  parseNumberLiteral(): Expression {
    let literal = new IntegerLiteral(this.currToken);

    const numLiteral = parseInt(this.currToken.literal);

    if (isNaN(numLiteral)) {
      this.errors.push(`Could not parse ${this.currToken.literal} as integer`);
      return new ErrorExpression(
        this.currToken,
        `Could not parse ${this.currToken.literal} as integer`
      );
    }

    literal.Value = numLiteral;

    return literal;
  }

  parsePrefixExpression(): PrefixExpression {
    let expression = new PrefixExpression(
      this.currToken,
      this.currToken.literal
    );

    this.nextToken();

    expression.Right = this.parseExpression(OP_PREC.PREFIX);

    return expression;
  }

  parseInfixExpression(left: Expression): Expression {
    let expression = new InfixExpression(
      this.currToken,
      this.currToken.literal,
      left
    );

    let precedence = this.currPrecedence();
    this.nextToken();
    expression.Right = this.parseExpression(precedence);

    return expression;
  }

  peekError(t: TokenType) {
    let message = `Expected next token to be ${t}, got ${this.peekToken.type} instead.`;
    this.errors.push(message);
  }

  currPrecedence(): number {
    let precedenceValue = precedenceTable[this.currToken.type as TokenType];
    if (precedenceValue !== undefined) return precedenceValue;
    return OP_PREC.LOWEST;
  }

  peekPrecedence(): number {
    let precedenceValue = precedenceTable[this.peekToken.type as TokenType];
    if (precedenceValue !== undefined) return precedenceValue;
    return OP_PREC.LOWEST;
  }
}

const parser = new Parser("5 > 4 == 3 < 4");
const program = parser.parseProgram();

console.log(JSON.stringify(program.statements, null, 2));
