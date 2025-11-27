'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Container,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { Check, Sparkles, Wand2, Library, Layers, PenTool, Headphones } from 'lucide-react'

type BillingCycle = 'monthly' | 'annual'

type Currency = 'INR' | 'USD'

type PlanKey = 'Free' | 'Plus' | 'Pro' | 'Max'

const basePricesMonthly: Record<PlanKey, { INR?: number; USD?: number }> = {
  Free: {},
  Plus: { INR: 499, USD: 4.99 },
  Pro: { INR: 5999, USD: 69 },
  Max: { INR: 12999, USD: 149 },
}

const planNotes: Record<PlanKey, string> = {
  Free: 'Good for everyone',
  Plus: 'Great for occasional jewellery designers',
  Pro: 'Perfect for professional Jewellery Designers',
  Max: 'Most productive for jewellery brands and heavy users',
}

const planFeatures: Record<PlanKey, string[]> = {
  Free: [
    'Limited Usage',
    'Sketch to Jewellery',
    'Harmonize Collection',
    'Aura Assist',
  ],
  Plus: [
    '2x more usage than Free',
    'Sketch to Jewellery',
    'Harmonize Collection',
    'Aura Assist',
    'Motif Library',
  ],
  Pro: [
    '10x more usage than Free',
    'Sketch to Jewellery',
    'Harmonize Collection',
    'Aura Assist',
    'Motif Library',
    'Content Builder',
  ],
  Max: [
    '25x more usage than Free',
    'Sketch to Jewellery',
    'Harmonize Collection',
    'Aura Assist',
    'Motif Library',
    'Content Builder',
    'Signature Style',
    'Priority Support',
  ],
}

function detectCurrency(): Currency {
  if (typeof window === 'undefined') return 'USD'
  const locale = Intl.DateTimeFormat().resolvedOptions().locale || navigator.language || ''
  return /-IN|_IN|\bIN\b/i.test(locale) ? 'INR' : 'USD'
}

function formatPrice(val: number, currency: Currency) {
  const formatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    currencyDisplay: 'symbol',
    maximumFractionDigits: currency === 'INR' ? 0 : 2,
  })
  return formatter.format(val)
}

export default function PricingPageClient() {
  const [billing, setBilling] = useState<BillingCycle>('monthly')
  const [couponCode, setCouponCode] = useState<string>('')
  const [couponApplied, setCouponApplied] = useState<boolean>(false)
  const [currency, setCurrency] = useState<Currency>('USD')

  useEffect(() => {
    setCurrency(detectCurrency())
  }, [])

  const computePrice = (plan: PlanKey) => {
    const basePrice = basePricesMonthly[plan][currency] || 0
    if (billing === 'annual') {
      return basePrice * 12 * 0.9 // 10% annual discount
    }
    return basePrice
  }

  const billedNote = billing === 'monthly' ? 'Billed monthly' : 'Billed annually (10% off)'

  const iconForFeature = (feature: string, size = 16) => {
    if (/Signature Style/i.test(feature)) return <Sparkles size={size} />
    if (/Motif Library/i.test(feature)) return <Library size={size} />
    if (/Content Builder/i.test(feature)) return <PenTool size={size} />
    if (/Priority Support/i.test(feature)) return <Headphones size={size} />
    if (/Harmonize/i.test(feature)) return <Layers size={size} />
    if (/Aura Assist/i.test(feature)) return <Wand2 size={size} />
    return <Check size={size} />
  }

  const plans: PlanKey[] = ['Free', 'Plus', 'Pro', 'Max']

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: { xs: 6, md: 10 } }}>
      <Container maxWidth="xl">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 1 }}>Pricing</Typography>
          <Typography variant="h6" color="text.secondary">Simple pricing for powerful jewellery design workflows</Typography>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="center" sx={{ mb: 4 }}>
          <ToggleButtonGroup
            exclusive
            value={billing}
            onChange={(_, v) => v && setBilling(v)}
            size="small"
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 999,
              p: 0.5,
              overflow: 'hidden',
              bgcolor: 'background.paper',
              '& .MuiToggleButtonGroup-grouped': {
                textTransform: 'none',
                px: 2.25,
                py: 0.75,
                border: 0,
                borderRadius: 999,
                color: 'text.secondary',
                '&:not(.Mui-selected):hover': { bgcolor: 'action.hover' },
                '&.Mui-selected': {
                  bgcolor: '#000000',
                  color: '#ffffff',
                  borderRadius: 999,
                  '&:hover': { bgcolor: '#333333' }
                }
              }
            }}
          >
            <ToggleButton value="monthly">Monthly</ToggleButton>
            <ToggleButton value="annual">Annual</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)'
          },
          gap: 3,
          alignItems: 'stretch'
        }}>
          {plans.map((plan) => {
            const emphasized = plan === 'Pro' || plan === 'Max'
            return (
              <Box key={plan} sx={{ display: 'flex' }}>
                <Card elevation={emphasized ? 8 : 1} sx={{
                  height: '100%',
                  width: '100%',
                  minWidth: 0,
                  borderRadius: 3,
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  pt: 4,
                  px: 3,
                  pb: 3,
                  bgcolor: emphasized ? 'grey.900' : 'background.paper',
                  color: emphasized ? 'common.white' : 'text.primary',
                  border: emphasized ? '1px solid rgba(255,255,255,0.12)' : '1px solid',
                  borderColor: emphasized ? 'rgba(255,255,255,0.12)' : 'divider',
                  transition: 'transform 220ms ease, box-shadow 220ms ease',
                  '&:hover': {
                    transform: emphasized ? 'translateY(-2px) scale(1.01)' : 'translateY(-1px)',
                    boxShadow: emphasized ? 12 : 4,
                  }
                }}>
                  {plan === 'Pro' && (
                    <Chip
                      label="Recommended"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        borderRadius: 999,
                        px: 1,
                        bgcolor: 'transparent',
                        background: 'linear-gradient(135deg, #1f2937 0%, #064e3b 100%)',
                        color: '#ffffff',
                        border: '1px solid rgba(0,0,0,0.18)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.24)',
                        '& .MuiChip-label': { px: 1.25, fontWeight: 700 },
                      }}
                    />
                  )}
                  <CardHeader
                    title={plan}
                    subheader={planNotes[plan]}
                    titleTypographyProps={{ fontWeight: 800, align: 'center' }}
                    subheaderTypographyProps={{ color: emphasized ? 'rgba(255,255,255,0.7)' : 'text.secondary', align: 'center' }}
                    sx={{ '.MuiCardHeader-content': { minHeight: 96 } }}
                  />
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <Stack spacing={1.5} sx={{ mb: 2, alignItems: 'center', textAlign: 'center', minHeight: 128, justifyContent: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                        {plan === 'Free' ? (
                          <Typography variant="h4" component="div" sx={{ fontWeight: 900 }}>
                            {currency === 'INR' ? '₹0' : '$0'}
                          </Typography>
                        ) : (
                          <Typography variant="h4" component="div" sx={{ fontWeight: 900 }}>
                            {formatPrice(computePrice(plan), currency)}
                          </Typography>
                        )}
                        <Typography
                          component="span"
                          variant="subtitle2"
                          color={emphasized ? 'rgba(255,255,255,0.7)' : 'text.secondary'}
                          sx={{ ml: 1, visibility: plan === 'Free' ? 'hidden' : 'visible' }}
                        >
                          /mo
                        </Typography>
                      </Box>
                      {plan === 'Free' ? (
                        <Typography variant="caption" color={emphasized ? 'rgba(255,255,255,0.7)' : 'text.secondary'} sx={{ visibility: 'hidden' }}>{billedNote}</Typography>
                      ) : (
                        <Typography variant="caption" color={emphasized ? 'rgba(255,255,255,0.7)' : 'text.secondary'}>{billedNote}</Typography>
                      )}
                    </Stack>
                    <Divider sx={{ my: 2, borderColor: emphasized ? 'rgba(255,255,255,0.12)' : 'divider' }} />
                    <List dense sx={{ flexGrow: 1 }}>
                      {planFeatures[plan].map((f) => {
                        const usagePrefixMatch = f.match(/^(10x more usage|25x more usage)/i)
                        const usagePrefix = usagePrefixMatch ? usagePrefixMatch[0] : ''
                        const remainder = usagePrefix ? f.slice(usagePrefix.length) : ''
                        return (
                          <ListItem key={f} sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 28, color: emphasized ? 'rgba(255,255,255,0.9)' : 'text.primary' }}>{iconForFeature(f)}</ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography variant="body2" sx={{ color: emphasized ? 'rgba(255,255,255,0.9)' : undefined }}>
                                  {usagePrefix ? (
                                    <Box component="span" sx={{ fontWeight: 700 }}>{usagePrefix}</Box>
                                  ) : null}
                                  {usagePrefix ? remainder : f}
                                </Typography>
                              }
                            />
                          </ListItem>
                        )
                      })}
                    </List>
                    <Stack sx={{ mt: 2 }}>
                      <Button variant="contained" size="large" fullWidth sx={{ height: 44, borderRadius: 2, bgcolor: '#000000', color: '#ffffff', '&:hover': { bgcolor: '#333333' } }}>
                        {plan === 'Free' ? 'Get Started' : 'Open Zuve Studio'}
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            )
          })}
        </Box>

        {/* Subtle Coupon Input at Bottom */}
        <Box sx={{ textAlign: 'center', mt: 6, pt: 4, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            px: 1,
            py: 0.75,
            borderRadius: 999,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
          }}>
            <TextField
              size="small"
              value={couponCode}
              onChange={(e) => { setCouponCode(e.target.value); setCouponApplied(false) }}
              placeholder="Enter coupon"
              inputProps={{ 'aria-label': 'Coupon code' }}
              sx={{
                minWidth: 180,
                '& .MuiOutlinedInput-root': {
                  p: 0,
                  '& fieldset': { border: 'none' },
                },
                '& input': { px: 1.25, py: 0.75, fontSize: '0.875rem' }
              }}
            />
            <Button
              size="small"
              variant="contained"
              onClick={() => setCouponApplied(Boolean(couponCode.trim()))}
              disabled={!couponCode.trim()}
              sx={{ height: 32, borderRadius: 999, px: 1.75, bgcolor: '#000000', color: '#ffffff', '&:hover': { bgcolor: '#333333' } }}
            >
              Apply
            </Button>
            {couponApplied && (
              <Chip size="small" label="Applied" variant="outlined" />
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  )
}
