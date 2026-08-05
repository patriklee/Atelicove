import React, { useEffect, useState } from 'react';
import { keyframes } from '@emotion/react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { ReactComponent as SplashMark } from '../assets/branding/community/atelicove-splash-mark.svg';

const SPLASH_DURATION_MS = 5000;
const LAUNCHING_AT_MS = 4000;

const growPetal = keyframes`
  0% { opacity: 0; transform: translateY(18px) scale(0.12); }
  65% { opacity: 0.88; }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`;

const revealBrand = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

const breatheGlow = keyframes`
  0%, 100% { opacity: 0.35; transform: translate(-50%, -50%) scale(0.72); }
  50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.08); }
`;

const pulseDot = keyframes`
  0%, 100% { opacity: 0.35; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1); }
`;

const driftLeaf = keyframes`
  0% { opacity: 0; transform: translate3d(0, -8px, 0) rotate(-28deg); }
  35% { opacity: 0.55; }
  100% { opacity: 0; transform: translate3d(-24px, 54px, 0) rotate(18deg); }
`;

const exitSplash = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

function FloatingLeaf({ delay, left, top }) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        animation: `${driftLeaf} 3.5s ease-in-out ${delay}ms both`,
        backgroundColor: 'brand.secondary',
        borderRadius: '100% 0 100% 0',
        filter: 'blur(1px)',
        height: 10,
        left,
        position: 'absolute',
        top,
        width: 18,
      }}
    />
  );
}

export default function StartupSplash({ onComplete }) {
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      const reducedTimer = window.setTimeout(onComplete, 80);
      return () => window.clearTimeout(reducedTimer);
    }

    const launchingTimer = window.setTimeout(() => setLaunching(true), LAUNCHING_AT_MS);
    const completeTimer = window.setTimeout(onComplete, SPLASH_DURATION_MS);

    return () => {
      window.clearTimeout(launchingTimer);
      window.clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <Box
      aria-label="Atelicove is preparing your workspace"
      role="status"
      sx={{
        alignItems: 'center',
        animation: `${exitSplash} 500ms ease 4500ms forwards`,
        background: theme => `radial-gradient(circle at 50% 43%, ${theme.palette.brand.soft} 0%, ${theme.palette.background.default} 44%, ${theme.palette.background.subtle} 100%)`,
        display: 'flex',
        flexDirection: 'column',
        inset: 0,
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'fixed',
        zIndex: theme => theme.zIndex.modal + 1,
      }}
    >
      <FloatingLeaf delay={170} left="18%" top="26%" />
      <FloatingLeaf delay={875} left="82%" top="18%" />
      <FloatingLeaf delay={1920} left="12%" top="72%" />
      <FloatingLeaf delay={2540} left="88%" top="64%" />

      <Box
        aria-hidden="true"
        sx={{
          animation: `${breatheGlow} 1875ms ease-in-out 170ms both`,
          background: 'radial-gradient(circle, rgba(255, 247, 199, 0.95) 0%, rgba(255, 247, 199, 0) 68%)',
          borderRadius: '50%',
          height: 150,
          left: '50%',
          position: 'absolute',
          top: 'calc(48% - 1in)',
          width: 230,
        }}
      />

      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transform: 'translateY(-1in)',
        }}
      >
        <Box
          aria-hidden="true"
          component={SplashMark}
          focusable="false"
          sx={{
            height: 'auto',
            mb: 1.25,
            overflow: 'visible',
            position: 'relative',
            width: 'clamp(180px, 24vw, 270px)',
            '& #petal-center': {
              animation: `${growPetal} 750ms cubic-bezier(0.2, 0.8, 0.2, 1) 250ms both`,
            },
            '& #petal-upper-left, & #petal-upper-right': {
              animation: `${growPetal} 770ms cubic-bezier(0.2, 0.8, 0.2, 1) 940ms both`,
            },
            '& #petal-lower-left, & #petal-lower-right': {
              animation: `${growPetal} 770ms cubic-bezier(0.2, 0.8, 0.2, 1) 1625ms both`,
            },
          }}
        />

      <Box
        sx={{
          animation: `${revealBrand} 710ms ease 2460ms both`,
          position: 'relative',
          textAlign: 'center',
        }}
      >
        <Typography
          color="primary.dark"
          fontSize="clamp(1.6rem, 3vw, 2.35rem)"
          fontWeight={600}
          letterSpacing="0.28em"
          lineHeight={1.25}
          sx={{ pl: '0.28em' }}
        >
          ATELICOVE
        </Typography>
        <Typography color="brand.primary" fontSize="clamp(0.95rem, 1.6vw, 1.2rem)" letterSpacing="0.04em">
          Organize. Build. Grow.
        </Typography>
      </Box>

      <Box
        aria-live="polite"
        sx={{
          alignItems: 'center',
          color: 'navigation.background',
          display: 'flex',
          gap: 1.25,
          left: '50%',
          minHeight: 32,
          position: 'absolute',
          top: 'calc(100% + 0.5in)',
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
        }}
      >
        {launching ? (
          <CircularProgress aria-hidden="true" color="inherit" size={23} thickness={3.5} />
        ) : (
          <Box
            aria-hidden="true"
            sx={{
              backgroundColor: 'brand.primary',
              borderRadius: '100% 0 100% 0',
              height: 14,
              transform: 'rotate(-10deg)',
              width: 14,
            }}
          />
        )}
        <Typography fontSize="0.98rem">
          {launching ? 'Launching…' : 'Preparing workspace…'}
        </Typography>
        {!launching && (
          <Box aria-hidden="true" sx={{ display: 'flex', gap: 0.55, ml: 0.25 }}>
            {[0, 1, 2].map(index => (
              <Box
                key={index}
                sx={{
                  animation: `${pulseDot} 1500ms ease-in-out ${3125 + index * 250}ms infinite`,
                  backgroundColor: 'brand.secondary',
                  borderRadius: '50%',
                  height: 5,
                  opacity: 0,
                  width: 5,
                }}
              />
            ))}
          </Box>
        )}
      </Box>
      </Box>
    </Box>
  );
}
