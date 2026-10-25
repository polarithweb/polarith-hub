# Security Specification (`security_spec.md`)

## 1. Data Invariants

1. **Global Default Deny**: Any path not explicitly matched in `firestore.rules` is unconditionally denied (`allow read, write: if false;`).
2. **Verified Identity**: All write operations require `request.auth != null` and `request.auth.token.email_verified == true`.
3. **Admin Privilege Verification**: Admin status (`isAdmin()`) is only granted if `exists(/databases/$(database)/documents/admins/$(request.auth.uid))` OR the user's verified email is `priyam.dgp13@gmail.com` (`request.auth.token.email == 'priyam.dgp13@gmail.com' && request.auth.token.email_verified == true`).
4. **User PII Isolation (`/users/{userId}`)**: User login records contain PII (`email`, `displayName`, `deviceInfo`). A user can only `get`, `create`, or `update` their own document (`request.auth.uid == userId`). Only `isAdmin()` can `list` all users in the Admin Portal.
5. **Editorial Post Integrity (`/posts/{postId}`)**: Public visitors can read posts, but only `isAdmin()` can `create`, `update`, or `delete` posts. `authorId` and `createdAt` are immutable after creation.
6. **Cinema Machine 1-on-1 Isolation (`/cinemaChats/{chatId}` & `/cinemaChats/{chatId}/messages/{messageId}`)**:
   - `chatId` must match the owning user's `uid`.
   - Only the owning user (`request.auth.uid == chatId`) or `isAdmin()` can read or write to the chat thread or its messages.
   - Subcollection messages must verify parent `/cinemaChats/$(chatId)` existence on `get` and `create`, and validate `resource.data.chatOwnerId == request.auth.uid || isAdmin()` on `list` to prevent O(n) `get()` costs.
   - Regular users can only create messages with `senderRole == 'user'`; only admins can create messages with `senderRole == 'admin'`.
7. **YouTube Notes Isolation (`/userNotes/{noteId}`)**: Notes are strictly private to `resource.data.userId == request.auth.uid`.

## 2. The "Dirty Dozen" Payloads

1. **Shadow Field Injection on User Profile**: Creating `/users/u1` with an extra `{ "isAdmin": true }` field -> Rejected by `.keys().hasOnly(...)`.
2. **Unverified Admin Email Spoof**: User with `email: "priyam.dgp13@gmail.com"` and `email_verified: false` attempting to create a blog post -> Rejected by `isVerified()`.
3. **Horizontal PII Scraping**: Authenticated user `u2` attempting `get(/users/u1)` -> Rejected by `request.auth.uid == userId || isAdmin()`.
4. **Unauthorized User List**: Regular user `u1` attempting `list(/users)` -> Rejected by `isAdmin()`.
5. **Non-Admin Blog Post Creation**: Regular user `u1` attempting `create(/posts/p1)` -> Rejected by `isAdmin()`.
6. **Post Category Enum Bypass**: Admin attempting `create(/posts/p1)` with `category: "hacked"` -> Rejected by `isValidPost()`.
7. **Post Timestamp Forgery**: Admin attempting `create(/posts/p1)` with a past `createdAt` timestamp (`!= request.time`) -> Rejected by `incoming().createdAt == request.time`.
8. **Cross-User Cinema Chat Snooping**: User `u2` attempting `list(/cinemaChats/u1/messages)` -> Rejected by `resource.data.chatOwnerId == request.auth.uid || isAdmin()`.
9. **Orphaned Cinema Message Write**: User `u1` attempting `create(/cinemaChats/u1/messages/m1)` before `/cinemaChats/u1` exists -> Rejected by `exists(/databases/$(database)/documents/cinemaChats/$(chatId))`.
10. **Role Impersonation in Cinema Chat**: Regular user `u1` attempting `create(/cinemaChats/u1/messages/m1)` with `senderRole: "admin"` -> Rejected by role gate.
11. **Immutable Field Mutation on UserNote**: User `u1` attempting `update(/userNotes/n1)` to change `createdAt` or `userId` -> Rejected by immutability checks and `affectedKeys().hasOnly(...)`.
12. **ID Poisoning Attack**: Attempting to create a document with a 500-character ID or special characters -> Rejected by `isValidId()`.
