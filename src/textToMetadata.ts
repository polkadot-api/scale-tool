/* eslint-disable @typescript-eslint/no-explicit-any */
import { V14Lookup, V15 } from "@polkadot-api/substrate-bindings";

const wordRegex = /^[a-zA-Z0-9]+/g;
const nextToken = (text: string) => {
  wordRegex.lastIndex = 0;
  const word = wordRegex.exec(text);
  if (!word) {
    return [text.slice(0, 1), text.slice(1)];
  }

  const token = word[0];
  console.log(word);
  return [token, text.slice(token.length)];
};

const primitiveTypes = [
  "u8",
  "u16",
  "u32",
  "u64",
  "u128",
  "u512",
  "i8",
  "i16",
  "i32",
  "i64",
  "i128",
  "i512",
  "bool",
];

const readStruct = (
  text: string,
  base: number
): [V14Lookup[number]["def"][], string] => {
  const result: V14Lookup[number]["def"][] = [];
  const fields: {
    name: string | undefined;
    type: number;
    typeName: string | undefined;
    docs: string[];
  }[] = [];
  result.push({
    tag: "composite",
    value: fields,
  });

  let res = nextToken(text);
  while (res[0] != "}") {
    const name = res[0];
    if (!res[1].startsWith(":")) {
      throw new Error("Expected struct field to have `:`");
    }
    const innerBase = base + result.length;
    const [inner, innerRest] = textToLookup(res[1].slice(1), innerBase);
    inner.forEach((v) => result.push(v));
    fields.push({
      docs: [],
      name,
      type: innerBase,
      typeName: undefined,
    });

    res = nextToken(innerRest);
    if (res[0] === ",") {
      res = nextToken(res[1]);
    }
  }

  return [result, res[1]];
};

const readTuple = (
  text: string,
  base: number
): [V14Lookup[number]["def"][], string] => {
  const result: V14Lookup[number]["def"][] = [];
  const fields: number[] = [];
  result.push({
    tag: "tuple",
    value: fields,
  });

  while (!text.startsWith("]")) {
    const innerBase = base + result.length;
    const [inner, innerRest] = textToLookup(text, innerBase);
    inner.forEach((v) => result.push(v));
    fields.push(innerBase);

    if (innerRest.startsWith(",")) {
      text = innerRest.slice(1);
    } else {
      text = innerRest;
    }
  }

  return [result, text.slice(1)];
};

const readEnum = (
  text: string,
  base: number
): [V14Lookup[number]["def"][], string] => {
  const result: V14Lookup[number]["def"][] = [];
  const variants: {
    name: string;
    fields: {
      name: string | undefined;
      type: number;
      typeName: string | undefined;
      docs: string[];
    }[];
    index: number;
    docs: string[];
  }[] = [];
  result.push({
    tag: "variant",
    value: variants,
  });

  let res = nextToken(text);
  while (res[0] != "}") {
    const name = res[0];
    if (!res[1].startsWith(":")) {
      throw new Error("Expected enum variant to have `:`");
    }
    const innerBase = base + result.length;
    const [inner, innerRest] = textToLookup(res[1].slice(1), innerBase);
    inner.forEach((v) => result.push(v));
    variants.push({
      docs: [],
      name,
      fields: [
        {
          docs: [],
          name: undefined,
          type: innerBase,
          typeName: undefined,
        },
      ],
      index: variants.length,
    });

    res = nextToken(innerRest);
    if (res[0] === ",") {
      res = nextToken(res[1]);
    }
  }

  return [result, res[1]];
};

const textToLookup = (
  text: string,
  base: number
): [V14Lookup[number]["def"][], string] => {
  const [token, rest] = nextToken(text);

  if (primitiveTypes.includes(token)) {
    return [
      [
        {
          tag: "primitive",
          value: {
            tag: token as any,
            value: undefined,
          },
        },
      ],
      rest,
    ];
  }

  switch (token) {
    case "compact":
      return [
        [
          {
            tag: "compact",
            value: base + 1,
          },
          {
            tag: "primitive",
            value: {
              tag: "u256",
              value: undefined,
            },
          },
        ],
        rest,
      ];
    case "{":
      return readStruct(rest, base);
    case "Vec": {
      if (!rest.startsWith("<")) {
        throw new Error(`Vector expects to begin with <`);
      }
      const [inner, innerRest] = textToLookup(rest.slice(1), base + 1);
      if (!inner.length) {
        throw new Error(`Vector expects an inner type`);
      }
      if (!innerRest.startsWith(">")) {
        throw new Error(`Vector expects to end with >`);
      }
      return [
        [
          {
            tag: "sequence",
            value: base + 1,
          },
          ...inner,
        ],
        innerRest.slice(1),
      ];
    }
    case "Arr": {
      if (!rest.startsWith("<")) {
        throw new Error(`Array expects to begin with <`);
      }
      const [inner, innerRest] = textToLookup(rest.slice(1), base + 1);
      if (!inner.length) {
        throw new Error(`Array expects an inner type`);
      }
      const match = /^,(\d+)>/.exec(innerRest);
      if (!match) {
        throw new Error(`Array expects to have a length parameter`);
      }
      const lengthStr = match[1];

      return [
        [
          {
            tag: "array",
            value: {
              len: Number(lengthStr),
              type: base + 1,
            },
          },
          ...inner,
        ],
        innerRest.slice(match[0].length),
      ];
    }
    case "[":
      return readTuple(rest, base);
    case "Enum":
      if (!rest.startsWith("{"))
        throw new Error("Expected Enum to being with {");
      return readEnum(rest.slice(1), base);
  }

  throw new Error(`Unexpected token ${token}`);
};

export const textToMetadata = (text: string): V15 => {
  const [lookupDefs, rest] = textToLookup(text.replace(/\s+/g, ""), 0);
  if (rest.length) {
    throw new Error(`Couldn't read all: ${rest.slice(10)}`);
  }
  const lookup: V14Lookup = lookupDefs.map((def, id) => ({
    def,
    docs: [],
    id,
    params: [],
    path: [],
  }));

  return {
    lookup,
    apis: [],
    custom: [],
    extrinsic: {
      address: 0,
      call: 0,
      extra: 0,
      signature: 0,
      signedExtensions: [],
      version: 0,
    },
    outerEnums: {
      call: 0,
      error: 0,
      event: 0,
    },
    pallets: [],
    type: 0,
  };
};
