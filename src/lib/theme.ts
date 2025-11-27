import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: { default: '#fafafa', paper: '#ffffff' },
    text: { primary: '#212121', secondary: '#757575' },
  },
  typography: {
    fontFamily: 'Inter, Roboto, Helvetica, Arial, sans-serif',
  },
  shape: { borderRadius: 8 },
})


