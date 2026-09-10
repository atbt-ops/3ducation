// A tiny, safe math-expression evaluator — shunting-yard to RPN, then evaluate.
// No `eval` / `new Function`. Supports + - * / % ^, unary minus, parentheses,
// named constants (pi, e, tau) and a fixed set of single/two-arg functions.

const FUNCS = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  exp: Math.exp,
  log: Math.log,
  ln: Math.log,
  log10: Math.log10,
  log2: Math.log2,
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  abs: Math.abs,
  sign: Math.sign,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  min: Math.min,
  max: Math.max,
  atan2: Math.atan2,
  pow: Math.pow,
  hypot: Math.hypot,
};
const FUNC_ARITY = { min: 2, max: 2, atan2: 2, pow: 2, hypot: 2 };
const CONSTS = { pi: Math.PI, e: Math.E, tau: Math.PI * 2 };

const OPS = {
  "+": { prec: 2, assoc: "L", fn: (a, b) => a + b },
  "-": { prec: 2, assoc: "L", fn: (a, b) => a - b },
  "*": { prec: 3, assoc: "L", fn: (a, b) => a * b },
  "/": { prec: 3, assoc: "L", fn: (a, b) => a / b },
  "%": { prec: 3, assoc: "L", fn: (a, b) => a % b },
  "^": { prec: 5, assoc: "R", fn: (a, b) => Math.pow(a, b) },
  neg: { prec: 4, assoc: "R", unary: true, fn: (a) => -a },
};

function tokenize(src) {
  const tokens = [];
  const re = /\s*([A-Za-z_]\w*|\d*\.?\d+(?:[eE][+-]?\d+)?|[+\-*/%^(),])\s*/y;
  let i = 0;
  while (i < src.length) {
    re.lastIndex = i;
    const m = re.exec(src);
    if (!m) throw new Error(`Unexpected character: "${src[i]}"`);
    tokens.push(m[1]);
    i = re.lastIndex;
  }
  return tokens;
}

/**
 * Compile an expression string into `(scope) => number`.
 * `allowedVars` is the set of variable names the formula may reference.
 */
export function compile(src, allowedVars = ["x", "y", "t"]) {
  const tokens = tokenize(String(src).toLowerCase());
  const output = [];
  const stack = [];
  let prev = null;

  const valueBefore = (tk) =>
    tk != null &&
    (/^[\d.]/.test(tk) || tk === ")" || allowedVars.includes(tk) || tk in CONSTS);

  const popWhile = (test) => {
    while (stack.length && stack[stack.length - 1] !== "(" && test(stack[stack.length - 1])) {
      output.push(stack.pop());
    }
  };

  for (const tk of tokens) {
    if (/^[\d.]/.test(tk)) {
      output.push({ t: "num", v: parseFloat(tk) });
    } else if (tk in CONSTS) {
      output.push({ t: "num", v: CONSTS[tk] });
    } else if (tk in FUNCS) {
      stack.push({ t: "fn", v: tk });
    } else if (allowedVars.includes(tk)) {
      output.push({ t: "var", v: tk });
    } else if (tk === ",") {
      popWhile(() => true);
      if (!stack.length) throw new Error("Misplaced comma");
    } else if (tk in OPS && tk !== "neg") {
      if ((tk === "-" || tk === "+") && !valueBefore(prev)) {
        if (tk === "-") stack.push({ t: "op", v: "neg" });
      } else {
        const o1 = OPS[tk];
        popWhile((top) => {
          if (top.t === "fn") return true;
          if (top.t !== "op") return false;
          const o2 = OPS[top.v];
          return o2.prec > o1.prec || (o2.prec === o1.prec && o1.assoc === "L");
        });
        stack.push({ t: "op", v: tk });
      }
    } else if (tk === "(") {
      stack.push("(");
    } else if (tk === ")") {
      popWhile(() => true);
      if (stack[stack.length - 1] !== "(") throw new Error("Unbalanced parentheses");
      stack.pop();
      if (stack.length && stack[stack.length - 1].t === "fn") output.push(stack.pop());
    } else {
      throw new Error(`Unknown name: "${tk}"`);
    }
    prev = tk;
  }
  while (stack.length) {
    const top = stack.pop();
    if (top === "(") throw new Error("Unbalanced parentheses");
    output.push(top);
  }

  // Validate the RPN is well-formed (correct operand counts).
  let depth = 0;
  for (const node of output) {
    if (node.t === "num" || node.t === "var") depth += 1;
    else if (node.t === "op") depth += OPS[node.v].unary ? 0 : -1;
    else if (node.t === "fn") depth -= (FUNC_ARITY[node.v] || 1) - 1;
    if (depth < 1) throw new Error("Incomplete expression");
  }
  if (depth !== 1) throw new Error("Incomplete expression");

  return (scope = {}) => {
    const st = [];
    for (const node of output) {
      if (node.t === "num") {
        st.push(node.v);
      } else if (node.t === "var") {
        st.push(scope[node.v] ?? 0);
      } else if (node.t === "op") {
        const op = OPS[node.v];
        if (op.unary) st.push(op.fn(st.pop()));
        else {
          const b = st.pop();
          st.push(op.fn(st.pop(), b));
        }
      } else if (node.t === "fn") {
        const arity = FUNC_ARITY[node.v] || 1;
        const args = [];
        for (let j = 0; j < arity; j++) args.unshift(st.pop());
        st.push(FUNCS[node.v](...args));
      }
    }
    return st.pop();
  };
}

/** True if the expression parses and evaluates to a finite number for sample inputs. */
export function isValidExpr(src, allowedVars = ["x", "y", "t"]) {
  try {
    const f = compile(src, allowedVars);
    const scope = {};
    allowedVars.forEach((v) => (scope[v] = 0.37));
    return Number.isFinite(f(scope));
  } catch {
    return false;
  }
}
