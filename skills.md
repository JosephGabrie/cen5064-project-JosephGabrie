# Skill: Strict TDD & Polyglot Coding Standards (TypeScript & Go)

## Metadata
- **Description:** Enforces Airbnb TypeScript standards, Effective Go best practices, strict Test-Driven Development (TDD) for every new function, and comprehensive intent documentation.
- **Trigger:** When writing, refactoring, or adding new functions/features in TypeScript or Go.

---

## Core Guidelines & Rules

### 1. Coding Standards & Style Guides
* **TypeScript:** Strictly follow the **Airbnb TypeScript Style Guide** (e.g., explicit typing, strict null checks, preference for `const`, camelCase for variables/functions, PascalCase for classes/types, and proper error handling).
* **Go:** Strictly follow **Effective Go** practices (e.g., clean formatting with `gofmt`, idiomatic error handling, proper use of interfaces, short variable names where appropriate, and clear package naming).

### 2. Test-Driven Development (TDD) Workflow
For every new function requested:
1. **Red Phase:** Write the unit test(s) *before* implementing the function body. Ensure the test fails or correctly defines the expected contract.
2. **Green Phase:** Write the minimal implementation code required to pass the tests.
3. **Refactor Phase:** Clean up the code while keeping tests green, ensuring compliance with the respective style guides.

### 3. Documentation & Intent
* Every code delivery must be accompanied by a brief documentation block explaining:
  * **What was done:** A summary of the implementation.
  * **The Intent:** The architectural reasoning, design choices, or problem-solving rationale behind the code.

---

## Execution Checklist & Steps

1. **Analyze Input:** front-end for TypeScript and back-end for Go.
2. **Write Tests First:** Create the test file/stub and write failing tests covering edge cases and happy paths.
3. **Implement:** Write the function adhering strictly to Airbnb TS or Effective Go rules.
4. **Verify:** Confirm tests pass successfully.
5. **Document:** Provide the clear "What & Why" summary alongside the code output. in the folder marked as agent_documentation.md
6. any mistake should be put in mistakes.md in the folder of the file
