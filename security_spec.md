# Firestore Security Specification: School Bus Tracker

## 1. Data Invariants
- **Buses Collection**:
    - Only authorized administrators can create or update bus details.
    - Drivers/Parents can only read bus details.
- **Location Subcollection**:
    - Location updates can ONLY be written by the driver assigned to that bus.
    - Location updates must include valid lat/lng coordinates.
    - Timestamp must be set to `request.time`.
    - Updates are append-only (users cannot delete existing locations once written).

## 2. The "Dirty Dozen" Payloads
1. **Anonymous Write**: Attempt to create a bus document without authentication.
2. **Unauthorized Bus Update**: Attempt to update bus `routeName` as a logged-in parent.
3. **Location Poisoning (Lat)**: Attempt to write location with `lat` > 90.
4. **Location Poisoning (Lng)**: Attempt to write location with `lng` > 180.
5. **Ghost Field Injection**: Attempt to write location with a `userId` field (that shouldn't exist).
6. **Deletion Attack**: Attempt to delete an existing location document.
7. **Cross-Bus Write**: Attempt to write location for `busA` while assigned to `busB`.
8. **Invalid Timestamp**: Attempt to write location with a hardcoded timestmap (not `request.time`).
9. **Role Spoofing**: Attempt to modify the `driverId` field in the bus document as a driver.
10. **Query Scraping**: Attempt to list all locations across all buses as a parent without limiting the query (should be rejected if rules don't permit).
11. **ID Poisoning**: Attempt to write a document with a 1.5KB string as the document ID.
12. **Terminal State Modification**: Attempt to update a bus that is already set to 'inactive'.

## 3. The Test Runner (`firestore.rules.test.ts`)
*To be implemented in future phase.*
