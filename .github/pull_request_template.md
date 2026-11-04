## Description

<!-- Provide a brief summary of the changes introduced by this pull request. -->

**Fixes:** #<!-- issue number -->

---

## "Done When" Checklist

- [ ] Every business rule resides in the Domain tier (not in UI, controllers, or route handlers)
- [ ] Every domain rule has at least one corresponding unit test
- [ ] Database persistence survives restart (Supabase / PostgreSQL)
- [ ] New classes/methods match UML diagrams (or are styled as planned)
- [ ] Tests pass locally (`go test ./...` in backend, `npm test -- --run` in frontend)

---

## AI Critique Block

> **Note:** If AI assisted with drafting, refactoring, or generating code/tests in this PR, complete every item below. If no AI was used, state "No AI assistance used."

### 1. AI Tool / Model Used
- <!-- e.g., Google Antigravity / Gemini 3.8 / GitHub Copilot / Claude 3.5 Sonnet -->

### 2. What I Checked
- <!-- What specific code, logic, edge cases, and architectural boundaries did you review in the AI's proposal? -->

### 3. What Was Wrong
- <!-- What mistakes, hallucinations, tier violations, or missed edge cases did the AI produce? Be concrete. -->

### 4. What I Fixed or Kept
- <!-- What did you rewrite, fix, or discard? What parts were verified and retained? -->

---

## Verification & Testing

```bash
# Backend unit tests
cd backend && go test -v -count=1 ./...

# Frontend unit tests
cd frontend && npm test -- --run
```
