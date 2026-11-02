# API reference

Base URL: `http://localhost:5000/api/v1`. Every case endpoint uses the anonymous HTTP-only `mystery_session` cookie. The browser must send credentials.

## Responses

Success responses use `{ "success": true, "data": ... }`. Errors use `{ "success": false, "message": "...", "error": { "code": "..." } }`.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | API health check |
| POST | `/cases/generate` | Generate and persist a case |
| GET | `/cases/:caseId` | Public case details, excluding solution and culprit flag |
| GET | `/cases/:caseId/suspects/:suspectId` | Public suspect profile |
| GET | `/cases/:caseId/evidence?type=&page=&limit=` | Paginated public evidence metadata |
| GET | `/cases/:caseId/evidence/:evidenceId` | Full user-facing evidence content; marks it viewed |
| POST | `/cases/:caseId/progress` | Mark `{type: "evidence"|"suspect", itemId}` viewed |
| POST | `/cases/:caseId/accusation` | Submit `{suspectId, explanation?}` once; reveals solution |

Generation body: `{title?: string, story: string, difficulty: "easy"|"medium"|"hard", suspectCount: number}`. Story must be 50–2,000 characters, title at most 80, and suspect count 3–6.

An accusation returns `{isCorrect, score, result: {culpritName, motive, method, fullExplanation}}`. A second accusation returns HTTP 409. Invalid input returns 400; inaccessible cases return 404; missing Gemini configuration or provider failures return 503.

## Security notes

Case IDs are random, but case ownership is also checked against a SHA-256 hash of the signed, HTTP-only browser session cookie. `solution` and `sessionHash` are excluded from normal Mongoose reads. The solution is included only in the successful accusation response. Cookie CORS is limited to `CLIENT_URL`.
