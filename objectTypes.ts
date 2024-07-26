export type ObjectType = string;

export enum Type {
  NUMBER_OBJ = "NUMBER",
  BOOLEAN_OBJ = "BOOLEAN",
  NULL_OBJ = "NULL",
  ERROR = "ERROR",
}

export interface Object {
  Type(): ObjectType;
  Inspect(): string;
}

export class NumberType implements Object {
  Value: number;

  constructor(val: number) {
    this.Value = val;
  }

  Type(): ObjectType {
    return Type.NUMBER_OBJ;
  }

  Inspect(): string {
    return `${this.Value}`;
  }
}

export class BooleanType implements Object {
  Value: boolean | null;

  constructor(val: boolean) {
    this.Value = val;
  }

  Type(): ObjectType {
    return Type.BOOLEAN_OBJ;
  }

  Inspect(): string {
    return `${this.Value}`;
  }
}

export class NullType implements Object {
  Type(): ObjectType {
    return Type.NULL_OBJ;
  }

  Inspect(): string {
    return "null";
  }
}

export class ErrorType implements Object {
  message: string;

  constructor(msg: string) {
    this.message = msg;
  }

  Type(): ObjectType {
    return Type.ERROR;
  }

  Inspect(): string {
    return "";
  }
}

export const constants = {
  TRUE: new BooleanType(true),
  FALSE: new BooleanType(false),
  NULL: new NullType(),
};
