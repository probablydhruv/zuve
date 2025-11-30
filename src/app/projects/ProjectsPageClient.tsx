'use client'

import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Container, 
  Skeleton, 
  Typography, 
  IconButton, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField,
  Tooltip
} from '@mui/material'
import { Edit, Delete } from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'

// Helper function to detect if user is on mobile
const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false
  const userAgent = navigator.userAgent
  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
  const isTablet = /iPad|Android(?=.*\bMobile\b)/i.test(userAgent)
  const isMobileViewport = window.innerWidth < 768
  return (isMobile && !isTablet) || isMobileViewport
}
import { 
  getUserProjects, 
  createProject, 
  updateProject, 
  deleteProject as deleteProjectFromFirestore,
  type Project 
} from '@/lib/firestore'

export default function ProjectsPageClient() {
  const { user, loading, signInWithGoogle } = useAuth()
  const router = useRouter()

  const [projects, setProjects] = useState<Project[] | null>(null)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [deleteProject, setDeleteProject] = useState<Project | null>(null)
  const [newName, setNewName] = useState('')
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [creatingProject, setCreatingProject] = useState(false)
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Generate next project number
  const getNextProjectNumber = (existingProjects: Project[]): number => {
    const projectNumbers = existingProjects
      .map(p => {
        // Match both "Project1" and "Project 1" formats
        const match = p.name.match(/^Project\s*(\d+)$/i)
        return match ? parseInt(match[1]) : 0
      })
      .filter(n => n > 0)
    
    return projectNumbers.length > 0 ? Math.max(...projectNumbers) + 1 : 1
  }

  // Load projects from Firestore
  const loadProjects = async (userId: string) => {
    setLoadingProjects(true)
    try {
      const userProjects = await getUserProjects(userId)
      setProjects(userProjects)
    } catch (error) {
      console.error('Error loading projects:', error)
      setProjects([])
    } finally {
      setLoadingProjects(false)
    }
  }

  // Create new project
  const createNewProject = async () => {
    console.log('createNewProject called')
    if (creatingProject) {
      console.log('Already creating project, ignoring click')
      return
    }
    if (!user?.uid) {
      console.error('User not authenticated, cannot create project')
      setError('User not authenticated')
      return
    }
    
    setCreatingProject(true)
    setError(null) // Clear previous errors
    
    try {
      console.log('Fetching existing projects...')
      // Fetch fresh projects from Firestore to get accurate count
      const existingProjects = await getUserProjects(user.uid)
      console.log('Existing projects fetched:', existingProjects.length)
      
      const nextNumber = getNextProjectNumber(existingProjects)
      console.log('Next project number:', nextNumber)
      
      const projectData = {
        name: `Project ${nextNumber}`,
        description: 'New project',
      }
      
      console.log('Calling createProject with:', projectData)
      const projectId = await createProject(user.uid, projectData)
      console.log('Project created, ID:', projectId)
      
      // Reload projects to get the new one
      console.log('Reloading projects...')
      await loadProjects(user.uid)
      
      // Navigate to the new project
      console.log('Navigating to canvas...')
      // Redirect mobile users to mcanvas, desktop users to canvas
      if (isMobileDevice()) {
        router.push(`/mcanvas?projectId=${projectId}`)
      } else {
        router.push(`/canvas/${projectId}`)
      }
    } catch (error: unknown) {
      console.error('Error creating project:', error)
      const errMsg = error instanceof Error ? error.message : 'Unknown error'
      setError(`Failed to create project: ${errMsg}`)
    } finally {
      setCreatingProject(false)
    }
  }

  // Cleanup duplicate projects (one-time function)
  const cleanupDuplicateProjects = async () => {
    if (!user?.uid) return
    
    try {
      const allProjects = await getUserProjects(user.uid)
      
      // Find projects with duplicate names
      const nameGroups = allProjects.reduce((acc, project) => {
        const name = project.name.trim()
        if (!acc[name]) {
          acc[name] = []
        }
        acc[name].push(project)
        return acc
      }, {} as Record<string, Project[]>)
      
      // Delete duplicates (keep the first one, delete the rest)
      const duplicatesToDelete: string[] = []
      for (const [, projectsWithName] of Object.entries(nameGroups)) {
        if (projectsWithName.length > 1) {
          // Sort by creation date, keep the oldest, delete the rest
          const sorted = projectsWithName.sort((a, b) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt.toDate().getTime()
            const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt.toDate().getTime()
            return dateA - dateB
          })
          
          // Keep the first one, mark the rest for deletion
          for (let i = 1; i < sorted.length; i++) {
            duplicatesToDelete.push(sorted[i].id)
          }
        }
      }
      
      // Delete all duplicates
      for (const projectId of duplicatesToDelete) {
        await deleteProjectFromFirestore(user.uid, projectId)
        console.log(`Deleted duplicate project: ${projectId}`)
      }
      
      // Reload projects
      await loadProjects(user.uid)
      
      if (duplicatesToDelete.length > 0) {
        console.log(`Cleaned up ${duplicatesToDelete.length} duplicate projects`)
        alert(`Cleaned up ${duplicatesToDelete.length} duplicate project(s)`)
      } else {
        alert('No duplicate projects found')
      }
    } catch (error) {
      console.error('Error cleaning up duplicates:', error)
      alert('Error cleaning up duplicates. Please try again.')
    }
  }

  // Rename project
  const handleRenameProject = async () => {
    if (!editingProject || !newName.trim() || !user?.uid) return
    
    try {
      await updateProject(user.uid, editingProject.id, {
        name: newName.trim(),
      })
      
      // Reload projects
      await loadProjects(user.uid)
      setEditingProject(null)
      setNewName('')
    } catch (error) {
      console.error('Error updating project:', error)
    }
  }

  // Delete project
  const handleDeleteProject = async () => {
    if (!deleteProject || !user?.uid) {
      setError('Unable to delete: User not authenticated')
      return
    }
    
    const projectIdToDelete = deleteProject.id
    setDeletingProjectId(projectIdToDelete)
    setError(null)
    
    try {
      console.log('Attempting to delete project:', projectIdToDelete, 'for user:', user.uid)
      
      // Add timeout to prevent hanging
      const deletePromise = deleteProjectFromFirestore(user.uid, projectIdToDelete)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Delete operation timed out after 10 seconds')), 10000)
      )
      
      await Promise.race([deletePromise, timeoutPromise])
      console.log('Project deleted successfully, reloading projects...')
      
      // Reload projects to reflect the deletion
      await loadProjects(user.uid)
      
      // Close dialog and reset state
      setDeleteProject(null)
      setDeletingProjectId(null)
      setError(null)
    } catch (error: unknown) {
      console.error('Error deleting project:', error)
      const err = error as Error & { code?: string }
      console.error('Error details:', {
        message: err?.message,
        code: err?.code,
        stack: err?.stack
      })
      const errorMessage = err?.message || 'Failed to delete project. Please try again.'
      setError(errorMessage)
      setDeletingProjectId(null)
    }
  }

  // Start editing
  const startEditing = (project: Project) => {
    setEditingProject(project)
    setNewName(project.name)
  }

  useEffect(() => {
    if (loading) return
    if (!user?.uid) return
    
    // Load projects from Firestore
    loadProjects(user.uid)
  }, [loading, user])

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="text" width={240} height={40} />
        <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={160} />
          ))}
        </Box>
      </Container>
    )
  }

  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Sign in to view projects</Typography>
        <Button variant="contained" onClick={signInWithGoogle} sx={{
          bgcolor: '#000000',
          color: '#ffffff',
          '&:hover': { bgcolor: '#333333' }
        }}>Sign in with Google</Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">My Projects</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            onClick={cleanupDuplicateProjects}
            disabled={loadingProjects || creatingProject}
            sx={{ color: '#666666', borderColor: '#666666' }}
          >
            Clean Duplicates
          </Button>
          <Button 
            variant="contained" 
            onClick={createNewProject} 
            disabled={creatingProject || loadingProjects}
            sx={{
              bgcolor: '#000000',
              color: '#ffffff',
              '&:hover': { bgcolor: '#333333' },
              '&:disabled': { bgcolor: '#666666', color: '#999999' }
            }}
          >
            {creatingProject ? 'Creating...' : 'New Project'}
          </Button>
        </Box>
      </Box>
      {loadingProjects ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={160} />
          ))}
        </Box>
      ) : projects && projects.length > 0 ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          {projects.map(p => (
          <Card key={p.id} sx={{ position: 'relative' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="h6" sx={{ flex: 1, pr: 1 }}>{p.name}</Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Rename project">
                    <IconButton 
                      size="small" 
                      onClick={() => startEditing(p)}
                      sx={{ 
                        color: 'text.secondary',
                        '&:hover': { color: 'primary.main' }
                      }}
                    >
                      <Edit sx={{ fontSize: '0.875rem' }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete project">
                    <IconButton 
                      size="small" 
                      onClick={() => setDeleteProject(p)}
                      sx={{ 
                        color: 'text.secondary',
                        '&:hover': { color: 'error.main' }
                      }}
                    >
                      <Delete sx={{ fontSize: '0.875rem' }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <Typography color="text.secondary" sx={{ mb: 2 }}>{p.description || 'No description'}</Typography>
              <Button 
                fullWidth
                sx={{ 
                  bgcolor: '#000000', 
                  color: '#ffffff', 
                  '&:hover': { bgcolor: '#333333' } 
                }} 
                onClick={() => {
                  // Redirect mobile users to mcanvas, desktop users to canvas
                  if (isMobileDevice()) {
                    router.push(`/mcanvas?projectId=${p.id}`)
                  } else {
                    router.push(`/canvas/${p.id}`)
                  }
                }}
              >
                Open
              </Button>
            </CardContent>
          </Card>
          ))}
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            No projects yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first project to get started
          </Typography>
          <Button variant="contained" onClick={createNewProject} sx={{
            bgcolor: '#000000',
            color: '#ffffff',
            '&:hover': { bgcolor: '#333333' }
          }}>
            Create Project
          </Button>
        </Box>
      )}

      {/* Rename Dialog */}
      <Dialog open={!!editingProject} onClose={() => setEditingProject(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Rename Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            fullWidth
            variant="outlined"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleRenameProject()
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingProject(null)}>Cancel</Button>
          <Button 
            onClick={handleRenameProject} 
            variant="contained"
            disabled={!newName.trim()}
            sx={{ bgcolor: '#000000', color: '#ffffff', '&:hover': { bgcolor: '#333333' } }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteProject} onClose={() => !deletingProjectId && setDeleteProject(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: error ? 2 : 0 }}>
            Are you sure you want to delete &quot;{deleteProject?.name}&quot;? This action cannot be undone.
          </Typography>
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDeleteProject(null)
              setError(null)
            }} 
            disabled={!!deletingProjectId}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteProject} 
            variant="contained"
            color="error"
            disabled={!!deletingProjectId}
            sx={{ bgcolor: '#d32f2f', color: '#ffffff', '&:hover': { bgcolor: '#b71c1c' } }}
          >
            {deletingProjectId ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
