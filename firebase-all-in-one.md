# Firebase Layer — All Code in One File

Everything from the multi-file version, combined here for convenience.
When you actually build the app, split these back into separate files at
the paths shown in each header comment — Next.js/TypeScript expects that
structure (imports like `@/firebase/config` point to real files). This
version is just for easy reading/copying in one place.

---

## 1. Environment variables → `.env.local`

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCi_jSBVhMAMPe5ombV34IV8uzqDZw_JgY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=baladiya-d911d.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=baladiya-d911d
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=baladiya-d911d.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=481507584384
NEXT_PUBLIC_FIREBASE_APP_ID=1:481507584384:web:8fd95f261698003699b965
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-FWE7VNCFPJ
```

---

## 2. Types → `src/types/employee.ts`

```typescript
export type DocStatus = "valid" | "expiring_soon" | "expired";

export type UserRole =
  | "super_admin"
  | "gr_department"
  | "operations_manager"
  | "area_manager";

// Stored at users/{uid} in Firestore. Determines what an authenticated
// user is allowed to see/do, enforced both client-side (for UX) and in
// firestore.rules (for real security).
export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  operationManagerScope?: string[]; // for operations_manager
  areaManagerScope?: string[]; // for area_manager
  createdAt?: string;
  updatedAt?: string;
}

export interface Employee {
  employeeId: string; // also the Firestore document ID
  employeeName: string;
  storeId: string;
  storeName: string;
  areaManager: string;
  operationManager: string;
  mobile: string;
  position: string;
  company: string;
  nationality: string;
  passportNumber: string;

  iqamaNumber: string;
  iqamaExpiry: string; // ISO date string, e.g. "2026-09-01"
  iqamaDaysLeft: number; // derived
  iqamaStatus: DocStatus; // derived
  iqamaAvailable: boolean;

  baladiyaExpiry: string;
  baladiyaDaysLeft: number;
  baladiyaStatus: DocStatus;
  baladiyaCard: boolean;

  certificateExpiry: string;
  certificateDaysLeft: number;
  certificateStatus: DocStatus;

  medical: boolean;
  training: boolean;
  physicalCard: boolean;

  grAction: string;
  grUpdatedDate: string;

  photoUrl?: string;
  passportCopyUrl?: string;
  iqamaCopyUrl?: string;
  baladiyaCardUrl?: string;
  certificateUrl?: string;
  medicalReportUrl?: string;
  trainingCertificateUrl?: string;

  createdAt: string;
  updatedAt: string;
}

export type EmployeeInput = Omit<
  Employee,
  | "iqamaDaysLeft"
  | "iqamaStatus"
  | "baladiyaDaysLeft"
  | "baladiyaStatus"
  | "certificateDaysLeft"
  | "certificateStatus"
  | "createdAt"
  | "updatedAt"
>;

export interface EmployeeFilters {
  storeId?: string;
  areaManager?: string;
  operationManager?: string;
  company?: string;
  nationality?: string;
  position?: string;
  iqamaStatus?: DocStatus;
  baladiyaStatus?: DocStatus;
  certificateStatus?: DocStatus;
  medical?: boolean;
  training?: boolean;
  physicalCard?: boolean;
  searchTerm?: string;
}
```

---

## 3. Date/status helpers → `src/utils/dateCalculations.ts`

```typescript
import { DocStatus } from "@/types/employee";

export function calculateDaysLeft(expiryDate: string): number {
  if (!expiryDate) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffMs = expiry.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

// > 60 days -> valid | 1-60 days -> expiring_soon | <= 0 -> expired
export function calculateStatus(daysLeft: number): DocStatus {
  if (daysLeft <= 0) return "expired";
  if (daysLeft <= 60) return "expiring_soon";
  return "valid";
}

export function deriveExpiry(expiryDate: string): {
  daysLeft: number;
  status: DocStatus;
} {
  const daysLeft = calculateDaysLeft(expiryDate);
  return { daysLeft, status: calculateStatus(daysLeft) };
}

export const STATUS_COLORS: Record<DocStatus, string> = {
  valid: "#16a34a",
  expiring_soon: "#eab308",
  expired: "#dc2626",
};

export const STATUS_LABELS: Record<DocStatus, string> = {
  valid: "Valid",
  expiring_soon: "Expiring Soon",
  expired: "Expired",
};
```

---

## 4. Firebase init → `src/firebase/config.ts`

```typescript
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

export let analytics: Analytics | undefined;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) analytics = getAnalytics(app);
  });
}

export default app;
```

---

## 5. Auth service → `src/firebase/auth.ts`

```typescript
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./config";
import { UserProfile } from "@/types/employee";

export async function signIn(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

// Super Admin only — provisions the Firestore profile for a new user.
export async function createUserProfile(
  uid: string,
  email: string,
  role: UserProfile["role"],
  scope?: Pick<UserProfile, "operationManagerScope" | "areaManagerScope">
): Promise<void> {
  await setDoc(doc(db, "users", uid), {
    uid,
    email,
    role,
    ...scope,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
```

---

## 6. Auth React context → `src/context/AuthContext.tsx`

```typescript
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User } from "firebase/auth";
import { onAuthChange, getUserProfile } from "@/firebase/auth";
import { UserProfile } from "@/types/employee";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userProfile = await getUserProfile(firebaseUser.uid);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

---

## 7. Firestore service → `src/firebase/firestore.ts`

```typescript
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  QueryConstraint,
  serverTimestamp,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "./config";
import {
  Employee,
  EmployeeInput,
  EmployeeFilters,
  UserProfile,
} from "@/types/employee";
import { deriveExpiry } from "@/utils/dateCalculations";

const EMPLOYEES_COLLECTION = "employees";

function withDerivedFields(input: EmployeeInput) {
  const iqama = deriveExpiry(input.iqamaExpiry);
  const baladiya = deriveExpiry(input.baladiyaExpiry);
  const certificate = deriveExpiry(input.certificateExpiry);
  return {
    ...input,
    iqamaDaysLeft: iqama.daysLeft,
    iqamaStatus: iqama.status,
    baladiyaDaysLeft: baladiya.daysLeft,
    baladiyaStatus: baladiya.status,
    certificateDaysLeft: certificate.daysLeft,
    certificateStatus: certificate.status,
  };
}

export async function createEmployee(input: EmployeeInput): Promise<void> {
  const data = withDerivedFields(input);
  await setDoc(doc(db, EMPLOYEES_COLLECTION, input.employeeId), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateEmployee(
  employeeId: string,
  input: Partial<EmployeeInput>
): Promise<void> {
  const patch: Record<string, unknown> = { ...input };
  if (input.iqamaExpiry) {
    const d = deriveExpiry(input.iqamaExpiry);
    patch.iqamaDaysLeft = d.daysLeft;
    patch.iqamaStatus = d.status;
  }
  if (input.baladiyaExpiry) {
    const d = deriveExpiry(input.baladiyaExpiry);
    patch.baladiyaDaysLeft = d.daysLeft;
    patch.baladiyaStatus = d.status;
  }
  if (input.certificateExpiry) {
    const d = deriveExpiry(input.certificateExpiry);
    patch.certificateDaysLeft = d.daysLeft;
    patch.certificateStatus = d.status;
  }
  patch.updatedAt = serverTimestamp();

  await updateDoc(doc(db, EMPLOYEES_COLLECTION, employeeId), patch);
}

export async function deleteEmployee(employeeId: string): Promise<void> {
  await deleteDoc(doc(db, EMPLOYEES_COLLECTION, employeeId));
}

export async function duplicateEmployee(
  sourceEmployeeId: string,
  newEmployeeId: string
): Promise<void> {
  const snap = await getDoc(doc(db, EMPLOYEES_COLLECTION, sourceEmployeeId));
  if (!snap.exists()) throw new Error("Source employee not found");
  const data = snap.data() as Employee;
  await setDoc(doc(db, EMPLOYEES_COLLECTION, newEmployeeId), {
    ...data,
    employeeId: newEmployeeId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getEmployee(employeeId: string): Promise<Employee | null> {
  const snap = await getDoc(doc(db, EMPLOYEES_COLLECTION, employeeId));
  return snap.exists() ? (snap.data() as Employee) : null;
}

function scopeConstraintsForRole(profile: UserProfile): QueryConstraint[] {
  switch (profile.role) {
    case "super_admin":
    case "gr_department":
      return [];
    case "operations_manager":
      if (profile.operationManagerScope?.length) {
        return [where("operationManager", "in", profile.operationManagerScope)];
      }
      return [];
    case "area_manager":
      if (profile.areaManagerScope?.length) {
        return [where("areaManager", "in", profile.areaManagerScope)];
      }
      return [];
    default:
      return [];
  }
}

function filterConstraints(filters: EmployeeFilters): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];
  if (filters.storeId) constraints.push(where("storeId", "==", filters.storeId));
  if (filters.areaManager) constraints.push(where("areaManager", "==", filters.areaManager));
  if (filters.operationManager)
    constraints.push(where("operationManager", "==", filters.operationManager));
  if (filters.company) constraints.push(where("company", "==", filters.company));
  if (filters.nationality) constraints.push(where("nationality", "==", filters.nationality));
  if (filters.position) constraints.push(where("position", "==", filters.position));
  if (filters.iqamaStatus) constraints.push(where("iqamaStatus", "==", filters.iqamaStatus));
  if (filters.baladiyaStatus)
    constraints.push(where("baladiyaStatus", "==", filters.baladiyaStatus));
  if (filters.certificateStatus)
    constraints.push(where("certificateStatus", "==", filters.certificateStatus));
  if (filters.medical !== undefined) constraints.push(where("medical", "==", filters.medical));
  if (filters.training !== undefined) constraints.push(where("training", "==", filters.training));
  if (filters.physicalCard !== undefined)
    constraints.push(where("physicalCard", "==", filters.physicalCard));
  return constraints;
}

export function subscribeToEmployees(
  profile: UserProfile,
  filters: EmployeeFilters,
  callback: (employees: Employee[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const constraints: QueryConstraint[] = [
    ...scopeConstraintsForRole(profile),
    ...filterConstraints(filters),
    orderBy("employeeName"),
  ];

  const q = query(collection(db, EMPLOYEES_COLLECTION), ...constraints);

  return onSnapshot(
    q,
    (snapshot) => {
      let results = snapshot.docs.map((d) => d.data() as Employee);

      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        results = results.filter(
          (e) =>
            e.employeeName.toLowerCase().includes(term) ||
            e.employeeId.toLowerCase().includes(term) ||
            e.storeId.toLowerCase().includes(term) ||
            e.storeName.toLowerCase().includes(term) ||
            e.iqamaNumber.toLowerCase().includes(term) ||
            e.passportNumber.toLowerCase().includes(term) ||
            e.mobile.toLowerCase().includes(term)
        );
      }

      callback(results);
    },
    (error) => onError?.(error)
  );
}

export async function fetchEmployeesOnce(
  profile: UserProfile,
  filters: EmployeeFilters = {}
): Promise<Employee[]> {
  const constraints: QueryConstraint[] = [
    ...scopeConstraintsForRole(profile),
    ...filterConstraints(filters),
    orderBy("employeeName"),
  ];
  const snapshot = await getDocs(query(collection(db, EMPLOYEES_COLLECTION), ...constraints));
  return snapshot.docs.map((d) => d.data() as Employee);
}
```

---

## 8. Storage service → `src/firebase/storage.ts`

```typescript
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTaskSnapshot,
} from "firebase/storage";
import { storage } from "./config";

export type DocumentType =
  | "photo"
  | "passportCopy"
  | "iqamaCopy"
  | "baladiyaCard"
  | "certificate"
  | "medicalReport"
  | "trainingCertificate";

function buildPath(employeeId: string, docType: DocumentType, fileName: string) {
  return `employees/${employeeId}/${docType}/${fileName}`;
}

export function uploadEmployeeFile(
  employeeId: string,
  docType: DocumentType,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const path = buildPath(employeeId, docType, file.name);
  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot: UploadTaskSnapshot) => {
        const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(percent);
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      }
    );
  });
}

export async function deleteEmployeeFile(
  employeeId: string,
  docType: DocumentType,
  fileName: string
): Promise<void> {
  const path = buildPath(employeeId, docType, fileName);
  await deleteObject(ref(storage, path));
}
```

---

## 9. Firestore security rules → `firestore.rules`

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function userProfile() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function role() {
      return userProfile().role;
    }

    function isSuperAdmin() {
      return isSignedIn() && role() == 'super_admin';
    }

    function isGrDepartment() {
      return isSignedIn() && role() == 'gr_department';
    }

    function isOperationsManager() {
      return isSignedIn() && role() == 'operations_manager';
    }

    function isAreaManager() {
      return isSignedIn() && role() == 'area_manager';
    }

    function operationsInScope(employeeData) {
      return employeeData.operationManager in userProfile().operationManagerScope;
    }

    function areaInScope(employeeData) {
      return employeeData.areaManager in userProfile().areaManagerScope;
    }

    match /users/{uid} {
      allow read: if isSignedIn() && (request.auth.uid == uid || isSuperAdmin());
      allow write: if isSuperAdmin();
    }

    match /employees/{employeeId} {
      allow read: if isSuperAdmin()
        || isGrDepartment()
        || (isOperationsManager() && operationsInScope(resource.data))
        || (isAreaManager() && areaInScope(resource.data));

      allow create, update, delete: if isSuperAdmin() || isGrDepartment();
    }
  }
}
```

---

## 10. Storage security rules → `storage.rules`

```
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {

    function isSignedIn() {
      return request.auth != null;
    }

    function role() {
      return firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role;
    }

    match /employees/{employeeId}/{docType}/{fileName} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && (role() == 'super_admin' || role() == 'gr_department')
                   && request.resource.size < 10 * 1024 * 1024;
      allow delete: if isSignedIn() && (role() == 'super_admin' || role() == 'gr_department');
    }
  }
}
```

---

## 11. Firestore composite indexes → `firestore.indexes.json`

```json
{
  "indexes": [
    { "collectionGroup": "employees", "queryScope": "COLLECTION", "fields": [{ "fieldPath": "operationManager", "order": "ASCENDING" }, { "fieldPath": "employeeName", "order": "ASCENDING" }] },
    { "collectionGroup": "employees", "queryScope": "COLLECTION", "fields": [{ "fieldPath": "areaManager", "order": "ASCENDING" }, { "fieldPath": "employeeName", "order": "ASCENDING" }] },
    { "collectionGroup": "employees", "queryScope": "COLLECTION", "fields": [{ "fieldPath": "storeId", "order": "ASCENDING" }, { "fieldPath": "employeeName", "order": "ASCENDING" }] },
    { "collectionGroup": "employees", "queryScope": "COLLECTION", "fields": [{ "fieldPath": "iqamaStatus", "order": "ASCENDING" }, { "fieldPath": "employeeName", "order": "ASCENDING" }] },
    { "collectionGroup": "employees", "queryScope": "COLLECTION", "fields": [{ "fieldPath": "baladiyaStatus", "order": "ASCENDING" }, { "fieldPath": "employeeName", "order": "ASCENDING" }] },
    { "collectionGroup": "employees", "queryScope": "COLLECTION", "fields": [{ "fieldPath": "certificateStatus", "order": "ASCENDING" }, { "fieldPath": "employeeName", "order": "ASCENDING" }] },
    { "collectionGroup": "employees", "queryScope": "COLLECTION", "fields": [{ "fieldPath": "company", "order": "ASCENDING" }, { "fieldPath": "employeeName", "order": "ASCENDING" }] },
    { "collectionGroup": "employees", "queryScope": "COLLECTION", "fields": [{ "fieldPath": "nationality", "order": "ASCENDING" }, { "fieldPath": "employeeName", "order": "ASCENDING" }] }
  ],
  "fieldOverrides": []
}
```

---

## Setup steps (short version)

1. `npm install firebase react-hook-form`
2. Copy the env vars in section 1 into `.env.local` (and into Vercel's Environment Variables).
3. In Firebase Console (`baladiya-d911d`): enable Email/Password Auth, create Firestore in production mode, confirm the Storage bucket.
4. Manually create your first `users/{uid}` doc with `role: "super_admin"` (rules require this to exist before anything else works).
5. `firebase deploy --only firestore:rules,firestore:indexes,storage:rules`
6. Deploy to Vercel with the env vars set.

Full walkthrough with details is in the README from the previous message.
