# TODO.md

This file outlines the project management system for showcount. The primary unit for project planning is a plan. A plan's scope is usually suitable for a single Pull Request (PR). Each plan has an associated file within the [plans](/plans/) directory. By convention, plans are named `x-description-of-plan.md` where `x` increments by one for every new plan. The plan file contains a description of the feature(s) it will implement as well as the implementation details. A plan can be in one of three states:

- `TODO`: Plans that have not yet been started
- `ACTIVE`: Plans that are actively being developed
- `COMPLETE`: Plans that have been completed and landed

Note that in the `TODO` and `ACTIVE` states, plans are living documents that should be updated as specifications and/or implementation details change. The [plans](/plans/) directory maintains plan state using the directory structure below.

```
plans
├── active
├── complete
└── todo
```

Lastly, a comprehensive backlog is maintained in [BACKLOG](/BACKLOG.md). DO NOT READ THIS FILE UNLESS EXPLICITLY INSTRUCTED!

