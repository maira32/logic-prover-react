// logicSolver.js

class Node {
  constructor(op = "", value = "", left = null, right = null) {
    this.op = op;
    this.value = value;
    this.left = left;
    this.right = right;
  }

  equals(other) {
    if (!other) return false;
    if (this.op !== other.op) return false;
    if (this.op === "ATOM") return this.value === other.value;
    
    const leftMatch = (this.left && other.left) ? this.left.equals(other.left) : (this.left === other.left);
    const rightMatch = (this.right && other.right) ? this.right.equals(other.right) : (this.right === other.right);
    return leftMatch && rightMatch;
  }

  toString() {
    if (this.op === "ATOM") return this.value;
    if (this.op === "~") return "~" + (this.left.op === "ATOM" ? this.left.toString() : "(" + this.left.toString() + ")");
    
    const l = (this.left.op === "ATOM" || this.left.op === "~") ? this.left.toString() : "(" + this.left.toString() + ")";
    const r = (this.right.op === "ATOM" || this.right.op === "~") ? this.right.toString() : "(" + this.right.toString() + ")";
    return l + " " + this.op + " " + r;
  }
}

// --- PARSING ---
function clean(s) {
  return s.replace(/\s+/g, '');
}

function parse(s) {
  s = clean(s);
  if (!s) return null;

  // Handle outer parentheses
  if (s.startsWith('(') && s.endsWith(')')) {
    let bal = 0;
    let split = false;
    for (let i = 0; i < s.length - 1; ++i) {
      if (s[i] === '(') bal++;
      if (s[i] === ')') bal--;
      if (bal === 0 && i > 0) { split = true; break; }
    }
    if (!split) return parse(s.substring(1, s.length - 1));
  }

  let balance = 0;
  let targetIdx = -1;

  // Find implication (>)
  for (let i = s.length - 1; i >= 0; --i) {
    if (s[i] === ')') balance++;
    else if (s[i] === '(') balance--;
    if (balance === 0 && s[i] === '>') { targetIdx = i; break; }
  }

  // Find OR (v) or AND (.)
  if (targetIdx === -1) {
    balance = 0;
    for (let i = s.length - 1; i >= 0; --i) {
      if (s[i] === ')') balance++;
      else if (s[i] === '(') balance--;
      if (balance === 0 && (s[i] === 'v' || s[i] === '.')) { targetIdx = i; break; }
    }
  }

  const node = new Node();
  if (targetIdx !== -1) {
    node.op = s[targetIdx];
    node.left = parse(s.substring(0, targetIdx));
    node.right = parse(s.substring(targetIdx + 1));
  } else if (s[0] === '~') {
    node.op = "~";
    node.left = parse(s.substring(1));
  } else {
    node.op = "ATOM";
    node.value = s;
  }
  return node;
}

// --- CLONING UTILITY ---
function cloneNode(n) {
  if (!n) return null;
  return new Node(n.op, n.value, cloneNode(n.left), cloneNode(n.right));
}

// --- REPLACEMENT RULES ---
function getReplacements(n) {
  const results = [];
  if (!n) return results;

  // DN: ~~P -> P
  if (n.op === "~" && n.left && n.left.op === "~") {
    results.push(cloneNode(n.left.left));
  }
  // DN: P -> ~~P
  const dn = new Node("~", "", new Node("~", "", cloneNode(n)));
  results.push(dn);

  // Comm: P . Q -> Q . P  |  P v Q -> Q v P
  if (n.op === "." || n.op === "v") {
    results.push(new Node(n.op, "", cloneNode(n.right), cloneNode(n.left)));
  }

  // Impl: P > Q -> ~P v Q
  if (n.op === ">") {
    const impl = new Node("v", "", new Node("~", "", cloneNode(n.left)), cloneNode(n.right));
    results.push(impl);
  }
  // Impl: ~P v Q -> P > Q
  if (n.op === "v" && n.left.op === "~") {
    const impl_rev = new Node(">", "", cloneNode(n.left.left), cloneNode(n.right));
    results.push(impl_rev);
  }

  // DM: ~(P . Q) -> ~P v ~Q
  if (n.op === "~" && n.left.op === ".") {
    const dm = new Node("v", "", 
      new Node("~", "", cloneNode(n.left.left)), 
      new Node("~", "", cloneNode(n.left.right))
    );
    results.push(dm);
  }

  return results;
}

// --- SOLVER ENGINE ---
function isKnown(currentPath, target) {
  for (const step of currentPath) {
    if (step.node.equals(target)) return true;
  }
  return false;
}

let globalGoals = [];
function collectGoals(n) {
  if (!n) return;
  globalGoals.push(n);
  collectGoals(n.left);
  collectGoals(n.right);
}

function findPath(currentPath, target, currentDepth, maxDepth) {
  if (isKnown(currentPath, target)) return true;
  if (currentDepth >= maxDepth) return false;

  const n = currentPath.length;
  
  // Try Rules
  for (let i = 0; i < n; ++i) {
    const p1 = currentPath[i].node;

    // Replacements
    const replacements = getReplacements(p1);
    for (const rep of replacements) {
      if (!isKnown(currentPath, rep)) {
        currentPath.push({ node: rep, rule: "Repl", ref1: i + 1, ref2: -1 });
        if (findPath(currentPath, target, currentDepth + 1, maxDepth)) return true;
        currentPath.pop();
      }
    }

    // Simplification
    if (p1.op === ".") {
      const parts = [p1.left, p1.right];
      for (const p of parts) {
        if (!isKnown(currentPath, p)) {
          currentPath.push({ node: p, rule: "Simp", ref1: i + 1, ref2: -1 });
          if (findPath(currentPath, target, currentDepth + 1, maxDepth)) return true;
          currentPath.pop();
        }
      }
    }

    // Addition
    for (const goal of globalGoals) {
      if (goal.op === "v" && (goal.left.equals(p1) || goal.right.equals(p1))) {
        if (!isKnown(currentPath, goal)) {
          currentPath.push({ node: goal, rule: "Add", ref1: i + 1, ref2: -1 });
          if (findPath(currentPath, target, currentDepth + 1, maxDepth)) return true;
          currentPath.pop();
        }
      }
    }

    // 2-Line Rules
    for (let j = 0; j < n; ++j) {
      if (i === j) continue;
      const p2 = currentPath[j].node;
      const results = [];

      // MP: P>Q, P -> Q
      if (p1.op === ">" && p1.left.equals(p2)) results.push({ n: p1.right, r: "MP" });
      
      // MT: P>Q, ~Q -> ~P
      if (p1.op === ">" && p2.op === "~" && p1.right.equals(p2.left)) {
        results.push({ n: new Node("~", "", p1.left), r: "MT" });
      }

      // DS: PvQ, ~P -> Q
      if (p1.op === "v" && p2.op === "~") {
        if (p2.left.equals(p1.left)) results.push({ n: p1.right, r: "DS" });
        if (p2.left.equals(p1.right)) results.push({ n: p1.left, r: "DS" });
      }

      // HS: P>Q, Q>R -> P>R
      if (p1.op === ">" && p2.op === ">" && p1.right.equals(p2.left)) {
        results.push({ n: new Node(">", "", p1.left, p2.right), r: "HS" });
      }

      // CD
      if (p1.op === "." && p1.left.op === ">" && p1.right.op === ">" && p2.op === "v") {
        const P = p1.left.left, Q = p1.left.right, R = p1.right.left, S = p1.right.right;
        if ((p2.left.equals(P) && p2.right.equals(R)) || (p2.left.equals(R) && p2.right.equals(P))) {
          results.push({ n: new Node("v", "", Q, S), r: "CD" });
        }
      }

      // Conjunction
      for (const goal of globalGoals) {
        if (goal.op === "." && ((goal.left.equals(p1) && goal.right.equals(p2)) || (goal.left.equals(p2) && goal.right.equals(p1)))) {
          results.push({ n: goal, r: "Conj" });
        }
      }

      for (const res of results) {
        if (!isKnown(currentPath, res.n)) {
          currentPath.push({ node: res.n, rule: res.r, ref1: i + 1, ref2: j + 1 });
          if (findPath(currentPath, target, currentDepth + 1, maxDepth)) return true;
          currentPath.pop();
        }
      }
    }
  }
  return false;
}

// --- EXPORTED SOLVER FUNCTION ---
export function solveProof(premisesStr, conclusionStr) {
  const initialPath = [];
  const segments = premisesStr.split(',');
  
  for (const seg of segments) {
    const p = parse(seg);
    if (p) initialPath.push({ node: p, rule: "Premise", ref1: -1, ref2: -1 });
  }

  const conclusion = parse(conclusionStr);
  if (initialPath.length === 0 || !conclusion) {
    return { success: false, message: "Error: Invalid Input." };
  }

  globalGoals = [];
  collectGoals(conclusion);
  for (const step of initialPath) collectGoals(step.node);

  // Iterative deepening search
  for (let depth = 1; depth <= 12; ++depth) { // Reduced max depth slightly for browser safety
    const proof = [...initialPath];
    if (findPath(proof, conclusion, 0, depth)) {
      return { 
        success: true, 
        steps: proof.map((step, index) => ({
          index: index + 1,
          expression: step.node.toString(),
          rule: step.rule,
          ref: step.rule === "Premise" ? "" : `(${step.ref1}${step.ref2 !== -1 ? ', ' + step.ref2 : ''})`
        }))
      };
    }
  }

  return { success: false, message: "Proof not found within search limits." };
}