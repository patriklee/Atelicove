# Atelicove backend domain rules

- Active project, team, worker, and work-order relationships are operational records with historical meaning.
- Existing teams may be attached to live projects without changing unrelated team records.
- Work-order assignments must reference active workers and companies.
- Open projects and work orders may be edited only through their supported lifecycle transitions.
- Full history for detached associations is a future enhancement; no complete detachment-history mechanism exists today.
- Archive state removes an entity from active operation and is separate from business completion status.
