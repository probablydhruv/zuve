'use client'

import { useState } from 'react'
import { AppBar, Toolbar, Button, Box, Menu, MenuItem, Typography, Divider } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/components/providers/AuthProvider'
import { ChevronDown } from 'lucide-react'

export default function Header() {
  const { user, loading, signInWithGoogle, signOutUser } = useAuth()
  const theme = useTheme()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleSignOut = () => {
    handleClose()
    signOutUser()
  }

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: theme.palette.background.default,
        borderBottom: `1px solid ${theme.palette.divider}`
      }}
    >
      <Toolbar sx={{ gap: 2 }}>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <Image
              src={theme.palette.mode === 'dark' ? "/zuve-logo.png" : "/logo.png"}
              alt="Zuve Studio Logo"
              width={theme.palette.mode === 'dark' ? 69 : 180}
              height={theme.palette.mode === 'dark' ? 23 : 60}
              style={{
                objectFit: 'contain',
                maxWidth: theme.palette.mode === 'dark' ? '69px' : '180px',
                maxHeight: theme.palette.mode === 'dark' ? '23px' : '60px',
                width: 'auto',
                height: 'auto',
                marginLeft: theme.palette.mode === 'dark' ? '0.7cm' : '0'
              }}
            />
          </Link>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Link href="/projects" style={{ textDecoration: 'none' }}>
            <Button
              sx={{
                color: theme.palette.text.primary,
                '&:hover': {
                  bgcolor: theme.palette.mode === 'light'
                    ? 'rgba(0,0,0,0.04)'
                    : 'rgba(255,255,255,0.08)'
                }
              }}
            >
              Projects
            </Button>
          </Link>
          {!loading && (
            user ? (
              <>
                <Button
                  onClick={handleClick}
                  sx={{
                    color: theme.palette.text.primary,
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'light'
                        ? 'rgba(0,0,0,0.04)'
                        : 'rgba(255,255,255,0.08)'
                    }
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {user.displayName || user.email?.split('@')[0] || 'User'}
                  </Typography>
                  <ChevronDown size={16} />
                </Button>
                <Menu
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleClose}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      minWidth: 160,
                      borderRadius: 2,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      border: `1px solid ${theme.palette.divider}`
                    }
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <MenuItem 
                    onClick={handleClose}
                    component={Link}
                    href="/pricing"
                    sx={{ 
                      fontSize: '0.875rem',
                      py: 1.5,
                      px: 2
                    }}
                  >
                    Upgrade Plan
                  </MenuItem>
                  <Divider />
                  <MenuItem 
                    onClick={handleSignOut}
                    sx={{ 
                      fontSize: '0.875rem',
                      py: 1.5,
                      px: 2,
                      color: theme.palette.error.main
                    }}
                  >
                    Sign out
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                variant="contained"
                onClick={signInWithGoogle}
                sx={{
                  bgcolor: '#000000',
                  color: '#ffffff',
                  '&:hover': { bgcolor: '#333333' }
                }}
              >
                Sign in
              </Button>
            )
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}


