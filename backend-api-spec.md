# Caring Hands Transport — Backend API Specification
### For the backend developer, from the frontend

This document tells you exactly what the frontend needs from the API so it can be
wired in with no back-and-forth. The frontend is already built and live — every
form below already exists, already validates its required fields client-side,
and is already wired to call one placeholder function per form. Once you give me
real endpoint URLs, methods, and confirm the field names/response shape below,
I only need to update one config file on my end — nothing else changes.

---

## 1. How this needs to work, end to end

1. Person fills out a form on the site and submits it.
2. Frontend sends a `POST` request (JSON body) to your endpoint for that form.
3. Your backend validates it, and:
   - Sends the submission to the appropriate company email address (see
     "Which email per form" in each section below — I don't have final
     addresses yet, so use placeholders and we'll confirm them together).
   - Returns a response in the exact shape described in Section 2.
4. Frontend shows a success or error toast based on your response.

The frontend never emails anything directly and never holds any email
credentials — that's 100% your side. Whether you also persist submissions to a
database is up to you / whatever the client wants; the frontend doesn't
currently assume a database exists.

---

## 2. Required response contract

**Every** endpoint below — forms, login, everything — must return JSON shaped
exactly like this:

```json
{
  "success": true,
  "message": "Human-readable message, shown to the user in a toast",
  "data": { }
}
```

- `success` — boolean. `true` only if the submission was fully accepted.
- `message` — string. Shown directly to the end user, so please make it
  human-readable (not a stack trace or error code).
- `data` — object. Can be `{}` for simple form submissions. For the login
  endpoint specifically, this is where the auth token goes (see Section 4).

On validation failure or server error, still return HTTP 200 with `success:
false` and a clear `message` if possible — the frontend already distinguishes
between "server responded but rejected the request" and "couldn't reach the
server at all," so a real HTTP error code (500, etc.) is also handled, but a
graceful `success: false` with a specific message gives the end user a much
better experience than a generic failure.

**Please don't rename or restructure this envelope** — the frontend reads
`success` and `message` at the top level of the response, and `data` as the
payload object.

---

## 3. Field types & validation you should mirror server-side

The frontend already enforces these, but please validate again server-side —
never trust client input alone:

- Any field named `*Email` next to a `confirm*Email` field must match exactly.
- Any field ending in a word-count limit (noted per-field below, e.g. "max 900
  words") should be re-checked server-side.
- Phone fields are free-text (e.g. `(555) 555-5555`), not split into
  area-code/prefix/line-number pieces.
- Date fields arrive as `YYYY-MM-DD` (native HTML date input). Time fields
  arrive as `HH:MM` 24-hour (native HTML time input).
- File upload fields (`resume`, `mvr`, `document`, `documentation`) arrive as
  actual file uploads — please tell me if you want these as
  `multipart/form-data` instead of JSON for any endpoint that includes a file
  field; I'll adjust the request format on my end to match.
- Signature fields (any field ending in `Signature`) arrive as **either** a
  base64 PNG data URL (if the person drew it) or plain text (if they typed
  their name) — same field, two possible formats. Please store/handle both.
- Checkbox-group fields (e.g. `mobilityServices`, `inspectionChecklist`) arrive
  as an **array of strings** if more than one box is checked, or a single
  string if only one is checked. Please handle both shapes, or let me know if
  you'd rather I always send an array.

---

## 4. Staff/Admin authentication

**Endpoint needed:** login (you choose the path, tell me the exact URL)

**Request fields:**
| Field | Type |
|---|---|
| `username` | string |
| `password` | string |

**Expected success response — `data` must include:**
| Field | Type | Notes |
|---|---|---|
| `token` | string | Session/auth token. I'll store this client-side in a cookie that expires after 1 hour, matching your token's expected lifetime — tell me if your token expiry differs from 1 hour so I can match it exactly. |

**Also needed:** a `GET` endpoint that returns **all** administrators (not a
single arbitrary one) — used for an admin-management view. Tell me the shape
you'd return (array of `{ id, name, ... }` or similar) and I'll adapt to it.

**Credential management — now built.** There's a "Account Settings" tab inside
the Staff/Admin portal (`staff-portal.html`) where a signed-in user can change
their own username and/or password.

**Suggested endpoint:** `POST /staff/update-credentials` (must be called with
the person's current auth token/cookie already attached, same as any other
staff-portal request)

| Field | Type | Required |
|---|---|---|
| `currentUsername` | string | required — re-entered to confirm identity |
| `currentPassword` | string | required — re-entered to confirm identity |
| `newUsername` | string | optional — blank means "keep the current username" |
| `newPassword` | string | optional — blank means "keep the current password" |
| `confirmNewPassword` | string | optional — must match `newPassword` exactly if either is filled in |

Please validate `currentUsername` + `currentPassword` against the
**currently logged-in** account server-side (don't just check they're
non-empty) before applying any change, and return `success: false` with a
clear message if they don't match.

**One more thing that matters for auth to actually work:** every request from
the frontend is sent with `credentials: "include"`, so the browser will send
the `cht_staff_token` cookie automatically on every call — but **only if your
CORS setup allows it**. If your API ends up on a different domain/port than
the frontend (very likely, since these are usually deployed separately),
you'll need to:
- Set `Access-Control-Allow-Credentials: true`
- Set `Access-Control-Allow-Origin` to the frontend's **exact** origin (a
  wildcard `*` will not work together with credentials)
- Have your login endpoint set the cookie with `SameSite=None; Secure` if
  frontend and backend are on different domains (not just different ports),
  or `SameSite=Lax`/`Strict` if they share the same top-level domain

If this ends up being awkward on your end, an `Authorization: Bearer <token>`
header is a reasonable alternative — just let me know and I'll switch the
frontend to store the token differently and send it that way instead.

---

## 5. Public forms (no login required)

### 5.1 Feedback
**Suggested endpoint:** `POST /feedback`
**Routes to:** [feedback/general inquiries email — TBD]

| Field | Type | Required |
|---|---|---|
| `title` | string | optional |
| `firstName` | string | required |
| `lastName` | string | required |
| `suffix` | string | optional |
| `email` | string (email) | required |
| `confirmEmail` | string (email) | required — must match `email` |
| `phone` | string | required |
| `inRegardsTo` | string — one of: `transportation`, `employment`, `driver_compliment`, `day_program`, `residential`, `family_caregiver`, `inhome_services`, `unsubscribe`, `other` | required |
| `message` | string | required, max 900 words |
| `spamAnswer` | string | required — answer to a simple math question shown on the form |

---

### 5.2 Request Transportation (Transportation Order Form)
**Suggested endpoint:** `POST /transport-order`
**Routes to:** [dispatch/scheduling email — TBD]
**Note:** should be processed with the understanding that requests are meant
to arrive at least 24 hours before pickup — up to you whether you enforce
that server-side or just relay it.

| Field | Type | Required |
|---|---|---|
| `requestedBy` | string | required |
| `requesterPhone` | string | required |
| `requesterEmail` | string (email) | optional |
| `passengerFirstName` | string | required |
| `passengerLastName` | string | required |
| `isRecurring` | string — `no` / `yes` | required |
| `recurringDetails` | string | optional |
| `appointmentDate` | date | required |
| `appointmentTime` | time | required |
| `pickupStreet` | string | required |
| `pickupLine2` | string | optional |
| `pickupCity` | string | required |
| `pickupState` | string — dropdown, full US state list, defaults to `Colorado` | required |
| `pickupZip` | string | required |
| `pickupCountry` | string — dropdown: `United States` / `Canada` / `Mexico` / `Other`, defaults to `United States` | required |
| `pickupContactPhone` | string | required |
| `destinationStreet` | string | required |
| `destinationLine2` | string | optional |
| `destinationCity` | string | required |
| `destinationState` | string — dropdown, full US state list, defaults to `Colorado` | required |
| `destinationZip` | string | required |
| `destinationCountry` | string — dropdown: `United States` / `Canada` / `Mexico` / `Other`, defaults to `United States` | required |
| `destinationContactPhone` | string | required |
| `requestType` | string — `one_way` / `roundtrip` | required |
| `returnService` | string — `will_call` / `driver_wait` / `preferred_time` | optional |
| `preferredPickupTime` | time | optional |
| `isMinor` | string — `no` / `yes` | required |
| `hasCompanions` | string — `no` / `yes` | required |
| `companionType` | array of strings — `parent_guardian`, `child`, `service_animal`, `aide_caretaker`, `other` | optional |
| `riderCount` | number (≤ 2) | required |
| `mobilityServices` | array of strings — `ambulatory`, `attendant_needed`, `bariatric_wheelchair`, `wheelchair`, `wheelchair_needed`, `other` | optional |
| `comments` | string | optional |

---

### 5.3 Employment Application
**Suggested endpoint:** `POST /employment-application`
**Routes to:** [HR/hiring email — TBD]
**Note:** includes file uploads (`resume`, `mvr`) — see Section 3 re:
multipart vs JSON.

| Field | Type | Required |
|---|---|---|
| `title` | string | optional |
| `firstName` | string | required |
| `lastName` | string | required |
| `suffix` | string | optional |
| `applicantStreet` | string | required |
| `applicantLine2` | string | optional |
| `applicantCity` | string | required |
| `applicantState` | string — dropdown, full US state list, no default | required |
| `applicantZip` | string | required |
| `applicantCountry` | string — dropdown: `United States` / `Canada` / `Mexico` / `Other`, defaults to `United States` | required |
| `phone` | string | required |
| `email` | string (email) | required |
| `confirmEmail` | string (email) | required — must match `email` |
| `dateAvailable` | date | required |
| `desiredSalary` | string | required |
| `positionApplyingFor` | string — `admin_mgmt` / `admin_nonmgmt` / `driving` / `dsp` / `other` | required |
| `jobClassification` | string — `part_time` / `full_time` / `any` | required |
| `age18` | string — `yes` / `no` | required |
| `age25Driver` | string — `yes` / `no` | optional (drivers only — **note: minimum driver age is unconfirmed on our end, currently shown as both 23 and 25 in different places; do not hard-validate this number until we tell you the final figure**) |
| `workEligible` | string — `yes` / `no` | required |
| `workEligibleExplain` | string | optional |
| `backgroundCheck` | string — `yes` / `no` | required |
| `drugTest` | string — `yes` / `no` | required |
| `dotPhysical` | string — `yes` / `no` | required |
| `anyShift` | string — `yes` / `no` | required |
| `shiftLimitations` | string | optional |
| `overtime` | string — `yes` / `no` | required |
| `essentialFunctions` | string — `yes` / `no` | required |
| `accommodationRequested` | string | required |
| `commuteMethod` | string — `personal_vehicle` / `rideshare_taxi` / `public_transport` / `walk_bike` / `not_sure` / `other` | required |
| `workedHereBefore` | string — `no` / `yes` | required |
| `workedHereWhen` | string | optional |
| `appliedHereBefore` | string — `no` / `yes` | required |
| `appliedHereWhen` | string | optional |
| `friendsRelatives` | string | optional |
| `howDidYouHear` | string — `saw_vehicle` / `saw_ad` / `friend_family` / `other` | required |
| `referralCode` | string | optional |
| `highestEducation` | string — `hs_ged` / `post_secondary` / `post_grad` / `other` | required |
| `schoolName` | string | required |
| `references` | string | required, min 10 words / max 500 words |
| `pointsHistory` | string — `no` / `yes` | required |
| `atFaultAccidents` | string — `0` / `1` / `2` / `3+` | required |
| `nonAtFaultAccidents` | string — `0` / `1` / `2` / `3+` | required |
| `trafficConvictionsCount` | string — `0` / `1` / `2` / `3+` | required |
| `atFaultAccidentRecord` | string | optional |
| `nonAtFaultAccidentRecord` | string | optional |
| `trafficConvictionsList` | string | optional |
| `licenseDenied` | string — `yes` / `no` | required |
| `licenseDeniedExplain` | string | optional |
| `licenseSuspended` | string — `yes` / `no` | required |
| `licenseSuspendedExplain` | string | optional |
| `motorVehicleViolations` | string — `0` / `1` / `2-3` / `4-5` / `5-6` / `7+` | required |
| `trafficCertificationList` | string | optional |
| `trafficCertTrue` | string — `true` / `false` | required |
| `resume` | file | required |
| `mvr` | file | required |
| `applicantSignature` | string (base64 PNG or typed text) | required |
| `applicantSignatureFullName` | string | required |
| `applicantSignatureConfirm` | boolean | required |

**Previous Employer 1 (required), 2 and 3 (both optional) — every field below
exists three times, once per prefix `emp1` / `emp2` / `emp3`:**

| Field (prefix + suffix) | Type | Required |
|---|---|---|
| `emp1Company` / `emp2Company` / `emp3Company` | string | required for `emp1` only |
| `emp1Street` / `emp2Street` / `emp3Street` | string | required for `emp1` only |
| `emp1Line2` / `emp2Line2` / `emp3Line2` | string | optional |
| `emp1City` / `emp2City` / `emp3City` | string | required for `emp1` only |
| `emp1State` / `emp2State` / `emp3State` | string — dropdown, full US state list, no default | required for `emp1` only |
| `emp1Zip` / `emp2Zip` / `emp3Zip` | string | required for `emp1` only |
| `emp1Country` / `emp2Country` / `emp3Country` | string — dropdown: `United States` / `Canada` / `Mexico` / `Other`, defaults to `United States` | required for `emp1` only |
| `emp1Phone` / `emp2Phone` / `emp3Phone` | string | required for `emp1` only |
| `emp1Supervisor` / `emp2Supervisor` / `emp3Supervisor` | string | required for `emp1` only |
| `emp1JobTitle` / `emp2JobTitle` / `emp3JobTitle` | string | required for `emp1` only |
| `emp1StartingSalary` / `emp2StartingSalary` / `emp3StartingSalary` | string | optional |
| `emp1EndingSalary` / `emp2EndingSalary` / `emp3EndingSalary` | string | optional |
| `emp1StartDate` / `emp2StartDate` / `emp3StartDate` | date | required for `emp1` only |
| `emp1EndDate` / `emp2EndDate` / `emp3EndDate` | date | required for `emp1` only |
| `emp1Responsibilities` / `emp2Responsibilities` / `emp3Responsibilities` | string | required for `emp1` only, max 500 words |
| `emp1ReasonForLeaving` / `emp2ReasonForLeaving` / `emp3ReasonForLeaving` | string | required for `emp1` only |
| `emp1ContactOk` / `emp2ContactOk` / `emp3ContactOk` | string — `yes` / `no` | required for `emp1` only |

---

### 5.4 Employee Referral
**Suggested endpoint:** `POST /employee-referral`
**Routes to:** [HR email — TBD]

| Field | Type | Required |
|---|---|---|
| `candidateName` | string | required |
| `candidateEmail` | string (email) | required |

**Note:** per the spec, this should trigger an email confirmation back to the
*employee* (not the candidate) containing a unique referral code/link for them
to forward manually — the frontend has no field for "referring employee" yet
since staff identity isn't authenticated on this public page. Let me know how
you want to handle identifying which employee is submitting this (e.g. should
this actually live behind staff login instead of being public?) — flagging
this as something we should confirm together.

---

## 6. Staff/Admin forms (require login)

All five below are only reachable after a successful login (Section 4). Please
confirm whether you want the auth token sent as a cookie automatically (my
current setup) or as an `Authorization` header — I've built for cookie-based
auth but can switch.

### 6.1 Delay Report
**Suggested endpoint:** `POST /staff/delay-report`

| Field | Type | Required |
|---|---|---|
| `yourName` | string | required |
| `yourEmail` | string (email) | required |
| `date` | date | required |
| `timeOfArrival` | time | required |
| `scheduledTimeOfPickup` | time | required |
| `timeOfActualPickup` | time | required |
| `clientName` | string | required |
| `reasonForDelay` | string — `not_ready` / `traffic` / `loading_difficulty` / `mechanical` / `road_conditions` / `weather` / `other` | required |
| `comments` | string | optional |

---

### 6.2 Pre-Trip Inspection
**Suggested endpoint:** `POST /staff/pre-trip-inspection`

| Field | Type | Required |
|---|---|---|
| `dateOfInspection` | date | required |
| `yourName` | string | required |
| `oilChangeRecent` | string — `no` / `yes` | required |
| `oilChangeDetails` | string | optional |
| `oilChangeDueSoon` | string — `yes` / `no` | required |
| `oilChangeDueWhen` | string | optional |
| `odometerNextOilChange` | string | required |
| `fluidsTopped` | string — `yes` / `no` | required |
| `fluidsExplain` | string | optional |
| `vinLast4` | string | required, exactly 4 characters |
| `vehicleMake` | string | required |
| `vehicleModel` | string | required |
| `licensePlate` | string | required, no spaces, min 6 characters |
| `odometerReading` | string | required |
| `fuelLevel` | string — `full` / `3/4` / `1/2` / `1/4` / `low` | required |
| `inspectionChecklist` | array of strings (see checklist keys below) | optional |
| `driverPreparedness` | array of strings (see checklist keys below) | optional |
| `tireInspectionDone` | string — `yes` / `no` | required |
| `tiresNoIrregularWear` | string — `yes` / `no` | required |
| `tirePressureFrontDriver` | string | required, max 2 digits |
| `tirePressureBackDriver` | string | required, max 2 digits |
| `tirePressureFrontPassenger` | string | required, max 2 digits |
| `tirePressureBackPassenger` | string | required, max 2 digits |
| `hasConcerns` | string — `no` / `yes` | required |
| `comments` | string | optional |
| `preTripSignature` | string (base64 PNG or typed text) | required |
| `preTripSignatureFullName` | string | required |
| `preTripSignatureConfirm` | boolean | required |

**`inspectionChecklist` possible values:** `fluids_proper`, `no_leaks`,
`body_damage_noted`, `decals`, `lights`, `muffler`, `battery`, `seats`,
`glass_mirrors`, `gauges`, `clean_exterior`, `brakes`, `doors`,
`interior_lights`, `clean_interior`, `belts_hoses_wires`, `emergency_brake`,
`wipers`, `ac_heater`, `seatbelts`, `first_aid`, `horn`, `tire_condition`,
`accident_kit`, `trash_cans`, `other_tasks`

**`driverPreparedness` possible values:** `air_freshener`, `license`,
`phone_charger`, `registration`, `sanitizer`

---

### 6.3 Hazard Report Card
**Suggested endpoint:** `POST /staff/hazard-report`

| Field | Type | Required |
|---|---|---|
| `reportType` | string — `hazard` / `near_miss` / `unsafe_practice` / `other` | required |
| `date` | date | optional |
| `time` | time | required |
| `location` | string | optional |
| `observation` | string | required |

---

### 6.4 Incident Report
**Suggested endpoint:** `POST /staff/incident-report`
**Note:** includes a file upload (`document`).

| Field | Type | Required |
|---|---|---|
| `employeeFirstName` | string | required |
| `employeeLastName` | string | required |
| `employeeJobTitle` | string | required |
| `employeeDob` | date | required |
| `employeePhone` | string | optional |
| `employeeEmail` | string (email) | optional |
| `employeeConfirmEmail` | string (email) | optional — must match `employeeEmail` if present |
| `involvedFirstName` | string | optional |
| `involvedLastName` | string | optional |
| `involvedStreet` / `involvedLine2` / `involvedCity` / `involvedZip` | string | optional |
| `involvedState` | string — dropdown, full US state list, no default | optional |
| `involvedCountry` | string — dropdown: `United States` / `Canada` / `Mexico` / `Other`, defaults to `United States` | optional |
| `involvedPhone` | string | optional |
| `involvedEmail` | string (email) | optional |
| `incidentDate` | date | required |
| `incidentTime` | time | required |
| `incidentLocation` | string | required |
| `whatHappened` | string | required |
| `natureOfIncident` | string | required |
| `injuryHandling` | string — `ambulance` / `will_seek` / `not_seeking` | optional |
| `hasWitnesses` | string — `no` / `yes` | required |
| `witnessInfo` | string | optional |
| `involvedPartySignature` | string (base64 PNG or typed text) | optional |
| `involvedPartySignatureFullName` | string | optional |
| `involvedPartySignatureConfirm` | boolean | optional |
| `document` | file | optional |
| `driverSignature` | string (base64 PNG or typed text) | required |
| `driverSignatureFullName` | string | required |
| `driverSignatureConfirm` | boolean | required |
| `driverSignatureDate` | date | required |
| `receivedByFirstName` | string | optional (management use) |
| `receivedByLastName` | string | optional (management use) |
| `followUpStatement` | string | optional (management use) |
| `managementDate` | date | optional (management use) |
| `managementPhone` | string | optional (management use) |
| `companyNameAddress` | string | optional — defaults to "Caring Hands Transport, 886 East 78th Avenue, Denver, CO 80229" |

---

### 6.5 Time Off Request
**Suggested endpoint:** `POST /staff/time-off-request`
**Note:** includes a file upload (`documentation`).

| Field | Type | Required |
|---|---|---|
| `firstName` | string | required |
| `lastName` | string | required |
| `email` | string (email) | required |
| `confirmEmail` | string (email) | required — must match `email` |
| `department` | string — `transportation` / `day_program` / `administration` / `intern` / `residential` / `inhome_services` | required |
| `employmentStatus` | string — `full_time` / `part_time` / `contractor` / `other` | required |
| `ptoEligible` | string — `yes` | required |
| `usePto` | string — `no` / `yes` | required |
| `knowsPtoHours` | string — `no` / `yes` | required |
| `ptoAcknowledgment` | boolean | required |
| `requestType` | string — `whole_day` / `half_day` | required |
| `halfDayHours` | string | optional (e.g. "8AM-10AM") |
| `firstDayOff` | date | required |
| `returnDate` | date | required |
| `daysNeeded` | number (≥ 1) | required |
| `reasonOff` | string — `death_in_family` / `doctor_appointment` / `jury_duty` / `military_duty` / `vacation` / `family_event` / `family_issue` / `appointment` / `wedding` / `other` | required |
| `furtherExplanation` | string | required, min 25 words |
| `documentation` | file | optional |
| `timeOffSignature` | string (base64 PNG or typed text) | required |
| `timeOffSignatureFullName` | string | required |
| `timeOffSignatureConfirm` | boolean | required |

---

## 7. Summary checklist for you

- [ ] Confirm final endpoint URLs for all 9 forms + login + admin-list +
      update-credentials
- [ ] Confirm request format: JSON everywhere, or `multipart/form-data` for
      the forms with file uploads (Employment Application, Incident Report,
      Time Off Request)?
- [ ] Confirm auth: cookie-based (my current build) or `Authorization` header?
- [ ] If cookie-based: confirm your CORS setup allows credentials (see the
      CORS note in Section 4) — this is the one that silently breaks auth if
      missed
- [ ] Confirm token expiry length (I've built for 1 hour)
- [ ] Confirm which company email address each form should route to
- [ ] Confirm response envelope matches Section 2 exactly
- [ ] Confirm how checkbox-group fields (arrays) should be sent/received
- [ ] Confirm handling for the two signature formats (base64 PNG vs. typed text)
- [ ] Let me know if the Employee Referral form should actually sit behind
      staff login instead of being public (see 5.4 note)
- [ ] Confirm the update-credentials endpoint validates current
      username/password server-side against the logged-in account (see
      Section 4)
- [ ] Final driver minimum age (23 vs. 25) — separate from your build, but
      needed before that validation gets enforced anywhere

Once these are confirmed, I only need real values for one file on my end —
everything else is already built and ready to receive them.