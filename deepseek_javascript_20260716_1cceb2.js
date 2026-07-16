// ============================================
// COMPLETE FIREBASE CONFIGURATION - ALL IN ONE
// ============================================

// Import Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp,
  writeBatch,
  arrayUnion,
  arrayRemove,
  increment,
  setDoc,
  DocumentReference,
  CollectionReference,
  Query,
  QuerySnapshot,
  DocumentSnapshot
} from "firebase/firestore";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  updatePassword,
  updateEmail,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "firebase/auth";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  uploadString,
  uploadBytesResumable,
  listAll,
  list,
  getMetadata,
  updateMetadata
} from "firebase/storage";

// ============================================
// FIREBASE CONFIGURATION
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyCi_jSBVhMAMPe5ombV34IV8uzqDZw_JgY",
  authDomain: "baladiya-d911d.firebaseapp.com",
  projectId: "baladiya-d911d",
  storageBucket: "baladiya-d911d.firebasestorage.app",
  messagingSenderId: "481507584384",
  appId: "1:481507584384:web:8fd95f261698003699b965",
  measurementId: "G-FWE7VNCFPJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// ============================================
// COLLECTIONS CONSTANTS
// ============================================

const COLLECTIONS = {
  USERS: 'users',
  STORES: 'stores',
  EMPLOYEES: 'employees',
  VISITS: 'visits',
  INVENTORY_VISITS: 'inventoryVisits',
  NIGHT_VISITS: 'nightVisits',
  EXPIRY_CHECKS: 'expiryChecks',
  WASTAGE: 'wastage',
  REPORTS: 'reports',
  NOTIFICATIONS: 'notifications'
};

// ============================================
// CORE FIREBASE SERVICE
// ============================================

class FirebaseService {
  // ---- CREATE ----
  async create(collectionName, data) {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { id: docRef.id, ...data };
    } catch (error) {
      console.error(`Error creating in ${collectionName}:`, error);
      throw error;
    }
  }

  // ---- READ ----
  async get(collectionName, docId) {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error(`Error getting from ${collectionName}:`, error);
      throw error;
    }
  }

  async getAll(collectionName) {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Error getting all from ${collectionName}:`, error);
      throw error;
    }
  }

  // ---- UPDATE ----
  async update(collectionName, docId, data) {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      return { id: docId, ...data };
    } catch (error) {
      console.error(`Error updating in ${collectionName}:`, error);
      throw error;
    }
  }

  // ---- DELETE ----
  async delete(collectionName, docId) {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      return { id: docId, deleted: true };
    } catch (error) {
      console.error(`Error deleting from ${collectionName}:`, error);
      throw error;
    }
  }

  // ---- QUERY ----
  async query(collectionName, conditions = [], orderByField = null, orderDirection = 'asc', limitCount = null) {
    try {
      let q = collection(db, collectionName);
      
      conditions.forEach(condition => {
        q = query(q, where(condition.field, condition.operator, condition.value));
      });
      
      if (orderByField) {
        q = query(q, orderBy(orderByField, orderDirection));
      }
      
      if (limitCount) {
        q = query(q, limit(limitCount));
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Error querying ${collectionName}:`, error);
      throw error;
    }
  }

  // ---- REAL-TIME LISTENER ----
  listen(collectionName, callback, conditions = []) {
    let q = collection(db, collectionName);
    
    conditions.forEach(condition => {
      q = query(q, where(condition.field, condition.operator, condition.value));
    });
    
    return onSnapshot(q, (snapshot) => {
      const documents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(documents);
    }, (error) => {
      console.error(`Error listening to ${collectionName}:`, error);
    });
  }

  // ---- BATCH OPERATIONS ----
  async batch(operations) {
    try {
      const batch = writeBatch(db);
      
      operations.forEach(op => {
        const docRef = doc(db, op.collection, op.id || undefined);
        if (op.type === 'set') {
          batch.set(docRef, op.data);
        } else if (op.type === 'update') {
          batch.update(docRef, op.data);
        } else if (op.type === 'delete') {
          batch.delete(docRef);
        }
      });
      
      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error('Batch operation error:', error);
      throw error;
    }
  }

  // ---- SET WITH CUSTOM ID ----
  async set(collectionName, docId, data) {
    try {
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { id: docId, ...data };
    } catch (error) {
      console.error(`Error setting in ${collectionName}:`, error);
      throw error;
    }
  }

  // ---- INCREMENT VALUE ----
  async increment(collectionName, docId, field, value = 1) {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        [field]: increment(value),
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error(`Error incrementing in ${collectionName}:`, error);
      throw error;
    }
  }

  // ---- ARRAY OPERATIONS ----
  async arrayAdd(collectionName, docId, field, value) {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        [field]: arrayUnion(value),
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error(`Error adding to array in ${collectionName}:`, error);
      throw error;
    }
  }

  async arrayRemove(collectionName, docId, field, value) {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        [field]: arrayRemove(value),
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error(`Error removing from array in ${collectionName}:`, error);
      throw error;
    }
  }
}

const firebaseService = new FirebaseService();

// ============================================
// COLLECTION SERVICES
// ============================================

// ---- USERS SERVICE ----
const UserService = {
  create: (data) => firebaseService.create(COLLECTIONS.USERS, data),
  get: (id) => firebaseService.get(COLLECTIONS.USERS, id),
  getAll: () => firebaseService.getAll(COLLECTIONS.USERS),
  update: (id, data) => firebaseService.update(COLLECTIONS.USERS, id, data),
  delete: (id) => firebaseService.delete(COLLECTIONS.USERS, id),
  query: (conditions) => firebaseService.query(COLLECTIONS.USERS, conditions),
  listen: (callback, conditions) => firebaseService.listen(COLLECTIONS.USERS, callback, conditions),
  getByRole: (role) => firebaseService.query(COLLECTIONS.USERS, [{ field: 'role', operator: '==', value: role }]),
  getByStore: (storeId) => firebaseService.query(COLLECTIONS.USERS, [{ field: 'storeId', operator: '==', value: storeId }]),
  getActive: () => firebaseService.query(COLLECTIONS.USERS, [{ field: 'status', operator: '==', value: 'active' }]),
  updateStatus: (id, status) => firebaseService.update(COLLECTIONS.USERS, id, { status }),
  updateLastLogin: (id) => firebaseService.update(COLLECTIONS.USERS, id, { lastLogin: new Date().toISOString() })
};

// ---- STORES SERVICE ----
const StoreService = {
  create: (data) => firebaseService.create(COLLECTIONS.STORES, data),
  get: (id) => firebaseService.get(COLLECTIONS.STORES, id),
  getAll: () => firebaseService.getAll(COLLECTIONS.STORES),
  update: (id, data) => firebaseService.update(COLLECTIONS.STORES, id, data),
  delete: (id) => firebaseService.delete(COLLECTIONS.STORES, id),
  query: (conditions) => firebaseService.query(COLLECTIONS.STORES, conditions),
  listen: (callback, conditions) => firebaseService.listen(COLLECTIONS.STORES, callback, conditions),
  getActive: () => firebaseService.query(COLLECTIONS.STORES, [{ field: 'status', operator: '==', value: 'active' }]),
  getByCity: (city) => firebaseService.query(COLLECTIONS.STORES, [{ field: 'city', operator: '==', value: city }]),
  updateStatus: (id, status) => firebaseService.update(COLLECTIONS.STORES, id, { status }),
  incrementVisits: (id) => firebaseService.increment(COLLECTIONS.STORES, id, 'totalVisits')
};

// ---- EMPLOYEES SERVICE ----
const EmployeeService = {
  create: (data) => firebaseService.create(COLLECTIONS.EMPLOYEES, data),
  get: (id) => firebaseService.get(COLLECTIONS.EMPLOYEES, id),
  getAll: () => firebaseService.getAll(COLLECTIONS.EMPLOYEES),
  update: (id, data) => firebaseService.update(COLLECTIONS.EMPLOYEES, id, data),
  delete: (id) => firebaseService.delete(COLLECTIONS.EMPLOYEES, id),
  query: (conditions) => firebaseService.query(COLLECTIONS.EMPLOYEES, conditions),
  listen: (callback, conditions) => firebaseService.listen(COLLECTIONS.EMPLOYEES, callback, conditions),
  getByStore: (storeId) => firebaseService.query(COLLECTIONS.EMPLOYEES, [{ field: 'storeId', operator: '==', value: storeId }]),
  getActive: () => firebaseService.query(COLLECTIONS.EMPLOYEES, [{ field: 'status', operator: '==', value: 'active' }]),
  getByRole: (role) => firebaseService.query(COLLECTIONS.EMPLOYEES, [{ field: 'role', operator: '==', value: role }]),
  updateStatus: (id, status) => firebaseService.update(COLLECTIONS.EMPLOYEES, id, { status })
};

// ---- VISITS SERVICE ----
const VisitService = {
  create: (data) => firebaseService.create(COLLECTIONS.VISITS, data),
  get: (id) => firebaseService.get(COLLECTIONS.VISITS, id),
  getAll: () => firebaseService.getAll(COLLECTIONS.VISITS),
  update: (id, data) => firebaseService.update(COLLECTIONS.VISITS, id, data),
  delete: (id) => firebaseService.delete(COLLECTIONS.VISITS, id),
  query: (conditions) => firebaseService.query(COLLECTIONS.VISITS, conditions),
  listen: (callback, conditions) => firebaseService.listen(COLLECTIONS.VISITS, callback, conditions),
  getByStore: (storeId) => firebaseService.query(COLLECTIONS.VISITS, [{ field: 'storeId', operator: '==', value: storeId }]),
  getByDate: (date) => firebaseService.query(COLLECTIONS.VISITS, [{ field: 'visitDate', operator: '==', value: date }]),
  getByDateRange: (startDate, endDate) => firebaseService.query(COLLECTIONS.VISITS, [
    { field: 'visitDate', operator: '>=', value: startDate },
    { field: 'visitDate', operator: '<=', value: endDate }
  ]),
  getByEmployee: (employeeId) => firebaseService.query(COLLECTIONS.VISITS, [{ field: 'employeeId', operator: '==', value: employeeId }]),
  getCompleted: () => firebaseService.query(COLLECTIONS.VISITS, [{ field: 'status', operator: '==', value: 'completed' }]),
  updateStatus: (id, status) => firebaseService.update(COLLECTIONS.VISITS, id, { status })
};

// ---- INVENTORY VISITS SERVICE ----
const InventoryVisitService = {
  create: (data) => firebaseService.create(COLLECTIONS.INVENTORY_VISITS, data),
  get: (id) => firebaseService.get(COLLECTIONS.INVENTORY_VISITS, id),
  getAll: () => firebaseService.getAll(COLLECTIONS.INVENTORY_VISITS),
  update: (id, data) => firebaseService.update(COLLECTIONS.INVENTORY_VISITS, id, data),
  delete: (id) => firebaseService.delete(COLLECTIONS.INVENTORY_VISITS, id),
  query: (conditions) => firebaseService.query(COLLECTIONS.INVENTORY_VISITS, conditions),
  listen: (callback, conditions) => firebaseService.listen(COLLECTIONS.INVENTORY_VISITS, callback, conditions),
  getByStore: (storeId) => firebaseService.query(COLLECTIONS.INVENTORY_VISITS, [{ field: 'storeId', operator: '==', value: storeId }]),
  getByDate: (date) => firebaseService.query(COLLECTIONS.INVENTORY_VISITS, [{ field: 'visitDate', operator: '==', value: date }]),
  getByProduct: (productId) => firebaseService.query(COLLECTIONS.INVENTORY_VISITS, [{ field: 'productId', operator: '==', value: productId }]),
  getLowStock: (threshold) => firebaseService.query(COLLECTIONS.INVENTORY_VISITS, [
    { field: 'quantity', operator: '<=', value: threshold }
  ])
};

// ---- NIGHT VISITS SERVICE ----
const NightVisitService = {
  create: (data) => firebaseService.create(COLLECTIONS.NIGHT_VISITS, data),
  get: (id) => firebaseService.get(COLLECTIONS.NIGHT_VISITS, id),
  getAll: () => firebaseService.getAll(COLLECTIONS.NIGHT_VISITS),
  update: (id, data) => firebaseService.update(COLLECTIONS.NIGHT_VISITS, id, data),
  delete: (id) => firebaseService.delete(COLLECTIONS.NIGHT_VISITS, id),
  query: (conditions) => firebaseService.query(COLLECTIONS.NIGHT_VISITS, conditions),
  listen: (callback, conditions) => firebaseService.listen(COLLECTIONS.NIGHT_VISITS, callback, conditions),
  getByStore: (storeId) => firebaseService.query(COLLECTIONS.NIGHT_VISITS, [{ field: 'storeId', operator: '==', value: storeId }]),
  getByDate: (date) => firebaseService.query(COLLECTIONS.NIGHT_VISITS, [{ field: 'visitDate', operator: '==', value: date }]),
  getByGuard: (guardId) => firebaseService.query(COLLECTIONS.NIGHT_VISITS, [{ field: 'guardId', operator: '==', value: guardId }])
};

// ---- EXPIRY CHECKS SERVICE ----
const ExpiryCheckService = {
  create: (data) => firebaseService.create(COLLECTIONS.EXPIRY_CHECKS, data),
  get: (id) => firebaseService.get(COLLECTIONS.EXPIRY_CHECKS, id),
  getAll: () => firebaseService.getAll(COLLECTIONS.EXPIRY_CHECKS),
  update: (id, data) => firebaseService.update(COLLECTIONS.EXPIRY_CHECKS, id, data),
  delete: (id) => firebaseService.delete(COLLECTIONS.EXPIRY_CHECKS, id),
  query: (conditions) => firebaseService.query(COLLECTIONS.EXPIRY_CHECKS, conditions),
  listen: (callback, conditions) => firebaseService.listen(COLLECTIONS.EXPIRY_CHECKS, callback, conditions),
  getByStore: (storeId) => firebaseService.query(COLLECTIONS.EXPIRY_CHECKS, [{ field: 'storeId', operator: '==', value: storeId }]),
  getExpiringSoon: (days = 30) => {
    const today = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);
    return firebaseService.query(COLLECTIONS.EXPIRY_CHECKS, [
      { field: 'expiryDate', operator: '>=', value: today.toISOString().split('T')[0] },
      { field: 'expiryDate', operator: '<=', value: future.toISOString().split('T')[0] }
    ]);
  },
  getExpired: () => {
    const today = new Date().toISOString().split('T')[0];
    return firebaseService.query(COLLECTIONS.EXPIRY_CHECKS, [
      { field: 'expiryDate', operator: '<', value: today }
    ]);
  },
  getByProduct: (productId) => firebaseService.query(COLLECTIONS.EXPIRY_CHECKS, [{ field: 'productId', operator: '==', value: productId }])
};

// ---- WASTAGE SERVICE ----
const WastageService = {
  create: (data) => firebaseService.create(COLLECTIONS.WASTAGE, data),
  get: (id) => firebaseService.get(COLLECTIONS.WASTAGE, id),
  getAll: () => firebaseService.getAll(COLLECTIONS.WASTAGE),
  update: (id, data) => firebaseService.update(COLLECTIONS.WASTAGE, id, data),
  delete: (id) => firebaseService.delete(COLLECTIONS.WASTAGE, id),
  query: (conditions) => firebaseService.query(COLLECTIONS.WASTAGE, conditions),
  listen: (callback, conditions) => firebaseService.listen(COLLECTIONS.WASTAGE, callback, conditions),
  getByStore: (storeId) => firebaseService.query(COLLECTIONS.WASTAGE, [{ field: 'storeId', operator: '==', value: storeId }]),
  getByDateRange: (startDate, endDate) => firebaseService.query(COLLECTIONS.WASTAGE, [
    { field: 'date', operator: '>=', value: startDate },
    { field: 'date', operator: '<=', value: endDate }
  ]),
  getByCategory: (category) => firebaseService.query(COLLECTIONS.WASTAGE, [{ field: 'category', operator: '==', value: category }]),
  getTotalWastage: async (storeId) => {
    const data = await firebaseService.query(COLLECTIONS.WASTAGE, [
      { field: 'storeId', operator: '==', value: storeId }
    ]);
    return data.reduce((total, item) => total + (item.quantity || 0), 0);
  }
};

// ---- REPORTS SERVICE ----
const ReportService = {
  create: (data) => firebaseService.create(COLLECTIONS.REPORTS, data),
  get: (id) => firebaseService.get(COLLECTIONS.REPORTS, id),
  getAll: () => firebaseService.getAll(COLLECTIONS.REPORTS),
  update: (id, data) => firebaseService.update(COLLECTIONS.REPORTS, id, data),
  delete: (id) => firebaseService.delete(COLLECTIONS.REPORTS, id),
  query: (conditions) => firebaseService.query(COLLECTIONS.REPORTS, conditions),
  listen: (callback, conditions) => firebaseService.listen(COLLECTIONS.REPORTS, callback, conditions),
  getByType: (type) => firebaseService.query(COLLECTIONS.REPORTS, [{ field: 'type', operator: '==', value: type }]),
  getByDateRange: (startDate, endDate) => firebaseService.query(COLLECTIONS.REPORTS, [
    { field: 'createdAt', operator: '>=', value: startDate },
    { field: 'createdAt', operator: '<=', value: endDate }
  ]),
  getByStore: (storeId) => firebaseService.query(COLLECTIONS.REPORTS, [{ field: 'storeId', operator: '==', value: storeId }]),
  getByStatus: (status) => firebaseService.query(COLLECTIONS.REPORTS, [{ field: 'status', operator: '==', value: status }])
};

// ---- NOTIFICATIONS SERVICE ----
const NotificationService = {
  create: (data) => firebaseService.create(COLLECTIONS.NOTIFICATIONS, data),
  get: (id) => firebaseService.get(COLLECTIONS.NOTIFICATIONS, id),
  getAll: () => firebaseService.getAll(COLLECTIONS.NOTIFICATIONS),
  update: (id, data) => firebaseService.update(COLLECTIONS.NOTIFICATIONS, id, data),
  delete: (id) => firebaseService.delete(COLLECTIONS.NOTIFICATIONS, id),
  query: (conditions) => firebaseService.query(COLLECTIONS.NOTIFICATIONS, conditions),
  listen: (callback, conditions) => firebaseService.listen(COLLECTIONS.NOTIFICATIONS, callback, conditions),
  getByUser: (userId) => firebaseService.query(COLLECTIONS.NOTIFICATIONS, [{ field: 'userId', operator: '==', value: userId }]),
  getUnread: (userId) => firebaseService.query(COLLECTIONS.NOTIFICATIONS, [
    { field: 'userId', operator: '==', value: userId },
    { field: 'read', operator: '==', value: false }
  ]),
  getByType: (type) => firebaseService.query(COLLECTIONS.NOTIFICATIONS, [{ field: 'type', operator: '==', value: type }]),
  markAsRead: (id) => firebaseService.update(COLLECTIONS.NOTIFICATIONS, id, { read: true }),
  markAllAsRead: async (userId) => {
    const notifications = await firebaseService.query(COLLECTIONS.NOTIFICATIONS, [
      { field: 'userId', operator: '==', value: userId },
      { field: 'read', operator: '==', value: false }
    ]);
    const batch = notifications.map(notif => ({
      collection: COLLECTIONS.NOTIFICATIONS,
      id: notif.id,
      type: 'update',
      data: { read: true }
    }));
    return firebaseService.batch(batch);
  }
};

// ============================================
// AUTH SERVICE
// ============================================

const AuthService = {
  // Email/Password Auth
  register: async (email, password, displayName = '') => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
      // Send verification email
      await sendEmailVerification(userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  login: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  resetPassword: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },

  sendVerificationEmail: async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await sendEmailVerification(user);
      }
    } catch (error) {
      console.error('Send verification error:', error);
      throw error;
    }
  },

  // Google Auth
  signInWithGoogle: async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  },

  signInWithGoogleRedirect: async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error('Google redirect error:', error);
      throw error;
    }
  },

  getRedirectResult: async () => {
    try {
      const result = await getRedirectResult(auth);
      if (result) {
        return result.user;
      }
      return null;
    } catch (error) {
      console.error('Get redirect result error:', error);
      throw error;
    }
  },

  // Account Management
  updateProfile: async (displayName, photoURL) => {
    try {
      const user = auth.currentUser;
      if (user) {
        await updateProfile(user, { displayName, photoURL });
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  updatePassword: async (newPassword) => {
    try {
      const user = auth.currentUser;
      if (user) {
        await updatePassword(user, newPassword);
      }
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  },

  updateEmail: async (newEmail) => {
    try {
      const user = auth.currentUser;
      if (user) {
        await updateEmail(user, newEmail);
        await sendEmailVerification(user);
      }
    } catch (error) {
      console.error('Update email error:', error);
      throw error;
    }
  },

  reauthenticate: async (email, password) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const credential = EmailAuthProvider.credential(email, password);
        await reauthenticateWithCredential(user, credential);
      }
    } catch (error) {
      console.error('Reauthenticate error:', error);
      throw error;
    }
  },

  deleteAccount: async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await deleteUser(user);
      }
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  },

  // Auth State
  onAuthStateChange: (callback) => {
    return onAuthStateChanged(auth, callback);
  },

  getCurrentUser: () => auth.currentUser,

  isAuthenticated: () => !!auth.currentUser,

  getIdToken: async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        return await user.getIdToken();
      }
      return null;
    } catch (error) {
      console.error('Get ID token error:', error);
      throw error;
    }
  }
};

// ============================================
// STORAGE SERVICE
// ============================================

const StorageService = {
  // Upload file
  uploadFile: async (path, file) => {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return { url: downloadURL, metadata: snapshot.metadata };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },

  // Upload with progress
  uploadFileWithProgress: (path, file, onProgress) => {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => reject(error),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ 
            url: downloadURL, 
            metadata: uploadTask.snapshot.metadata 
          });
        }
      );
    });
  },

  // Upload string (base64, text, etc.)
  uploadString: async (path, string, format = 'raw') => {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadString(storageRef, string, format);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return { url: downloadURL, metadata: snapshot.metadata };
    } catch (error) {
      console.error('Upload string error:', error);
      throw error;
    }
  },

  // Get download URL
  getDownloadURL: async (path) => {
    try {
      const storageRef = ref(storage, path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Get download URL error:', error);
      throw error;
    }
  },

  // Delete file
  deleteFile: async (path) => {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Delete file error:', error);
      throw error;
    }
  },

  // Get metadata
  getMetadata: async (path) => {
    try {
      const storageRef = ref(storage, path);
      return await getMetadata(storageRef);
    } catch (error) {
      console.error('Get metadata error:', error);
      throw error;
    }
  },

  // Update metadata
  updateMetadata: async (path, metadata) => {
    try {
      const storageRef = ref(storage, path);
      return await updateMetadata(storageRef, metadata);
    } catch (error) {
      console.error('Update metadata error:', error);
      throw error;
    }
  },

  // List files
  listFiles: async (path, maxResults = 100) => {
    try {
      const storageRef = ref(storage, path);
      const result = await list(storageRef, { maxResults });
      return {
        items: result.items.map(item => item.name),
        prefixes: result.prefixes.map(prefix => prefix.name)
      };
    } catch (error) {
      console.error('List files error:', error);
      throw error;
    }
  },

  // List all files
  listAllFiles: async (path) => {
    try {
      const storageRef = ref(storage, path);
      const result = await listAll(storageRef);
      return {
        items: result.items.map(item => item.name),
        prefixes: result.prefixes.map(prefix => prefix.name)
      };
    } catch (error) {
      console.error('List all files error:', error);
      throw error;
    }
  },

  // Upload image with compression (simple version - you'd need a library for actual compression)
  uploadImage: async (path, file) => {
    // You can add image compression here using a library like 'browser-image-compression'
    return await StorageService.uploadFile(path, file);
  },

  // Generate unique file path
  generateFilePath: (folder, fileName) => {
    const timestamp = new Date().getTime();
    const extension = fileName.split('.').pop();
    const name = fileName.split('.').slice(0, -1).join('.');
    return `${folder}/${name}_${timestamp}.${extension}`;
  }
};

// ============================================
// EXPORT ALL SERVICES
// ============================================

export {
  // Core
  app,
  db,
  auth,
  storage,
  analytics,
  COLLECTIONS,
  firebaseService as FirebaseService,
  
  // Collection Services
  UserService,
  StoreService,
  EmployeeService,
  VisitService,
  InventoryVisitService,
  NightVisitService,
  ExpiryCheckService,
  WastageService,
  ReportService,
  NotificationService,
  
  // Auth & Storage
  AuthService,
  StorageService
};

// Default export
export default {
  app,
  db,
  auth,
  storage,
  analytics,
  COLLECTIONS,
  FirebaseService: firebaseService,
  UserService,
  StoreService,
  EmployeeService,
  VisitService,
  InventoryVisitService,
  NightVisitService,
  ExpiryCheckService,
  WastageService,
  ReportService,
  NotificationService,
  AuthService,
  StorageService
};