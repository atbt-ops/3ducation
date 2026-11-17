import { parse } from "acorn";
const NODES = new Set([
  "Program",
  "VariableDeclaration",
  "VariableDeclarator",
  "Identifier",
  "Literal",
  "ExpressionStatement",
  "NewExpression",
  "MemberExpression",
  "CallExpression",
  "ObjectExpression",
  "Property",
  "ArrayExpression",
  "AssignmentExpression",
  "BinaryExpression",
  "UnaryExpression",
  "FunctionDeclaration",
  "BlockStatement",
  "IfStatement",
  "ConditionalExpression",
  "ReturnStatement",
]);
const TYPES = new Set([
  "BoxGeometry",
  "SphereGeometry",
  "CylinderGeometry",
  "ConeGeometry",
  "TorusGeometry",
  "PlaneGeometry",
  "MeshStandardMaterial",
  "MeshBasicMaterial",
  "Mesh",
  "Group",
  "Vector3",
]);
const FORBIDDEN = new Set([
  "__proto__",
  "prototype",
  "constructor",
  "window",
  "document",
  "globalThis",
  "self",
  "parent",
  "top",
  "fetch",
  "eval",
  "Function",
  "localStorage",
  "indexedDB",
  "navigator",
  "location",
  "importScripts",
]);
export const TEMPLATE = `// THREE and scene are supplied by Spark.
// Supported: mesh geometry, materials, groups, transforms and Math.
const geometry = new THREE.TorusGeometry(1.2, 0.3, 12, 48);
const material = new THREE.MeshStandardMaterial({ color: 0x0f8b80, roughness: 0.3 });
const ring = new THREE.Mesh(geometry, material);
scene.add(ring);

function update(dt, time) {
  ring.rotation.x += dt * 0.4;
  ring.rotation.y += dt * 0.7;
  ring.position.y = Math.sin(time) * 0.3;
}
`;
export function validateCode(code) {
  if (typeof code !== "string" || code.length > 20000 || !code.trim())
    throw new Error("Enter between 1 and 20,000 characters.");
  const ast = parse(code, { ecmaVersion: 2020 });
  let count = 0,
    updates = 0;
  function walk(node, depth = 0) {
    if (!node || typeof node !== "object") return;
    if (depth > 50 || ++count > 2500) throw new Error("Simulation is too complex.");
    if (node.type) {
      if (!NODES.has(node.type))
        throw new Error(`${node.type} is unavailable. Use the starter’s restricted Three.js API.`);
      if (node.type === "Identifier" && FORBIDDEN.has(node.name))
        throw new Error(`The name ${node.name} is unavailable.`);
      if (node.type === "MemberExpression" && node.computed)
        throw new Error("Use named properties, not computed property access.");
      if (node.type === "Literal" && (node.regex || typeof node.value === "bigint"))
        throw new Error("Only simple numbers, strings and booleans are supported.");
      if (node.type === "FunctionDeclaration") {
        if (
          node.id?.name !== "update" ||
          depth !== 1 ||
          ++updates > 1 ||
          node.async ||
          node.generator ||
          node.params.length > 2 ||
          node.params.some((p) => p.type !== "Identifier")
        )
          throw new Error("Only one top-level function update(dt, time) is supported.");
      }
      if (node.type === "Property" && (node.kind !== "init" || node.method || node.computed))
        throw new Error("Use plain material options.");
    }
    for (const [key, val] of Object.entries(node))
      if (!["start", "end", "type"].includes(key)) {
        if (Array.isArray(val)) val.forEach((v) => walk(v, depth + 1));
        else if (val && typeof val === "object") walk(val, depth + 1);
      }
  }
  walk(ast);
  return ast;
}
// A small interpreter, NOT eval/Function. No user code becomes executable JS.
export function runSimulation(THREE, scene, code) {
  const ast = validateCode(code),
    env = new Map(),
    owned = [];
  let steps = 0,
    constructs = 0,
    vertices = 0,
    ticking = false,
    update = null;
  const handle = (kind, value) => ({ sparkHandle: true, kind, value });
  env.set("scene", handle("object", scene));
  const numeric = (v) => {
    if (typeof v !== "number" || !Number.isFinite(v) || Math.abs(v) > 1e7)
      throw new Error("Expected a finite number within the simulation limits.");
    return v;
  };
  const target = (node) => {
    if (node.type !== "MemberExpression") throw new Error("Expected a transform property.");
    const obj = evaluate(node.object);
    if (!obj?.sparkHandle) throw new Error("This property is unavailable.");
    return [obj, node.property.name];
  };
  const evaluate = (node) => {
    if (!node) return undefined;
    if (++steps > 5000) throw new Error("Simulation instruction limit exceeded.");
    switch (node.type) {
      case "Program":
      case "BlockStatement": {
        let result;
        for (const n of node.body) result = evaluate(n);
        return result;
      }
      case "VariableDeclaration":
        for (const d of node.declarations) {
          if (
            d.id.type !== "Identifier" ||
            ["scene", "THREE", "Math", "update"].includes(d.id.name)
          )
            throw new Error("Choose a different variable name.");
          env.set(d.id.name, evaluate(d.init));
        }
        return;
      case "Identifier":
        if (!env.has(node.name)) throw new Error(`Unknown name: ${node.name}`);
        return env.get(node.name);
      case "Literal":
        return node.value;
      case "ExpressionStatement":
        return evaluate(node.expression);
      case "ObjectExpression": {
        const obj = Object.create(null);
        for (const p of node.properties) {
          const key = p.key.name ?? p.key.value;
          if (
            !["color", "roughness", "metalness", "wireframe", "transparent", "opacity"].includes(
              key
            )
          )
            throw new Error(`Material option ${key} is unavailable.`);
          const v = evaluate(p.value);
          if (
            typeof v !== "number" &&
            typeof v !== "boolean" &&
            !(key === "color" && typeof v === "string" && /^#[\da-f]{6}$/i.test(v))
          )
            throw new Error("Invalid material value.");
          obj[key] = v;
        }
        return obj;
      }
      case "ArrayExpression":
        if (node.elements.length > 64) throw new Error("Array limit exceeded.");
        return node.elements.map(evaluate);
      case "NewExpression": {
        if (ticking || ++constructs > 180)
          throw new Error("Create up to 180 objects before update(), not during animation.");
        if (
          node.callee.type !== "MemberExpression" ||
          node.callee.object.name !== "THREE" ||
          !TYPES.has(node.callee.property.name)
        )
          throw new Error("This Three.js constructor is unavailable.");
        const name = node.callee.property.name,
          args = node.arguments.map(evaluate);
        let obj, kind;
        if (name.endsWith("Geometry")) {
          args.forEach((v, i) => {
            numeric(v);
            if (Math.abs(v) > 100 || (i > 1 && Math.abs(v) > 64))
              throw new Error("Keep dimensions ≤ 100 and segments ≤ 64.");
          });
          obj = new THREE[name](...args);
          vertices += obj.attributes.position?.count || 0;
          if (vertices > 100000) {
            obj.dispose();
            throw new Error("Total geometry limit exceeded (100,000 vertices).");
          }
          kind = "geometry";
        } else if (name.endsWith("Material")) {
          if (args.length > 1 || args[0]?.sparkHandle)
            throw new Error("Use plain material options.");
          obj = new THREE[name](args[0] || {});
          kind = "material";
        } else if (name === "Mesh") {
          if (args[0]?.kind !== "geometry" || args[1]?.kind !== "material")
            throw new Error("Mesh requires geometry and material.");
          obj = new THREE.Mesh(args[0].value, args[1].value);
          kind = "object";
        } else if (name === "Group") {
          obj = new THREE.Group();
          kind = "object";
        } else {
          args.forEach(numeric);
          obj = new THREE.Vector3(...args);
          kind = "vector";
        }
        owned.push(obj);
        return handle(kind, obj);
      }
      case "MemberExpression": {
        if (node.object.name === "Math" && node.property.name === "PI") return Math.PI;
        if (node.object.name === "Math" && node.property.name === "E") return Math.E;
        const [obj, key] = target(node);
        if (obj.kind === "object" && ["position", "rotation", "scale"].includes(key))
          return handle("vector", obj.value[key]);
        if (obj.kind === "vector" && ["x", "y", "z"].includes(key)) return obj.value[key];
        throw new Error(`Property ${key} is unavailable.`);
      }
      case "CallExpression": {
        if (node.callee.type !== "MemberExpression")
          throw new Error("Only approved object methods are callable.");
        const key = node.callee.property.name,
          args = node.arguments.map(evaluate);
        if (node.callee.object.name === "Math") {
          if (
            !["sin", "cos", "tan", "abs", "sqrt", "pow", "min", "max", "floor", "ceil"].includes(
              key
            ) ||
            args.length > 4
          )
            throw new Error("Math function unavailable.");
          return numeric(Math[key](...args.map(numeric)));
        }
        const [obj] = target(node.callee);
        if (obj.kind === "object" && key === "add") {
          if (
            obj.value.children.length + args.length > 180 ||
            args.some((a) => a?.kind !== "object" || a.value === scene || a.value === obj.value)
          )
            throw new Error("Invalid scene child.");
          for (const a of args) {
            let parent = obj.value;
            while (parent) {
              if (parent === a.value) throw new Error("Cyclic groups are not allowed.");
              parent = parent.parent;
            }
          }
          obj.value.add(...args.map((a) => a.value));
          return;
        }
        if (obj.kind === "vector" && key === "set" && args.length === 3) {
          obj.value.set(...args.map(numeric));
          return;
        }
        throw new Error(`Method ${key} is unavailable.`);
      }
      case "AssignmentExpression": {
        const value = numeric(evaluate(node.right));
        if (!["=", "+=", "-=", "*="].includes(node.operator))
          throw new Error("Assignment operator unavailable.");
        const combine = (old) =>
          node.operator === "="
            ? value
            : node.operator === "+="
              ? numeric(old) + value
              : node.operator === "-="
                ? numeric(old) - value
                : numeric(old) * value;
        if (node.left.type === "Identifier") {
          if (!env.has(node.left.name)) throw new Error("Unknown variable.");
          env.set(node.left.name, numeric(combine(env.get(node.left.name))));
        } else {
          const [obj, key] = target(node.left);
          if (obj.kind !== "vector" || !["x", "y", "z"].includes(key))
            throw new Error("Only transforms can be assigned.");
          obj.value[key] = numeric(combine(obj.value[key]));
        }
        return;
      }
      case "BinaryExpression": {
        const a = numeric(evaluate(node.left)),
          b = numeric(evaluate(node.right));
        const ops = {
          "+": () => a + b,
          "-": () => a - b,
          "*": () => a * b,
          "/": () => a / b,
          "%": () => a % b,
          "**": () => a ** b,
          "<": () => a < b,
          ">": () => a > b,
          "<=": () => a <= b,
          ">=": () => a >= b,
          "===": () => a === b,
        };
        if (!ops[node.operator]) throw new Error("Operator unavailable.");
        return ops[node.operator]();
      }
      case "UnaryExpression": {
        const v = evaluate(node.argument);
        if (node.operator === "-") return -numeric(v);
        if (node.operator === "+") return numeric(v);
        if (node.operator === "!") return !v;
        throw new Error("Unary operator unavailable.");
      }
      case "IfStatement":
        return evaluate(evaluate(node.test) ? node.consequent : node.alternate);
      case "ConditionalExpression":
        return evaluate(evaluate(node.test) ? node.consequent : node.alternate);
      case "FunctionDeclaration":
        update = node;
        return;
      case "ReturnStatement":
        return;
      default:
        throw new Error("Unsupported syntax.");
    }
  };
  try {
    evaluate(ast);
  } catch (e) {
    owned.forEach((o) => o.dispose?.());
    throw e;
  }
  return {
    tick(dt, time) {
      if (!update) return;
      steps = 0;
      ticking = true;
      update.params.forEach((p, i) => env.set(p.name, i === 0 ? dt : time));
      evaluate(update.body);
    },
    dispose() {
      owned.forEach((o) => o.dispose?.());
    },
  };
}
