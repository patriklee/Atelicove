# Mock Count Fix

This patch fixes the runtime React error:

```text
Objects are not valid as a React child (found: object with keys {count})
```

`AdminHomePage` stores the response from `/workorders/count` directly in state and renders it. The mock API was returning `{ count: n }`, so React tried to render an object. The mock API now returns a plain number for `/count` endpoints.

Also included:
- `src/mockApi.js` with richer sample mock data
- `src/shared/api/client.js` to route calls through mock mode when `REACT_APP_USE_MOCK_API=true`
- `.env.development.local` with `REACT_APP_USE_MOCK_API=true`
