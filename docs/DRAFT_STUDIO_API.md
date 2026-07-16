# Draft Studio API contract

Draft Studio uses the admin-only `/draft-projects` API. Draft responses are purpose-built DTOs and never expose JPA back-references.

## Core endpoints

- `GET /draft-projects` — list active drafts
- `GET /draft-projects/{draftProjectID}` — retrieve one draft
- `POST /draft-projects` — create a draft
- `PUT /draft-projects/{draftProjectID}` — update a draft
- `POST|PUT|DELETE /draft-projects/{draftProjectID}/work-orders[/{draftWorkOrderID}]` — manage nested draft work orders
- `POST|PUT|DELETE /draft-projects/{draftProjectID}/planned-staffing[/{plannedStaffingID}]` — manage planned staffing
- `POST /draft-projects/{draftProjectID}/launch` — validate and atomically launch the draft

## Frontend launch contract

A successful launch returns only the new operational project identity:

```json
{
  "projectID": 42,
  "projectName": "Operational project",
  "projectStatus": "OPEN"
}
```

`OPEN` is the operational status of the created project. Draft identity comes from the draft endpoint and `draftProjectID`, never from `ProjectStatus`.

Validation failures return `{ "message": "..." }` with HTTP 409. The draft remains intact and no operational project or work order is committed. A draft must have a name and at least one non-archived work order before launch.
