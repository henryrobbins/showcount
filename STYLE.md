# STYLE.md

## General

- **Occam's Razor**: The simplest solution is often the best
- **DRY (Don't Repeat Yourself)**: Extract and reuse common logic
- **Elegant, Modular Code**: Small, focused files and functions
- **Ask, Don't Guess**: Better to clarify than to make assumptions
- **Comment Carefully**: Avoid overly verbose comments; docstrings preferred

## TypeScript

- **Linting/Formatting:** Biome

### Naming Conventions

- **Components:** PascalCase (e.g., `UserProfile`, `ShowTable`)
- **Functions:** camelCase (e.g., `fetchShowData`, `formatDate`)
- **Files:** Match the component/module name

### Type Definitions

- Prefer `interface` over `type` for object shapes
- Component files should `export default` at the end of the file

### Import Grouping

Imports should be grouped into three sections (if applicable) at the top of the file: standard library/React, third-party dependencies, and custom.

```typescript
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { formatDate } from 'date-fns';

import { fetchShows } from '@/lib/api';
import { Show } from '@/types/show';
```

## Python

- **Linting/Formatting:** ruff

### Type Checking

MyPy is used for type checking. Always include type hints to avoid type checking errors. If extensive type checking errors are discovered, STOP and ask how to proceed.

- Do not use `Optional` type; use `x | None` instead

### Import Grouping

Imports should be grouped into three sections (if applicable) at the top of the file: standard library, third-party dependencies, and custom.

```python
import os
from datetime import datetime

import numpy as np
import pandas as pd

from src.module_a import custom_function
from src.module_b import another_custom_function
```

