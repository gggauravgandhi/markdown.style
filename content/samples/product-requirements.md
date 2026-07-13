# Bulk Export API: Product Requirements

*Owner: Platform Team. Target: Q3.*

## Problem statement

Customers with more than 10,000 records cannot export their data. The existing export endpoint times out at 30 seconds and caps at 5,000 rows, so large accounts fall back to support tickets and manual CSV pulls, averaging three business days to fulfil.

## Goals

- Export any account's full dataset regardless of size.
- Keep the request and response contract simple enough for existing API clients to adopt without a major version bump.
- Get a customer from "request export" to "download link" in under five minutes for 95% of accounts.

## Non-goals

- Real-time or streaming export: this is a batch job, not a live feed.
- Custom export formats beyond CSV and JSON.
- Scheduled or recurring exports; that is a separate proposal.

## User stories

- As an account admin, I want to request a full export so that I can migrate to another tool without contacting support.
- As a support engineer, I want to see export job status so that I can answer "where's my export" tickets without escalating.
- As a developer integrating our API, I want a webhook on export completion so that I do not have to poll.

## Requirements

| ID | Requirement | Priority |
|---|---|---|
| R1 | Accept an export request via `POST /exports` and return a job ID immediately | Must |
| R2 | Support CSV and JSON output formats | Must |
| R3 | Job status queryable via `GET /exports/:id` | Must |
| R4 | Completion webhook with a signed payload | Should |
| R5 | Exported file available for 7 days via signed URL | Must |
| R6 | Export logged in the account's audit trail | Should |

## Acceptance criteria

- [x] `POST /exports` returns `202 Accepted` with a job ID within 500ms
- [x] Jobs over 1M rows complete without manual intervention
- [ ] Webhook retries on non-2xx response, up to 3 attempts
- [ ] Signed URL expires and 404s after 7 days
- [ ] Every export request appears in the account audit log within 60 seconds

## Rollout plan

Ship behind a feature flag to five design-partner accounts first, then open to all accounts on the Team and Enterprise plans. Self-serve accounts get read access to the endpoint, but exports above 50,000 rows queue behind paid traffic.
