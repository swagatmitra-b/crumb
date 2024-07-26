import { Token, Lexer, TokenType } from "./lexer";
import { ASTNode, Statement, Expression } from "./ast";
import { SayStatement, ReturnStatement, BlockStatement } from "./statements";
import {
  ErrorExpression,
  Identifier,
  ExpressionStatement,
  NumberLiteral,
  PrefixExpression,
  InfixExpression,
  OP_PREC,
  precedenceTable,
  Boolean,
  IfExpression,
  FunctionExpression,
  CallExpression,
} from "./expressions";

export class Program implements ASTNode {
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

export class Parser {
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
    this.registerPrefix(TokenType.TRUE, this.parseBooleanExpression.bind(this));
    this.registerPrefix(
      TokenType.FALSE,
      this.parseBooleanExpression.bind(this)
    );
    this.registerPrefix(
      TokenType.L_PAREN,
      this.parseGroupedExpression.bind(this)
    );
    this.registerPrefix(TokenType.IF, this.parseIfExpression.bind(this));
    this.registerPrefix(TokenType.FUN, this.parseFunctionExpression.bind(this));
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
    this.registerInfix(TokenType.L_PAREN, this.parseCallExpression.bind(this));
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
      if (statement) program.statements.push(statement as Statement);
      this.nextToken();
    }

    return program;
  }

  parseStatement(): Statement | ErrorExpression {
    switch (this.currToken.type) {
      case TokenType.SAY:
        return this.parseSayStatement();
      case TokenType.RETURN:
        return this.parseReturnStatement();
      default:
        return this.parseExpressionStatement();
    }
  }

  parseSayStatement(): SayStatement | ErrorExpression {
    let statement = new SayStatement(this.currToken);

    if (!this.expectPeek(TokenType.IDENTIFIER)) {
      this.errors.push(
        `Expected identifier after 'let', got ${this.peekToken} instead`
      );
      return new ErrorExpression(
        this.currToken,
        `Expected identifier after 'let', got ${this.peekToken} instead`
      );
    }

    statement.Name = new Identifier(this.currToken, this.currToken.literal);

    if (!this.expectPeek(TokenType.ASSIGN)) {
      this.errors.push(
        `Expected '=' after identifier, got ${this.peekToken} instead`
      );
      return new ErrorExpression(
        this.currToken,
        `Expected '=' after , got ${this.peekToken} instead`
      );
    }

    this.nextToken();

    statement.Value = this.parseExpression(OP_PREC.LOWEST);

    if (this.peekTokenIs(TokenType.SCOLON)) this.nextToken();

    return statement;
  }

  parseReturnStatement() {
    let statement = new ReturnStatement(this.currToken);

    this.nextToken();

    statement.ReturnValue = this.parseExpression(OP_PREC.LOWEST);

    if (this.peekTokenIs(TokenType.SCOLON)) this.nextToken();

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
    let literal = new NumberLiteral(this.currToken);

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
    if (precedenceValue) return precedenceValue;
    return OP_PREC.LOWEST;
  }

  peekPrecedence(): number {
    let precedenceValue = precedenceTable[this.peekToken.type as TokenType];
    if (precedenceValue) return precedenceValue;
    return OP_PREC.LOWEST;
  }

  parseBooleanExpression() {
    return new Boolean(this.currToken, this.currTokenIs(TokenType.TRUE));
  }

  parseGroupedExpression(): Expression {
    this.nextToken();
    let expression = this.parseExpression(OP_PREC.LOWEST) as Expression;

    if (!this.expectPeek(TokenType.R_PAREN)) {
      this.errors.push(`Missing closing parentheses in expression`);
      return new ErrorExpression(
        this.currToken,
        `Missing closing parentheses in expression`
      );
    }

    return expression;
  }

  parseIfExpression() {
    let expression = new IfExpression(this.currToken);

    if (!this.expectPeek(TokenType.L_PAREN)) {
      this.errors.push(`Expected '(' after 'if'`);
      return new ErrorExpression(this.currToken, `Expected '(' after 'if'`);
    }

    this.nextToken();

    expression.Condition = this.parseExpression(OP_PREC.LOWEST);

    if (!this.expectPeek(TokenType.R_PAREN)) {
      this.errors.push(`Expected ')' after condition`);
      return new ErrorExpression(
        this.currToken,
        `Expected ')' after condition`
      );
    }

    if (!this.expectPeek(TokenType.L_BRACE)) {
      this.errors.push(`Expected '{' after ')'`);
      return new ErrorExpression(this.currToken, `Expected '{' after ')'`);
    }

    expression.doBlock = this.parseBlockStatement();

    if (this.peekTokenIs(TokenType.ELSE)) {
      this.nextToken();

      if (!this.expectPeek(TokenType.L_BRACE)) {
        this.errors.push(`Expected '{' after ')'`);
        return new ErrorExpression(this.currToken, `Expected '{' after ')'`);
      }

      expression.elseBlock = this.parseBlockStatement();
    }

    return expression;
  }

  parseBlockStatement(): BlockStatement {
    let block = new BlockStatement(this.currToken);

    this.nextToken();

    while (
      !this.currTokenIs(TokenType.R_BRACE) &&
      !this.currTokenIs(TokenType.EOF)
    ) {
      let statement = this.parseStatement();
      if (statement) block.Statements.push(statement as Statement);
      this.nextToken();
    }

    return block;
  }

  parseFunctionExpression() {
    let expression = new FunctionExpression(this.currToken);

    if (!this.expectPeek(TokenType.L_PAREN)) {
      this.errors.push(`Expected '(' after 'fun'`);
      return new ErrorExpression(this.currToken, `Expected '(' after 'fun'`);
    }

    expression.Parameters = this.parseFunctionParams();

    if (!this.expectPeek(TokenType.L_BRACE)) {
      this.errors.push(`Expected '{' after function declaration`);
      return new ErrorExpression(
        this.currToken,
        `Expected '{' after function declaration`
      );
    }

    expression.Body = this.parseBlockStatement();

    return expression;
  }

  parseFunctionParams(): Identifier[] | ErrorExpression {
    let identifiers = new Array<Identifier>();

    if (this.peekTokenIs(TokenType.R_PAREN)) {
      this.nextToken();
      return identifiers;
    }

    this.nextToken();

    while (this.peekTokenIs(TokenType.COMMA)) {
      let ident = new Identifier(this.currToken, this.currToken.literal);
      identifiers.push(ident);

      this.nextToken();
      this.nextToken();
    }

    if (!this.expectPeek(TokenType.R_PAREN)) {
      this.errors.push(
        `Expected closing parentheses ')' in function signature`
      );
      return new ErrorExpression(
        this.currToken,
        `Expected closing parentheses ')' in function signature`
      );
    }

    return identifiers;
  }

  parseCallExpression(fn: Expression) {
    let expression = new CallExpression(this.currToken, fn);

    expression.Arguments = this.parseCallArguments();

    return expression;
  }

  parseCallArguments() {
    let args = new Array<Expression>();

    if (this.peekTokenIs(TokenType.R_PAREN)) {
      this.nextToken();
      return args;
    }

    this.nextToken();
    args.push(this.parseExpression(OP_PREC.LOWEST) as Expression);

    while (this.peekTokenIs(TokenType.COMMA)) {
      this.nextToken();
      this.nextToken();
      args.push(this.parseExpression(OP_PREC.LOWEST) as Expression);
    }

    if (!this.expectPeek(TokenType.R_PAREN)) {
      this.errors.push("Expected closing parentheses ')' after function call");
      return new ErrorExpression(
        this.currToken,
        "Expected closing parentheses ')' after function call"
      );
    }

    return args;
  }
}

// const parser = new Parser(``);

// const program = parser.parseProgram();

// console.log(JSON.stringify(program.statements, null, 2));
