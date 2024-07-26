import { ASTNode, Expression, Statement } from "./ast";
import {
  Boolean,
  ExpressionStatement,
  IfExpression,
  InfixExpression,
  NumberLiteral,
  PrefixExpression,
} from "./expressions";
import { Program, Parser } from "./parser";
import {
  constants,
  ErrorType,
  NumberType,
  Type,
  Object as ObjectType,
} from "./objectTypes";
import { BlockStatement } from "./statements";

function Eval(node: ASTNode): ObjectType | null {
  if (node instanceof Program) return evalStatements(node.statements);
  else if (node instanceof ExpressionStatement)
    return Eval(node.Expression as Expression);
  else if (node instanceof NumberLiteral)
    return new NumberType(node.Value as number);
  else if (node instanceof Boolean) return nativeBooltoBoolType(node.Value);
  else if (node instanceof PrefixExpression) {
    let right = Eval(node.Right as Expression);
    return evalPrefixExpression(node.Operator, right as ObjectType);
  } else if (node instanceof InfixExpression) {
    const left = Eval(node.Left);
    const right = Eval(node.Right as Expression);

    return evalInfixExpression(
      node.Operator,
      left as ObjectType,
      right as ObjectType
    );
  } else if (node instanceof IfExpression) return evalIfExpression(node);
  else return new ErrorType("Error encountered!");
}

function evalStatements(s: Statement[]): ObjectType {
  let result: ObjectType | null = null;
  for (let statement of s) {
    result = Eval(statement);
    if (result instanceof ErrorType) {
      return result;
    }
  }
  return result as ObjectType;
}

function nativeBooltoBoolType(val: boolean): ObjectType {
  if (val) return constants.TRUE;
  else return constants.FALSE;
}

function evalPrefixExpression(op: string, right: ObjectType): ObjectType {
  switch (op) {
    case "!":
      return evalBangOpExpression(right);
    case "-":
      return evalMinusOpExpression(right);
    default:
      return constants.NULL;
  }
}

function evalBangOpExpression(right: ObjectType): ObjectType {
  switch (right) {
    case constants.TRUE:
      return constants.FALSE;
    case constants.FALSE:
      return constants.TRUE;
    case constants.NULL:
      return constants.TRUE;
    default:
      return constants.FALSE;
  }
}

function evalMinusOpExpression(right: ObjectType): ObjectType {
  if (right.Type() != Type.NUMBER_OBJ) {
    return constants.NULL;
  }
  const value = (right as NumberType).Value;
  return new NumberType(-value);
}

function evalInfixExpression(
  op: string,
  left: ObjectType,
  right: ObjectType
): ObjectType {
  switch (true) {
    case left.Type() == Type.NUMBER_OBJ && right.Type() == Type.NUMBER_OBJ:
      return evalNumberInfixExpression(op, left, right);
    case op == "==":
      return nativeBooltoBoolType(left == right);
    case op == "!=":
      return nativeBooltoBoolType(left != right);
    default:
      return constants.NULL;
  }
}

function evalNumberInfixExpression(
  op: string,
  left: ObjectType,
  right: ObjectType
) {
  const leftVal = (left as NumberType).Value;
  const rightVal = (right as NumberType).Value;
  switch (op) {
    case "+":
      return new NumberType(leftVal + rightVal);
    case "-":
      return new NumberType(leftVal - rightVal);
    case "*":
      return new NumberType(leftVal * rightVal);
    case "/":
      return new NumberType(leftVal / rightVal);
    case "<":
      return nativeBooltoBoolType(leftVal < rightVal);
    case ">":
      return nativeBooltoBoolType(leftVal > rightVal);
    case "==":
      return nativeBooltoBoolType(leftVal == rightVal);
    case "!=":
      return nativeBooltoBoolType(leftVal != rightVal);
    default:
      return constants.NULL;
  }
}

function evalBlockStatement(block: BlockStatement): ObjectType {
  let result: ObjectType | null = null;

  for (let statement of block.Statements) {
    result = Eval(statement);
    if (result instanceof ErrorType) {
      return result;
    }
  }

  return result as ObjectType;
}

function evalIfExpression(node: IfExpression): ObjectType {
  const condition = Eval(node.Condition as Expression);
  if (isTruthy(condition as ObjectType)) {
    return evalBlockStatement(node.doBlock as BlockStatement);
  } else if (node.elseBlock) {
    return evalBlockStatement(node.elseBlock as BlockStatement);
  } else {
    return constants.NULL;
  }
}

function isTruthy(obj: ObjectType): boolean {
  switch (obj) {
    case constants.NULL:
      return false;
    case constants.TRUE:
      return true;
    case constants.FALSE:
      return false;
    default:
      return true;
  }
}

const parser = new Parser(`5 + 1 - 5 * (9 - 2)`);

const program = parser.parseProgram();

const evaluated = Eval(program);

console.log(evaluated?.Inspect());
