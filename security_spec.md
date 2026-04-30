# Security Specification - UgandaSkilling Hub

## Data Invariants
1. A user can only access their own savings transactions and profile.
2. Only an admin can create or modify courses.
3. A user can only apply for a loan if they have at least one issued certificate. (Enforced in UI/App logic, but rules should restrict cross-user writes).
4. Certificates are only created by the system/admin? Actually, the app logic will create it upon 100% progress. Rules must ensure users can't forge certificates.
5. Savings balance is only modified by transactions. Actually, `savingsBalance` on the User profile is a summary.

## The Dirty Dozen Payloads (Target: DENIED)

1. **Identity Spoofing**: Attempting to create a profile for another UID.
   - `PUT /users/victim_uid { "uid": "victim_uid", "role": "student", "email": "me@attacker.com" }`
2. **Privilege Escalation**: A student trying to make themselves an admin.
   - `PATCH /users/my_uid { "role": "admin" }`
3. **Ghost Course**: A student trying to create a new course.
   - `POST /courses { "title": "Free Money Course", "description": "Steal funds" }`
4. **Certificate Forgery**: A user trying to create a certificate for themselves without finishing a course.
   - `POST /certificates { "userId": "attacker_uid", "courseId": "any_course", "certificateNumber": "FAKE-123" }`
5. **Savings Theft**: A user trying to set their savings balance to $1M.
   - `PATCH /users/attacker_uid { "savingsBalance": 1000000 }`
6. **Transaction Hijacking**: A user trying to delete someone else's saving transaction.
   - `DELETE /savings/victim_trans_id`
7. **Loan Approval**: A student trying to approve their own loan.
   - `PATCH /loanRequests/my_request_id { "status": "approved" }`
8. **Shadow Field Injection**: Adding `isVerified: true` to a user profile to bypass verification.
   - `PATCH /users/attacker_uid { "isVerified": true }`
9. **Course Vandalism**: A student trying to delete a legitimate course.
   - `DELETE /courses/real_course_id`
10. **Orphaned Enrollment**: Creating an enrollment for a non-existent user.
    - `POST /enrollments { "userId": "non_existent_uid", ... }`
11. **Timestamp Manipulation**: Setting `createdAt` to a date in the past to look like a long-time member for loan priority.
    - `POST /users/attacker_uid { "createdAt": "2020-01-01T00:00:00Z", ... }`
12. **Denial of Wallet**: Sending a 1MB string as a course title.
    - `POST /courses { "title": "A".repeat(1024 * 1024) }`

## Test Runner
A `firestore.rules.test.ts` will be implemented to verify these. (Simulated in logic check).
