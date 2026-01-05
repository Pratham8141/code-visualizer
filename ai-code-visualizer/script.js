const codeView = document.getElementById("codeView");
const varsTable = document.getElementById("varsTable");
const currentLineEl = document.getElementById("currentLine");
const codeInput = document.getElementById("codeInput");
const slider = document.getElementById("timeline");

let stepIndex = 0;
let steps = [];

/* ================= EXECUTION ENGINE ================= */

function execute(ast) {
  const env = {};
  const execSteps = [];

  function evalExpression(node) {
    if (node.type === "Literal") return node.value;

    if (node.type === "Identifier") {
      return env[node.name];
    }

    if (node.type === "BinaryExpression") {
      const left = evalExpression(node.left);
      const right = evalExpression(node.right);

      switch (node.operator) {
        case "+": return left + right;
        case "-": return left - right;
        case "*": return left * right;
        case "/": return left / right;
      }
    }
  }

  ast.body.forEach(statement => {
    if (statement.type === "VariableDeclaration") {
      statement.declarations.forEach(decl => {
        env[decl.id.name] = evalExpression(decl.init);
      });
    }

    if (statement.type === "ExpressionStatement") {
      const expr = statement.expression;
      if (expr.type === "AssignmentExpression") {
        env[expr.left.name] = evalExpression(expr.right);
      }
    }

    execSteps.push({
      line: statement.loc.start.line,
      vars: JSON.parse(JSON.stringify(env))
    });
  });

  return execSteps;
}

/* ================= RENDER ================= */

function render() {
  document.querySelectorAll(".code-line").forEach(l =>
    l.classList.remove("active")
  );

  const current = steps[stepIndex];
  const prev = steps[stepIndex - 1];

  if (!current) return;

  document
    .getElementById(`line-${current.line - 1}`)
    ?.classList.add("active");

  currentLineEl.textContent = `Line: ${current.line}`;

  varsTable.innerHTML = "";

  Object.entries(current.vars).forEach(([key, value]) => {
    const row = document.createElement("tr");
    const changed =
      prev && prev.vars[key] !== undefined && prev.vars[key] !== value;

    row.innerHTML = `<td>${key}</td><td>${value}</td>`;

    if (changed) {
      row.classList.add("changed");
    }

    varsTable.appendChild(row);
  });

  slider.value = stepIndex;
}

/* ================= RUN ================= */

document.getElementById("runBtn").onclick = () => {
  codeView.innerHTML = "";
  varsTable.innerHTML = "";
  stepIndex = 0;

  const codeLines = codeInput.value.trim().split("\n");

  codeLines.forEach((line, i) => {
    const div = document.createElement("div");
    div.textContent = `${i + 1}  ${line}`;
    div.className = "code-line";
    div.id = `line-${i}`;
    codeView.appendChild(div);
  });

  const ast = esprima.parseScript(codeInput.value, { loc: true });
  steps = execute(ast);

  slider.max = steps.length - 1;
  slider.value = 0;

  render();
};

/* ================= CONTROLS ================= */

document.getElementById("nextBtn").onclick = () => {
  if (stepIndex < steps.length - 1) {
    stepIndex++;
    render();
  }
};

document.getElementById("prevBtn").onclick = () => {
  if (stepIndex > 0) {
    stepIndex--;
    render();
  }
};

slider.oninput = () => {
  stepIndex = Number(slider.value);
  render();
};
