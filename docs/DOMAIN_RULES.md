# Atelicove backend domain rules

- Draft projects are disposable, admin-owned sandboxes and may be empty.
- Draft references are templates or selections, not live associations or update instructions.
- Launch always creates a new active project and a new active work order for each launchable draft work order.
- Source projects, work orders, companies, workers, and teams are validated but are not modified by launch.
- Existing teams may be attached to the new project, but their names and memberships remain unchanged.
- Planned staffing without a source team supplies valid active workers for work-order assignment only; it does not create a reusable team.
- Placeholder or missing workers are draft-only and are discarded at launch.
- Worker proposals are draft work orders and may exist independently of an admin draft project.
- Active project, team, worker, and work-order relationships are operational records with historical meaning.
- Full history for detached associations is a future enhancement; no complete detachment-history mechanism exists today.
- Archive state removes an entity from active operation and is separate from business completion status.
