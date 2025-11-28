## **Code Organization & Standards**

### File Structure

- **350-line limit per file** - break into focused modules
- **Centralized types** in `src/types/`
- **Shared state** in `src/store/`
- **Canvas configs** in `src/config/`

### Type System

- Use TypeScript for all code
- Prefer `interface` over `type`
- Avoid `any` and `enum`
- **Type-first development:** Define interfaces before implementation

### State Management

- Use **Zustand** for state management
- `src/store/` contains **store factories** - functions that create isolated store instances
- Each canvas experiment creates its own store instance to avoid performance issues
- Global app state (UI, routing, etc.) can use shared stores
- Canvas-specific state should always be isolated per experiment

### Canvas Configuration

- Each canvas experiment has its own config file in `src/config/`
- Configs are **not for UI settings** - only for canvas-specific parameters
- Examples: `gridConfig.js`, `particleConfig.js`
- Structure configs with clear sections: canvas settings, experiment-specific settings, animation, physics, colors
- Import configs directly or use `getConfig(name)` helper from `src/config/index.js`

---

### **Code Standards**

#### Style

- Functional and declarative programming - avoid classes
- Descriptive variable names with auxiliary verbs (`isLoading`, `hasError`)
- Use `function` keyword for pure functions
- Declarative JSX, use Prettier

#### Comments

Add comments for complex logic, function purpose, and non-obvious details. Keep concise and professional.

---

## **UI Development - Subframe + Tailwind**

### Critical Rules

- Use pre-built components from `src/ui/components`
- **NEVER modify files in `src/ui/components`** - don't fix linting errors there
- To extend, create wrappers with `Ex_` prefix elsewhere
- Tailwind CSS for styling, ensure high a11y standards
- Mobile optimization is not a priority
