# Implementation Notes

- Used browser language detection with direct JSON imports because the current UI only has four translatable strings.
- Kept framework names and the Meetly brand unchanged across locales.
- Excluded backend exception messages, SQL constraints, identifiers, and test-only connection strings because they are not user-facing UI copy.
- Kept application settings ignored; deployments must provide the database connection string outside Git.
- Used EF Core entities, database constraints, and a migration for the scheduling schema; no seed data was added.
- Generated the migration with the installed EF 10 CLI against the existing EF Core 8 project after confirming generation succeeded.
- Implemented the audit interface on the shared base entity so every persisted entity gets the fields without duplicated properties.
- Used PostgreSQL `CURRENT_TIMESTAMP` for creation timestamps so existing and newly inserted rows receive valid values.
- Left update timestamp stamping for the future write pipeline; the current task only defines the persistence contract.
- Removed the database default for event status because the entity already initializes it and EF otherwise reports ambiguous sentinel behavior.
- Treat an end time earlier than the start time as the following day; equal times remain invalid instead of representing 24 hours.
- Store overnight ranges in existing time-only columns and compare them as minute offsets from the event start to avoid a schema expansion.
- Broadcast lightweight SignalR invalidation events, then reload uncached event data so every client uses one heatmap implementation.
- Allow read-only realtime subscriptions without authentication because event details are already readable by anyone with the event code.
- Rejoin the SignalR group after reconnect because group membership belongs to the old connection.
- Allow both Docker web and local development origins; the previous Docker default blocks browser SignalR while command-line clients still pass.
- Use Windows-native variable fonts with Vietnamese glyph coverage; avoid a remote font dependency.
