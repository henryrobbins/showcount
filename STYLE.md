# STYLE.md

## General

- **Occam's Razor**: The simplest solution is often the best
- **DRY (Don't Repeat Yourself)**: Extract and reuse common logic
- **Elegant, Modular Code**: Small, focused files and functions
- **Ask, Don't Guess**: Better to clarify than to make assumptions
- **Comment Carefully**: Avoid overly verbose comments; docstrings preferred

## TypeScript

- **Linting/Formatting**: Biome

## Python

- **Linting/Formatting:** ruff

### Type Checking

MyPy is used for type checking. Always include type hints to avoid type checking errors. If extensive type checking errors are discovered, STOP and ask how to proceed.

- Do not use `Optional` type; use `x | None` instead

### Import Grouping

Imports should be groped into three sections (if applicable) at the top of the file: standard library, third-party dependencies, and custom.

```python
import os
from datetime import datetime

import numpy as np
import pandas as pd

from src.module_a import custom_function
from src.module_b import another_custom_function
```

