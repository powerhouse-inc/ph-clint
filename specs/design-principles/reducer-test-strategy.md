## Strategy: 100% Reducer Test Coverage

### Phase 1: Baseline measurement

Run coverage and identify the gap. Statements and lines reach high coverage quickly — the real challenge is **branch coverage**. Every `||`, `??`, `if`, and `&&` creates two branches; V8 counts them independently.

### Phase 2: Write scenario tests first

Before chasing branches, write a small number of tests that exercise **realistic operation sequences**. Each test should chain multiple operations together the way a real consumer would use them. This covers the majority of code paths naturally and reveals which branches remain uncovered.

Prefer fewer tests that each cover wide ranges of behavior over many isolated unit tests per branch. A single "full conversation flow" test that exercises 14 operations in sequence is more valuable and more maintainable than 14 separate tests.

### Phase 3: Categorize every uncovered branch

Don't write tests to hit uncovered branches yet. First, examine each one and classify it:

1. **Wrong nullability in the schema** — The type allows `null` but the value is always initialized and never null at runtime. The defensive fallback (`?? 0`, `?? defaultValue`) creates an unreachable branch. No test can meaningfully cover it because the condition cannot occur through any valid operation sequence.

2. **Missing validation** — The type is nullable because the schema uses a flattened structure (e.g. a tagged union where fields are optional per variant). Some fields are *required for specific variants* but the reducer silently accepts their absence. The fallback branch is reachable but only with invalid input that should be rejected.

3. **Wrong coercion operator** — `||` is used where `??` is needed. Values like `0`, `false`, and `""` are valid but `||` coerces them to the fallback. This is a bug, not a coverage gap.

4. **Legitimate optionality** — The field is genuinely optional. Both branches (value provided / not provided) are reachable through valid inputs. These are the only branches worth covering with tests.

### Phase 4: Fix the implementation, don't test around it

For each category:

- **Wrong nullability** → Tighten the type definition. Make the field non-nullable at the source (schema, type definition). This eliminates the fallback code entirely, removing the untestable branch. If using a code generator, update the source schema and regenerate.

- **Missing validation** → Add validation that throws a specific named error for invalid input. This converts a silent fallback into an explicit rejection. The validation branch is now both reachable and worth testing.

- **Wrong operator** → Fix `||` to `??` (or vice versa). Add a test that passes a falsy-but-valid value (`0`, `false`) and asserts it's preserved.

- **Legitimate optionality** → Add test cases that exercise both sides. Often these can be folded into existing scenario tests by varying inputs (e.g. one call provides the field, another omits it).

### Phase 5: Extend scenario tests to cover remaining branches

With the implementation corrected, extend the existing scenario tests to hit newly-testable branches:

- Add a test that skips initialization to cover "not yet initialized" false branches
- Add error path tests that chain multiple invalid operations in sequence, asserting each error and verifying state is unchanged
- Add a test that uses minimal/empty inputs to cover fallback-to-null branches on optional fields
- Vary inputs across tests so both sides of legitimate `||`/`??` operators are hit (e.g. one test provides `stepIndex: 0`, another omits it)

### Phase 6: Verify and commit

Run coverage. Reducers should be at or near 100% across all four metrics. If any branches remain uncovered, repeat the categorization: is it a type problem, a validation gap, or a legitimate test gap?

### The principle

**Don't test around bad types — fix the types.** When a branch is untestable, the problem is almost never a missing test. It's a type that's too loose, a validation that's missing, or an operator that's wrong. Fix the implementation so that every branch is either reachable and meaningful, or eliminated entirely. Coverage follows naturally from correct types, proper validation, and realistic test scenarios.
