import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NotFound from '@/pages/NotFound';
import { paths } from '@/routes/paths';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const TestWrapper = ({ children, initialPath = '/' }: { children: React.ReactNode; initialPath?: string }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter initialEntries={[initialPath]}>
      {children}
    </MemoryRouter>
  </QueryClientProvider>
);

describe('Route Smoke Tests', () => {
  it('should render 404 page for invalid routes', () => {
    const { container } = render(
      <TestWrapper initialPath="/invalid-route-that-does-not-exist">
        <Routes>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TestWrapper>
    );

    expect(container.textContent).toContain('404');
    expect(container.textContent).toMatch(/page not found/i);
  });

  it('should have absolute paths in paths helper', () => {
    // All paths should start with /
    expect(paths.batches()).toMatch(/^\//);
    expect(paths.production()).toMatch(/^\//);
    expect(paths.blending()).toMatch(/^\//);
    expect(paths.cellar()).toMatch(/^\//);
    expect(paths.tasting()).toMatch(/^\//);
    expect(paths.analytics()).toMatch(/^\//);
    expect(paths.suppliers()).toMatch(/^\//);
    expect(paths.auth()).toMatch(/^\//);
    expect(paths.tools.calculators()).toMatch(/^\//);
    expect(paths.tools.costCalculation()).toMatch(/^\//);
    expect(paths.tools.webhooks()).toMatch(/^\//);
    expect(paths.tools.install()).toMatch(/^\//);
  });

  it('should generate correct dynamic paths', () => {
    const testId = '123e4567-e89b-12d3-a456-426614174000';
    
    expect(paths.blend(testId)).toBe(`/blend/${testId}`);
    expect(paths.supplier(testId)).toBe(`/suppliers/${testId}`);
    expect(paths.qr.batch(testId)).toBe(`/r/b/${testId}`);
    expect(paths.qr.blend(testId)).toBe(`/r/l/${testId}`);
  });

  it('should handle auth next parameter correctly', () => {
    const nextPath = '/protected/page';
    const authPath = paths.auth(nextPath);
    
    expect(authPath).toContain('/auth');
    expect(authPath).toContain('next=');
    expect(authPath).toContain(encodeURIComponent(nextPath));
  });
});

describe('Path Helper Consistency', () => {
  it('should not have trailing slashes', () => {
    const allPaths = [
      paths.batches(),
      paths.production(),
      paths.blending(),
      paths.cellar(),
      paths.tasting(),
      paths.analytics(),
      paths.suppliers(),
      paths.tools.calculators(),
      paths.tools.printLabels(),
      paths.tools.floorPlan(),
      paths.tools.costCalculation(),
      paths.tools.webhooks(),
      paths.tools.install(),
    ];

    allPaths.forEach((path) => {
      expect(path).not.toMatch(/\/$/);
    });
  });

  it('should generate print labels path with correct query params', () => {
    const ids = ['id1', 'id2', 'id3'];
    const batchPath = paths.printLabels('batch', ids);
    const blendPath = paths.printLabels('blend', ids);

    expect(batchPath).toContain('/print/labels');
    expect(batchPath).toContain('mode=batch');
    expect(batchPath).toContain('ids=id1,id2,id3');

    expect(blendPath).toContain('mode=blend');
  });
});
