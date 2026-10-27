import React from 'react';
import { TextEncoder, TextDecoder } from 'util';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
// CRA's Jest resolver predates package exports used by react-router-dom v7.
// Its declarative browser API is re-exported unchanged from react-router.
jest.mock('react-router-dom', () => jest.requireActual('react-router'));
const { BrowserRouter, useLocation, useNavigate } = require('react-router-dom');
const { default: BackNavigation, BackNavigationProvider } = require('./BackNavigation');

function Page() {
  const location = useLocation();
  const navigate = useNavigate();
  return <>
    <output data-testid="location">{location.pathname}{location.search}{location.hash}</output>
    <output data-testid="selection">{location.state?.selected}</output>
    <BackNavigation />
    <button onClick={() => navigate('/admin/workers?search=lee&page=2#results', { state: { selected: '42' } })}>Workers</button>
    <button onClick={() => navigate('/admin/workers/42')}>Worker detail</button>
    <button onClick={() => navigate('/admin/companies?sort=name')}>Companies</button>
    <button onClick={() => navigate('/admin/companies/7')}>Company detail</button>
    <button onClick={() => navigate('/admin/documents')}>Documents</button>
    <button onClick={() => navigate('/login', { replace: true })}>Login replace</button>
    <button onClick={() => navigate('/admin/workers/42', { replace: true })}>Detail replace</button>
  </>;
}
const mount = () => render(<BrowserRouter><BackNavigationProvider><Page /></BackNavigationProvider></BrowserRouter>);
const click = name => fireEvent.click(screen.getByRole('button', { name, exact: true }));
const expectRoute = route => expect(screen.getByTestId('location').textContent).toBe(route);
const pop = async direction => {
  await act(async () => {
    await new Promise(resolve => {
      window.addEventListener('popstate', resolve, { once: true });
      window.history.go(direction);
    });
  });
};

beforeEach(() => window.history.replaceState({ idx: 0 }, '', '/admin'));

test('worker Back restores URL and selection; native Forward and Back still work', async () => {
  mount();
  click('Workers');
  click('Worker detail');
  click('Back');
  await waitFor(() => expectRoute('/admin/workers?search=lee&page=2#results'));
  expect(screen.getByTestId('selection').textContent).toBe('42');
  await pop(1);
  expectRoute('/admin/workers/42');
  await pop(-1);
  expectRoute('/admin/workers?search=lee&page=2#results');
});

test('company details and navigation between lists return to the preceding page', async () => {
  mount();
  click('Companies');
  click('Company detail');
  click('Back');
  await waitFor(() => expectRoute('/admin/companies?sort=name'));
  click('Documents');
  click('Back');
  await waitFor(() => expectRoute('/admin/companies?sort=name'));
});

test('direct visits with external or missing history fall back with replace', () => {
  window.history.replaceState({ idx: 0, key: 'replaced-entry' }, '', '/admin/workers/42');
  mount();
  click('Back');
  expectRoute('/admin');
  expect(window.history.state.idx).toBe(0);
});

test('an unmarked positive router index is treated as unknown history', () => {
  window.history.replaceState({ idx: 8, key: 'unknown' }, '', '/admin/companies/7');
  mount();
  click('Back');
  expectRoute('/admin');
});

test('entry metadata survives a router remount as on refresh', async () => {
  const view = mount();
  click('Companies');
  click('Company detail');
  view.unmount();
  mount();
  click('Back');
  await waitFor(() => expectRoute('/admin/companies?sort=name'));
});

test('a login entry followed by a replace cannot lead Back out of the application', () => {
  mount();
  click('Login replace');
  click('Detail replace');
  click('Back');
  expectRoute('/admin');
});

test('replacing an application entry preserves its safe predecessor', async () => {
  mount();
  click('Companies');
  click('Detail replace');
  click('Back');
  await waitFor(() => expectRoute('/admin'));
});

test('worker direct entry falls back to the worker landing page', () => {
  window.history.replaceState(null, '', '/worker/my-assignments/3');
  mount();
  click('Back');
  expectRoute('/worker/my-assignments');
});

test('invalid entry metadata does not permit history traversal', () => {
  window.history.replaceState({ idx: 1, atelicoveBack: { index: 2, root: 'admin' } }, '', '/admin/workers/42');
  mount();
  click('Back');
  expectRoute('/admin');
});
