import { Directive, inject, Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
  UserCredential,
} from '@angular/fire/auth';
import { User } from '../models/user.model';
import {
  doc,
  Firestore,
  getDoc,
  setDoc,
  addDoc,
  collection,
  collectionData,
  query,
  updateDoc,
  deleteDoc,
  QueryConstraint,
  orderBy,
  limit,
} from '@angular/fire/firestore';
import { UnsubscriptionError } from 'rxjs';
import { deleteObject, uploadString } from '@firebase/storage';
import { getDownloadURL, ref, Storage } from '@angular/fire/storage';
import { QueryOptions } from './query-options.interface';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  auth = inject(Auth);
  firestore = inject(Firestore);
  storage = inject(Storage);

  constructor() {}

  signIn(user: User): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.auth, user.email, user.password);
  }

  signUp(user: User): Promise<UserCredential> {
    return createUserWithEmailAndPassword(this.auth, user.email, user.password);
  }

  async signOut() {
    await this.auth.signOut();
    localStorage.removeItem('user');
    window.location.reload();
  }

  async updateUser(displayName: string) {
    const user = await this.auth.currentUser;
    if (user) {
      // Actualiza el perfil del usuario
      await updateProfile(user, { displayName: displayName });
    }
  }

  setDocument(path: string, data: any) {
    return setDoc(doc(this.firestore, path), data);
  }

  addDocument(path: string, data: any) {
    return addDoc(collection(this.firestore, path), data);
  }

  updateDocument(path: string, data: any) {
    return updateDoc(doc(this.firestore, path), data);
  }

  deleteDocument(path: string) {
    return deleteDoc(doc(this.firestore, path));
  }

  async getDocument(path: string) {
    const docSnap = await getDoc(doc(this.firestore, path));
    return docSnap.data();
  }

  buildQueryConstraints(options?: QueryOptions): QueryConstraint[] {
    const constraints: QueryConstraint[] = [];
    if (options?.orderBy) {
      constraints.push(
        orderBy(options?.orderBy.field, options?.orderBy.direction)
      );
    }

    if (options?.limit) {
      constraints.push(limit(options?.limit));
    }

    return constraints;
  }

  async getCollectionData(path: string, collectionQuery?: QueryOptions) {
    const ref = collection(this.firestore, path);
    const constraints = this.buildQueryConstraints(collectionQuery);
    return collectionData(query(ref, ...constraints), { idField: 'id' });
  }

  sendRecoveryEmail(email: string) {
    return sendPasswordResetEmail(this.auth, email);
  }

  async isAuthenticated() {
    const userExists: boolean = await new Promise((resolve) => {
      const unsubscribe = this.auth.onAuthStateChanged((user) => {
        unsubscribe();
        if (user) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
    return userExists;
  }

  async uploadImage(path: string, imageDataUrl: string) {
    return uploadString(ref(this.storage, path), imageDataUrl, 'data_url').then(
      () => {
        return getDownloadURL(ref(this.storage, path));
      }
    );
  }

  async getFilePath(url: string) {
    return ref(this.storage, url).fullPath;
  }

  async deleteFile(path: string) {
    return deleteObject(ref(this.storage, path));
  }
}
