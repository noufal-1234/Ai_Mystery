# Database design

MongoDB database: `ai-mystery-room`. The `cases` collection is implemented as a Mongoose `Case` document with embedded suspects, timeline entries, evidence, solution, accusation, and investigation progress.

| Field | Purpose | Client visibility |
|---|---|---|
| `caseId` | Random human-readable case identifier; unique index | Yes |
| `sessionHash` | SHA-256 anonymous session ownership hash; indexed, `select: false` | Never |
| `incident*`, `victim`, `title`, `difficulty` | Case overview | Yes |
| `suspects` | Public suspect profiles | Safe projection only; no culprit flag |
| `timeline` | Investigation chronology | Yes |
| `evidence` | Evidence metadata and content | Metadata from case route; content from evidence route |
| `solution` | Fixed culprit ID, motive, method, explanation, key evidence, chronology | Only after accusation |
| `accusation` | One submitted suspect, reasoning, score, submission time | Status only before submission |
| `progress` | Viewed evidence and profiles, activity/completion timestamps | Viewed item IDs |

Accusations and progress are embedded to enforce one accusation per case without a cross-collection race. `caseId` is unique; `sessionHash` is indexed. Generated content is stored in the case at creation so the culprit and evidence remain fixed.

## Evidence types

`messages` stores `{contact, date, messages: [{from, text, time}]}`; `image` stores `{visualDetails, caption}`; `cctv` stores `{cameraLocation, dateTime, sequence: [{time, event}]}`; `document` stores `{heading, body, reference}`. Media URL and provider metadata fields are available for future configured media adapters. The current MVP uses described image exhibits and explicitly simulated CCTV playback.
