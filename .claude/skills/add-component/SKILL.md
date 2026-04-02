---
name: add-component
description: Create a new React component for this project. Use when asked to build a modal, UI element, page section, button group, or any new frontend component. Enforces MUI, Framer Motion, and project component conventions.
version: 1.0.0
disable-model-invocation: true
---

# Add Component

Create component: $ARGUMENTS

## Step 1 — Read existing components first

Read a similar component to match patterns:
- Modal component: `app/components/ReportBugModal.js` or `app/components/SubmitReviewModal.js`
- Action buttons: `app/components/ActionButtons.js`
- Main page: `app/page.js`

## Step 2 — Component conventions

```js
'use client'; // Required for all interactive components

import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Box, CircularProgress
  // ... other MUI components
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

// Props destructured directly — no PropTypes needed
export default function MyModal({ open, onClose, userId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      // call service directly
      // await myService.doSomething(data, userId);
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Title</DialogTitle>
      <DialogContent>
        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        {/* content */}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading} variant="contained">
          {loading ? <CircularProgress size={20} /> : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

## Step 3 — Rules

- `'use client'` at top for all interactive components
- **MUI only** for UI elements — no raw HTML divs for layout unless MUI `Box`/`Stack`/`Grid`
- **Framer Motion** for any animations — import from `framer-motion`
- Component manages its own loading + error state
- Services imported directly into components — no prop-drilled service functions
- No business logic in components — call service methods only
- Modal components receive `open` (bool) and `onClose` (fn) props as minimum
- `userId` passed as prop from parent (retrieved via `userTrackingService.getOrCreateUserId()` in the parent)
- File name: PascalCase matching export (e.g. `MyModal.js` exports `default function MyModal`)

## Step 4 — Register in parent

After creating:
1. Import in the parent component (usually `app/page.js` or `app/components/ActionButtons.js`)
2. Add `open` state to parent: `const [showMyModal, setShowMyModal] = useState(false)`
3. Render: `<MyModal open={showMyModal} onClose={() => setShowMyModal(false)} userId={userId} />`
4. Add a trigger button in `ActionButtons.js` if it's a main user action
