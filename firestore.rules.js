rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /inventory/{itemId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth.token.email == 'admin@example.com';
    }
    
    match /jobs/{jobId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth.token.email == resource.data.issuedBy || request.auth.token.email == 'admin@example.com';
      allow delete: if request.auth.token.email == 'admin@example.com';
    }
    
    match /categories/{categoryId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth.token.email == 'admin@example.com';
    }
    
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth.token.email == 'admin@example.com';
    }
    
    match /settings/{documentId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.email == 'admin@example.com';
    }
    
    match /activity/{activityId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}