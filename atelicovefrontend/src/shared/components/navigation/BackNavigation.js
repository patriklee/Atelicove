import React, { useLayoutEffect, useRef } from 'react';
import { Button } from '@mui/material';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { AppIcon, icons } from '../../icons';

const HISTORY_MARKER = 'atelicoveBack';
const applicationRoot = pathname => pathname.match(/^\/(admin|worker)(?:\/|$)/)?.[1];

// Annotate router-owned entries with whether their immediate predecessor is safe.
// The router still owns the stack, index, URL and user state. Entry metadata survives
// refresh and POP navigation without a second history stack or session storage.
export function BackNavigationProvider({ children }) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const previous = useRef(null);

  useLayoutEffect(() => {
    const state = window.history.state;
    const root = applicationRoot(location.pathname);
    const current = {
      key: location.key, index: state?.idx, root,
      safe: Boolean(root && state?.[HISTORY_MARKER]?.index === state?.idx
        && state?.[HISTORY_MARKER]?.root === root),
    };
    const prior = previous.current;

    if (prior && prior.key !== current.key && navigationType !== 'POP') {
      const safe = Boolean(root && root === prior.root && (
        navigationType === 'PUSH'
          ? Number.isInteger(prior.index) && current.index === prior.index + 1
          : prior.safe && current.index === prior.index
      ));
      current.safe = safe;
      window.history.replaceState({
        ...state,
        [HISTORY_MARKER]: safe ? { index: current.index, root } : null,
      }, '');
    }
    previous.current = current;
  }, [location, navigationType]);

  return children;
}

export default function BackNavigation({ fallback, label = 'Back', sx }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleBack = () => {
    const state = window.history.state;
    const root = applicationRoot(location.pathname);
    if (root && Number.isInteger(state?.idx) && state.idx > 0
      && state[HISTORY_MARKER]?.index === state.idx
      && state[HISTORY_MARKER]?.root === root) {
      navigate(-1);
      return;
    }
    const landing = root === 'worker' ? '/worker/my-assignments' : '/admin';
    const destination = fallback && /^\/(admin|worker)(?:\/[\w-]+)*\/?$/.test(fallback)
      && applicationRoot(fallback) === root
      && fallback !== location.pathname ? fallback : landing;
    navigate(destination, { replace: true });
  };

  return (
    <Button
      startIcon={<AppIcon icon={icons.back} />}
      onClick={handleBack}
      aria-label={label}
      sx={[
        {
          mb: 2, alignSelf: 'flex-start',
          '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {label}
    </Button>
  );
}
