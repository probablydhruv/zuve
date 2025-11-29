import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  addDoc,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore'
import { db } from './firebaseClient'
import { TierType } from './usageTracker'

// User profile type
export type UserProfile = {
  uid: string
  email: string
  displayName?: string
  tier: TierType  // 'free' | 'plus' | 'pro' | 'max'
  subscriptionId?: string
  subscriptionStatus?: 'active' | 'cancelled' | 'past_due' | 'trialing'
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

// Project types
export type Project = {
  id: string
  userId: string
  name: string
  description?: string
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export type CanvasData = {
  lines: any[]
  images: any[]
  layers: any[]
  zoom: number
  canvasSize: { width: number; height: number }
  generatedImages?: string[] // Array of generated/harmonized image URLs
  insertedMotifs?: any[] // Array of motifs inserted on the canvas
  motifLayerMap?: { [motifId: string]: string } // Mapping of motif IDs to layer IDs
  updatedAt: Timestamp | Date
}

// Motif type
export type Motif = {
  id: string
  name: string
  data: string // JSON stringified drawing lines
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

// User profile helpers - now reading from user document directly
export const userProfileDoc = (userId: string) =>
  doc(db, 'users', userId)

// Projects collection helpers
export const projectsCollection = (userId: string) => 
  collection(db, 'users', userId, 'projects')

export const projectDoc = (userId: string, projectId: string) =>
  doc(db, 'users', userId, 'projects', projectId)

export const canvasDoc = (userId: string, projectId: string) =>
  doc(db, 'users', userId, 'projects', projectId, 'canvas', 'data')

// Motifs collection helpers (user-based, not project-based)
export const motifsCollection = (userId: string) =>
  collection(db, 'users', userId, 'motifs')

export const motifDoc = (userId: string, motifId: string) =>
  doc(db, 'users', userId, 'motifs', motifId)

// ==================== User Profile Functions ====================

// Get user profile - reads from user document directly
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) return null
  
  try {
    const profileRef = userProfileDoc(userId)
    const profileSnap = await getDoc(profileRef)
    
    if (!profileSnap.exists()) {
      // User document doesn't exist yet - will be created on first login
      console.log('User document not found, will create on demand')
      return null
    }
    
    const data = profileSnap.data()
    // Ensure tier exists, default to 'free' if missing
    const tier = (data.tier || 'free') as TierType
    
    return {
      uid: userId,
      email: data.email || '',
      displayName: data.displayName || '',
      tier: tier,
      subscriptionId: data.subscriptionId,
      subscriptionStatus: data.subscriptionStatus,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as UserProfile
  } catch (error: any) {
    console.error('Error fetching user profile:', error)
    if (error?.code === 'unavailable') {
      console.warn('Firestore is unavailable, returning null')
      return null
    }
    return null
  }
}

// Create user profile - writes to user document directly
export async function createUserProfile(
  userId: string, 
  data: { tier: TierType; email?: string; displayName?: string }
): Promise<UserProfile> {
  if (!userId) throw new Error('User ID is required')
  
  try {
    const profileRef = userProfileDoc(userId)
    const newProfile = {
      uid: userId,
      email: data.email || '',
      displayName: data.displayName || '',
      tier: data.tier || 'free',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    
    // Use merge: true to preserve existing fields (like photoURL, etc.)
    await setDoc(profileRef, newProfile, { merge: true })
    console.log('User profile created/updated:', userId, 'tier:', data.tier)
    
    return {
      ...newProfile,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as UserProfile
  } catch (error) {
    console.error('Error creating user profile:', error)
    throw error
  }
}

// Update user tier
export async function updateUserTier(userId: string, tier: TierType): Promise<void> {
  if (!userId) throw new Error('User ID is required')
  
  try {
    const profileRef = userProfileDoc(userId)
    await updateDoc(profileRef, {
      tier,
      updatedAt: serverTimestamp(),
    })
    console.log('User tier updated:', userId, 'new tier:', tier)
  } catch (error) {
    console.error('Error updating user tier:', error)
    throw error
  }
}

// Update subscription info (when user purchases)
export async function updateUserSubscription(
  userId: string, 
  tier: TierType,
  subscriptionId: string,
  subscriptionStatus: 'active' | 'cancelled' | 'past_due' | 'trialing'
): Promise<void> {
  if (!userId) throw new Error('User ID is required')
  
  try {
    const profileRef = userProfileDoc(userId)
    await updateDoc(profileRef, {
      tier,
      subscriptionId,
      subscriptionStatus,
      updatedAt: serverTimestamp(),
    })
    console.log('User subscription updated:', userId, tier, subscriptionStatus)
  } catch (error) {
    console.error('Error updating user subscription:', error)
    throw error
  }
}

// ==================== Project Functions ====================

// Get all projects for a user
export async function getUserProjects(userId: string): Promise<Project[]> {
  if (!userId) return []
  
  try {
    console.log('Fetching projects for user:', userId)
    const startTime = Date.now()
    
    const q = query(projectsCollection(userId))
    const querySnapshot = await getDocs(q)
    
    const duration = Date.now() - startTime
    console.log(`Projects fetched in ${duration}ms, count: ${querySnapshot.docs.length}`)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Project[]
  } catch (error: any) {
    console.error('Error fetching user projects:', error)
    console.error('Error details:', {
      code: error?.code,
      message: error?.message,
      name: error?.name
    })
    
    // Only return empty array for truly offline scenarios
    // Don't silently fail for permission errors
    if (error?.code === 'unavailable') {
      console.warn('Firestore is unavailable, returning empty array')
      return []
    }
    
    // Re-throw permission errors so UI can handle them
    if (error?.code === 'permission-denied') {
      throw new Error('Permission denied: Check Firestore Security Rules')
    }
    
    return []
  }
}

// Get a single project
export async function getProject(userId: string, projectId: string): Promise<Project | null> {
  if (!userId || !projectId) return null
  
  try {
    const projectRef = projectDoc(userId, projectId)
    const projectSnap = await getDoc(projectRef)
    
    if (!projectSnap.exists()) return null
    
    const data = projectSnap.data()
    return {
      id: projectSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Project
  } catch (error: any) {
    // Handle offline errors gracefully
    if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
      console.warn('Firestore is offline, returning null')
      return null
    }
    console.error('Error fetching project:', error)
    return null
  }
}

// Create a new project
export async function createProject(
  userId: string, 
  projectData: Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  if (!userId) throw new Error('User ID is required')
  
  try {
    console.log('Creating project for user:', userId, projectData)
    const newProject = {
      ...projectData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    
    const docRef = await addDoc(projectsCollection(userId), newProject)
    console.log('Project created successfully, ID:', docRef.id)
    return docRef.id
  } catch (error: any) {
    console.error('Error creating project:', error)
    console.error('Error details:', {
      code: error?.code,
      message: error?.message,
      name: error?.name
    })
    
    if (error?.code === 'permission-denied') {
      throw new Error('Permission denied: Check Firestore Security Rules')
    }
    
    throw error
  }
}

// Update a project
export async function updateProject(
  userId: string,
  projectId: string,
  updates: Partial<Omit<Project, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  if (!userId || !projectId) throw new Error('User ID and Project ID are required')
  
  try {
    const projectRef = projectDoc(userId, projectId)
    await updateDoc(projectRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error updating project:', error)
    throw error
  }
}

// Delete a project and its subcollections
export async function deleteProject(userId: string, projectId: string): Promise<void> {
  if (!userId || !projectId) {
    throw new Error('User ID and Project ID are required')
  }
  
  console.log('Deleting project:', { userId, projectId })
  
  try {
    const projectRef = projectDoc(userId, projectId)
    
    // Verify project exists before deleting
    const projectSnap = await getDoc(projectRef)
    if (!projectSnap.exists()) {
      throw new Error('Project not found')
    }
    
    // Try to delete canvas data first (non-blocking)
    const canvasRef = canvasDoc(userId, projectId)
    try {
      const canvasSnap = await getDoc(canvasRef)
      if (canvasSnap.exists()) {
        console.log('Deleting canvas data...')
        await deleteDoc(canvasRef)
        console.log('Canvas data deleted')
      }
    } catch (canvasError: any) {
      console.warn('Error deleting canvas data (continuing with project deletion):', canvasError)
      // Continue with project deletion even if canvas deletion fails
    }
    
    // Delete the project document
    console.log('Deleting project document...')
    await deleteDoc(projectRef)
    console.log('Project deleted successfully')
  } catch (error: any) {
    console.error('Error deleting project:', error)
    console.error('Error code:', error?.code)
    console.error('Error message:', error?.message)
    
    // Handle offline errors gracefully
    if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
      console.warn('Firestore is offline, deletion will sync when online')
      // Try to delete the project document directly (will queue for when online)
      try {
        const projectRef = projectDoc(userId, projectId)
        await deleteDoc(projectRef)
        return
      } catch (offlineError) {
        console.error('Error deleting project offline:', offlineError)
        throw new Error('Failed to delete project. Please try again when online.')
      }
    }
    
    // Re-throw with a user-friendly message
    const errorMessage = error?.message || error?.code || 'Failed to delete project. Please try again.'
    throw new Error(errorMessage)
  }
}

// Canvas data helpers
export async function getCanvasData(userId: string, projectId: string): Promise<CanvasData | null> {
  if (!userId || !projectId) return null
  
  try {
    const canvasRef = canvasDoc(userId, projectId)
    const canvasSnap = await getDoc(canvasRef)
    
    if (!canvasSnap.exists()) return null
    
    const data = canvasSnap.data()
    return {
      ...data,
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as CanvasData
  } catch (error: any) {
    console.error('Error fetching canvas data:', error)
    console.error('Error details:', {
      code: error?.code,
      message: error?.message,
      name: error?.name
    })
    
    // Only return null for truly unavailable scenarios
    if (error?.code === 'unavailable') {
      console.warn('Firestore is unavailable, returning null for canvas data')
      return null
    }
    
    // Don't silently fail for permission errors
    if (error?.code === 'permission-denied') {
      console.error('Permission denied accessing canvas data')
      return null
    }
    
    return null
  }
}

// Save canvas data
export async function saveCanvasData(
  userId: string,
  projectId: string,
  canvasData: Omit<CanvasData, 'updatedAt'>
): Promise<void> {
  if (!userId || !projectId) {
    throw new Error('User ID and Project ID are required')
  }
  
  try {
    const canvasRef = canvasDoc(userId, projectId)
    console.log('Saving canvas data to Firestore:', {
      userId,
      projectId,
      path: `users/${userId}/projects/${projectId}/canvas/data`,
      linesCount: canvasData.lines?.length || 0,
      imagesCount: canvasData.images?.length || 0
    })
    
    await setDoc(canvasRef, {
      ...canvasData,
      updatedAt: serverTimestamp(),
    }, { merge: true })
    
    console.log('Canvas data saved successfully')
  } catch (error: any) {
    console.error('Error saving canvas data:', error)
    console.error('Error details:', {
      code: error?.code,
      message: error?.message,
      stack: error?.stack
    })
    
    // Handle offline/unavailable errors - still try to save (will queue)
    if (error?.code === 'unavailable') {
      console.warn('Firestore is unavailable, queuing save for when online')
      // Still try to save (will queue for when online with persistent cache)
      try {
        const canvasRef = canvasDoc(userId, projectId)
        await setDoc(canvasRef, {
          ...canvasData,
          updatedAt: serverTimestamp(),
        }, { merge: true })
        console.log('Canvas data queued for save (will sync when online)')
        return
      } catch (offlineError: any) {
        console.error('Error queuing canvas data save:', offlineError)
        // Don't throw - let it queue in the cache
        return
      }
    }
    
    // Handle permission errors
    if (error?.code === 'permission-denied') {
      console.error('Permission denied saving canvas data - check Firestore Security Rules')
      throw new Error('Permission denied: Check Firestore Security Rules')
    }
    
    throw error
  }
}

// ==================== User Motifs Functions ====================

// Get all motifs for a user
export async function getUserMotifs(userId: string): Promise<Motif[]> {
  if (!userId) return []
  
  try {
    const motifsRef = motifsCollection(userId)
    const motifsSnap = await getDocs(motifsRef)
    
    const motifs: Motif[] = []
    motifsSnap.forEach((doc) => {
      const data = doc.data()
      motifs.push({
        id: doc.id,
        name: data.name || 'Unnamed Motif',
        data: data.data || '',
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      })
    })
    
    // Sort by creation date (newest first)
    motifs.sort((a, b) => {
      const aDate = a.createdAt instanceof Date ? a.createdAt : (a.createdAt as Timestamp).toDate()
      const bDate = b.createdAt instanceof Date ? b.createdAt : (b.createdAt as Timestamp).toDate()
      return bDate.getTime() - aDate.getTime()
    })
    
    console.log(`Loaded ${motifs.length} motifs for user ${userId}`)
    return motifs
  } catch (error: any) {
    console.error('Error fetching user motifs:', error)
    if (error?.code === 'unavailable') {
      console.warn('Firestore is unavailable, returning empty array for motifs')
      return []
    }
    if (error?.code === 'permission-denied') {
      console.error('Permission denied accessing user motifs')
      return []
    }
    return []
  }
}

// Save a motif for a user
export async function saveUserMotif(
  userId: string,
  motif: { id: string; name: string; data: string }
): Promise<void> {
  if (!userId || !motif.id) {
    throw new Error('User ID and Motif ID are required')
  }
  
  try {
    const motifRef = motifDoc(userId, motif.id)
    await setDoc(motifRef, {
      name: motif.name,
      data: motif.data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true })
    
    console.log('Motif saved successfully:', motif.id, motif.name)
  } catch (error: any) {
    console.error('Error saving motif:', error)
    if (error?.code === 'permission-denied') {
      throw new Error('Permission denied: Check Firestore Security Rules')
    }
    throw error
  }
}

// Delete a motif for a user
export async function deleteUserMotif(userId: string, motifId: string): Promise<void> {
  if (!userId || !motifId) {
    throw new Error('User ID and Motif ID are required')
  }
  
  try {
    const motifRef = motifDoc(userId, motifId)
    await deleteDoc(motifRef)
    console.log('Motif deleted successfully:', motifId)
  } catch (error: any) {
    console.error('Error deleting motif:', error)
    if (error?.code === 'permission-denied') {
      throw new Error('Permission denied: Check Firestore Security Rules')
    }
    throw error
  }
}

// Update a motif for a user
export async function updateUserMotif(
  userId: string,
  motifId: string,
  updates: { name?: string; data?: string }
): Promise<void> {
  if (!userId || !motifId) {
    throw new Error('User ID and Motif ID are required')
  }
  
  try {
    const motifRef = motifDoc(userId, motifId)
    await updateDoc(motifRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
    console.log('Motif updated successfully:', motifId)
  } catch (error: any) {
    console.error('Error updating motif:', error)
    if (error?.code === 'permission-denied') {
      throw new Error('Permission denied: Check Firestore Security Rules')
    }
    throw error
  }
}

